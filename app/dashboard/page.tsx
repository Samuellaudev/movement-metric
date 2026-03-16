import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { workouts, workoutExercises, exercises, sets } from "@/db/schema";
import { eq, and, gte, lt } from "drizzle-orm";
import DatePicker from "./date-picker";

type SearchParams = Promise<{ date?: string }>;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { date } = await searchParams;
  const dateStr = date ?? new Date().toISOString().split("T")[0];
  const [year, month, day] = dateStr.split("-").map(Number);
  const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
  const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

  const rows = await db
    .select()
    .from(workouts)
    .leftJoin(workoutExercises, eq(workoutExercises.workoutId, workouts.id))
    .leftJoin(exercises, eq(exercises.id, workoutExercises.exerciseId))
    .leftJoin(sets, eq(sets.workoutExerciseId, workoutExercises.id))
    .where(
      and(
        eq(workouts.userId, userId),
        gte(workouts.startedAt, startOfDay),
        lt(workouts.startedAt, endOfDay)
      )
    )
    .orderBy(workouts.id, workoutExercises.order, sets.setNumber);

  // Aggregate flat rows into nested workout → exercises → sets
  type ExerciseEntry = {
    id: number;
    order: number;
    name: string;
    sets: { id: number; setNumber: number; reps: number | null; weightKg: string | null }[];
  };
  type WorkoutEntry = {
    id: number;
    name: string | null;
    startedAt: Date | null;
    finishedAt: Date | null;
    exercises: Map<number, ExerciseEntry>;
  };

  const workoutsMap = new Map<number, WorkoutEntry>();

  for (const row of rows) {
    if (!workoutsMap.has(row.workouts.id)) {
      workoutsMap.set(row.workouts.id, {
        id: row.workouts.id,
        name: row.workouts.name,
        startedAt: row.workouts.startedAt,
        finishedAt: row.workouts.finishedAt,
        exercises: new Map(),
      });
    }

    const workout = workoutsMap.get(row.workouts.id)!;

    if (row.workout_exercises) {
      const weId = row.workout_exercises.id;
      if (!workout.exercises.has(weId)) {
        workout.exercises.set(weId, {
          id: weId,
          order: row.workout_exercises.order,
          name: row.exercises?.name ?? "Unknown Exercise",
          sets: [],
        });
      }
      if (row.sets) {
        workout.exercises.get(weId)!.sets.push({
          id: row.sets.id,
          setNumber: row.sets.setNumber,
          reps: row.sets.reps,
          weightKg: row.sets.weightKg,
        });
      }
    }
  }

  const workoutsList = Array.from(workoutsMap.values()).map((w) => ({
    ...w,
    exercises: Array.from(w.exercises.values()),
  }));

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Workout Dashboard</h1>

      <div className="flex items-center gap-3 mb-8">
        <span className="text-sm text-muted-foreground">Date:</span>
        <DatePicker defaultDate={dateStr} />
      </div>

      {workoutsList.length === 0 ? (
        <p className="text-muted-foreground text-sm">No workouts logged for this date.</p>
      ) : (
        <div className="space-y-6">
          {workoutsList.map((workout) => (
            <div key={workout.id} className="border border-border rounded-lg p-5">
              <div className="flex items-start justify-between mb-4">
                <h2 className="font-semibold text-lg">
                  {workout.name ?? "Workout"}
                </h2>
                {workout.startedAt && (
                  <span className="text-xs text-muted-foreground">
                    {workout.startedAt.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {workout.finishedAt &&
                      ` – ${workout.finishedAt.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}`}
                  </span>
                )}
              </div>

              {workout.exercises.length === 0 ? (
                <p className="text-sm text-muted-foreground">No exercises recorded.</p>
              ) : (
                <div className="space-y-4">
                  {workout.exercises.map((exercise) => (
                    <div key={exercise.id}>
                      <h3 className="font-medium text-sm mb-2">{exercise.name}</h3>
                      {exercise.sets.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No sets recorded.</p>
                      ) : (
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-muted-foreground text-xs">
                              <th className="text-left font-medium pb-1 w-12">Set</th>
                              <th className="text-left font-medium pb-1 w-20">Weight</th>
                              <th className="text-left font-medium pb-1">Reps</th>
                            </tr>
                          </thead>
                          <tbody>
                            {exercise.sets.map((set) => (
                              <tr key={set.id} className="border-t border-border/50">
                                <td className="py-1 text-muted-foreground">{set.setNumber}</td>
                                <td className="py-1">
                                  {set.weightKg ? `${set.weightKg} kg` : "—"}
                                </td>
                                <td className="py-1">{set.reps ?? "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
