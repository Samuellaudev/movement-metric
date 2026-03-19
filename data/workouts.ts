import { db } from "@/db";
import { workouts, workoutExercises, exercises, sets } from "@/db/schema";
import { eq, and, gte, lt, asc, max } from "drizzle-orm";

export async function createWorkout(userId: string, name: string, startedAt: Date) {
  return db.insert(workouts).values({ userId, name, startedAt }).returning();
}

export async function getWorkoutById(id: number, userId: string) {
  const result = await db
    .select()
    .from(workouts)
    .where(and(eq(workouts.id, id), eq(workouts.userId, userId)))
    .limit(1);
  return result[0] ?? null;
}

export async function updateWorkout(
  id: number,
  userId: string,
  data: { name: string; startedAt: Date }
) {
  return db
    .update(workouts)
    .set({ name: data.name, startedAt: data.startedAt })
    .where(and(eq(workouts.id, id), eq(workouts.userId, userId)))
    .returning();
}

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

export async function getWorkoutWithExercises(id: number, userId: string) {
  const workoutResult = await db
    .select()
    .from(workouts)
    .where(and(eq(workouts.id, id), eq(workouts.userId, userId)))
    .limit(1);

  const workout = workoutResult[0];
  if (!workout) return null;

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
        workoutExerciseId: workoutExercise.id,
        exerciseId: exercise.id,
        name: exercise.name,
        order: workoutExercise.order,
        sets: setsData,
      };
    })
  );

  return {
    ...workout,
    exercises: exercisesWithSets,
  };
}

export async function getAllExercises() {
  return db.select().from(exercises).orderBy(asc(exercises.name));
}

export async function addExerciseToWorkout(workoutId: number, exerciseId: number, userId: string) {
  const ownerCheck = await db
    .select()
    .from(workouts)
    .where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)))
    .limit(1);

  if (!ownerCheck[0]) return null;

  const maxOrderResult = await db
    .select({ maxOrder: max(workoutExercises.order) })
    .from(workoutExercises)
    .where(eq(workoutExercises.workoutId, workoutId));

  const nextOrder = (maxOrderResult[0]?.maxOrder ?? 0) + 1;

  return db
    .insert(workoutExercises)
    .values({ workoutId, exerciseId, order: nextOrder })
    .returning();
}

export async function removeExerciseFromWorkout(
  workoutExerciseId: number,
  workoutId: number,
  userId: string
) {
  const ownerCheck = await db
    .select({ weId: workoutExercises.id })
    .from(workoutExercises)
    .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
    .where(
      and(
        eq(workoutExercises.id, workoutExerciseId),
        eq(workouts.id, workoutId),
        eq(workouts.userId, userId)
      )
    )
    .limit(1);

  if (!ownerCheck[0]) return null;

  return db.delete(workoutExercises).where(eq(workoutExercises.id, workoutExerciseId));
}

export async function addSet(
  workoutExerciseId: number,
  workoutId: number,
  userId: string,
  reps: number,
  weightKg: string
) {
  const ownerCheck = await db
    .select({ weId: workoutExercises.id })
    .from(workoutExercises)
    .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
    .where(
      and(
        eq(workoutExercises.id, workoutExerciseId),
        eq(workouts.userId, userId)
      )
    )
    .limit(1);

  if (!ownerCheck[0]) return null;

  const maxSetNumberResult = await db
    .select({ maxSetNumber: max(sets.setNumber) })
    .from(sets)
    .where(eq(sets.workoutExerciseId, workoutExerciseId));

  const nextSetNumber = (maxSetNumberResult[0]?.maxSetNumber ?? 0) + 1;

  return db
    .insert(sets)
    .values({ workoutExerciseId, setNumber: nextSetNumber, reps, weightKg })
    .returning();
}

export async function removeSet(setId: number, workoutId: number, userId: string) {
  const ownerCheck = await db
    .select({ setId: sets.id })
    .from(sets)
    .innerJoin(workoutExercises, eq(sets.workoutExerciseId, workoutExercises.id))
    .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
    .where(and(eq(sets.id, setId), eq(workouts.userId, userId)))
    .limit(1);

  if (!ownerCheck[0]) return null;

  return db.delete(sets).where(eq(sets.id, setId));
}
