import { db } from "@/db";
import { workouts, workoutExercises, exercises, sets } from "@/db/schema";
import { eq, and, gte, lt } from "drizzle-orm";

export async function getWorkoutsForDate(userId: string, date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  const workoutsData = await db
    .select()
    .from(workouts)
    .where(
      and(
        eq(workouts.userId, userId),
        gte(workouts.startedAt, start),
        lt(workouts.startedAt, end)
      )
    );

  if (workoutsData.length === 0) return [];

  const result = await Promise.all(
    workoutsData.map(async (workout) => {
      const workoutExercisesData = await db
        .select({
          workoutExercise: workoutExercises,
          exercise: exercises,
        })
        .from(workoutExercises)
        .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
        .where(eq(workoutExercises.workoutId, workout.id))
        .orderBy(workoutExercises.order);

      const exercisesWithSets = await Promise.all(
        workoutExercisesData.map(async ({ workoutExercise, exercise }) => {
          const setsData = await db
            .select()
            .from(sets)
            .where(eq(sets.workoutExerciseId, workoutExercise.id))
            .orderBy(sets.setNumber);

          return {
            id: workoutExercise.id,
            name: exercise.name,
            sets: setsData,
          };
        })
      );

      return {
        ...workout,
        exercises: exercisesWithSets,
      };
    })
  );

  return result;
}
