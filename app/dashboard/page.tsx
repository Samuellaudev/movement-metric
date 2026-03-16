import { auth } from "@clerk/nextjs/server";
import { format } from "date-fns";
import { getWorkoutsForDate } from "@/data/workouts";
import DatePicker from "./date-picker";

interface Props {
  searchParams: Promise<{ date?: string }>;
}

export default async function DashboardPage({ searchParams }: Props) {
  const { date: dateParam } = await searchParams;
  const date = dateParam ? new Date(dateParam) : new Date();

  const { userId } = await auth();
  const workouts = await getWorkoutsForDate(userId!, date);

  const formattedDate = format(date, "do MMM yyyy");

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Workout Dashboard</h1>

      <div className="flex items-center gap-3 mb-8">
        <span className="text-sm text-muted-foreground">Date:</span>
        <DatePicker date={date} />
      </div>

      {workouts.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No workouts logged for {formattedDate}.
        </p>
      ) : (
        <div className="space-y-6">
          {workouts.map((workout) => (
            <div key={workout.id} className="border border-border rounded-lg p-5">
              <div className="flex items-start justify-between mb-4">
                <h2 className="font-semibold text-lg">{workout.name}</h2>
                <span className="text-xs text-muted-foreground">
                  {workout.startedAt && format(workout.startedAt, "h:mm a")}
                  {workout.finishedAt &&
                    ` – ${format(workout.finishedAt, "h:mm a")}`}
                </span>
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
                              <th className="text-left font-medium pb-1 w-24">Weight</th>
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
