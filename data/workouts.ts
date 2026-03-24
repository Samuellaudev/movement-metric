import { db } from "@/db";
import { workouts, workoutExercises, exercises, sets } from "@/db/schema";
import { eq, and, gte, lt, asc, max, sum, count, sql, desc, isNotNull } from "drizzle-orm";
import { format, subDays, subMonths, startOfWeek, startOfMonth, differenceInCalendarDays, parseISO } from "date-fns";

export async function deleteWorkout(id: number, userId: string) {
  return db.delete(workouts).where(and(eq(workouts.id, id), eq(workouts.userId, userId)));
}

export async function createWorkout(userId: string, name: string, startedAt: Date, finishedAt?: Date) {
  return db.insert(workouts).values({ userId, name, startedAt, finishedAt: finishedAt ?? null }).returning();
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
  data: { name: string; startedAt: Date; finishedAt?: Date | null }
) {
  return db
    .update(workouts)
    .set({ name: data.name, startedAt: data.startedAt, finishedAt: data.finishedAt ?? null })
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

export async function getDashboardStats(userId: string) {
  const [totalWorkoutsResult, totalVolumeResult, avgDurationResult, workoutDatesResult] =
    await Promise.all([
      db.select({ value: count() }).from(workouts).where(eq(workouts.userId, userId)),

      db
        .select({ value: sum(sql`${ sets.weightKg } * ${ sets.reps }`) })
        .from(sets)
        .innerJoin(workoutExercises, eq(sets.workoutExerciseId, workoutExercises.id))
        .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
        .where(and(eq(workouts.userId, userId), isNotNull(sets.reps), isNotNull(sets.weightKg))),

      db
        .select({
          value: sql<string>`AVG(EXTRACT(EPOCH FROM (${ workouts.finishedAt } - ${ workouts.startedAt })) / 60)`,
        })
        .from(workouts)
        .where(and(eq(workouts.userId, userId), isNotNull(workouts.finishedAt))),

      db
        .select({ day: sql<Date>`DATE(${ workouts.startedAt })` })
        .from(workouts)
        .where(eq(workouts.userId, userId))
        .groupBy(sql`DATE(${ workouts.startedAt })`)
        .orderBy(desc(sql`DATE(${ workouts.startedAt })`)),
    ]);

  const totalWorkouts = totalWorkoutsResult[0]?.value ?? 0;
  const totalVolumeKg = parseFloat(totalVolumeResult[0]?.value ?? "0") || 0;
  const avgDurationMinutes = parseFloat(avgDurationResult[0]?.value ?? "0") || 0;

  // Compute current streak: count consecutive days backward from the most recent workout date.
  // Normalize to "YYYY-MM-DD" strings first to handle both string and Date object returns from the DB driver.
  let currentStreakDays = 0;
  const sortedDates = workoutDatesResult
    .map((r) => format(r.day, "yyyy-MM-dd"))
    .sort()
    .reverse();
  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0) {
      currentStreakDays = 1;
    } else {
      const diffDays = differenceInCalendarDays(parseISO(sortedDates[i - 1]), parseISO(sortedDates[i]));
      if (diffDays === 1) {
        currentStreakDays++;
      } else {
        break;
      }
    }
  }

  return { totalWorkouts, totalVolumeKg, avgDurationMinutes, currentStreakDays };
}

export async function getWeeklyVolumeData(userId: string) {
  const eightWeeksAgo = subDays(new Date(), 56);

  const rows = await db
    .select({
      week: sql<string>`DATE_TRUNC('week', ${ workouts.startedAt })`,
      volume: sum(sql`${ sets.weightKg } * ${ sets.reps }`),
    })
    .from(sets)
    .innerJoin(workoutExercises, eq(sets.workoutExerciseId, workoutExercises.id))
    .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
    .where(
      and(
        eq(workouts.userId, userId),
        gte(workouts.startedAt, eightWeeksAgo),
        isNotNull(sets.reps),
        isNotNull(sets.weightKg)
      )
    )
    .groupBy(sql`DATE_TRUNC('week', ${ workouts.startedAt })`)
    .orderBy(asc(sql`DATE_TRUNC('week', ${ workouts.startedAt })`));

  const volumeByWeek = new Map(
    rows.map((r) => [r.week.slice(0, 10), parseFloat(r.volume ?? "0") || 0])
  );

  return Array.from({ length: 8 }, (_, i) => {
    const weekStart = startOfWeek(subDays(new Date(), (7 - i) * 7), { weekStartsOn: 1 });
    const key = weekStart.toISOString().slice(0, 10);
    return {
      week: format(weekStart, "do MMM"),
      volumeKg: volumeByWeek.get(key) ?? 0,
    };
  });
}

export async function getMonthlyWorkoutCounts(userId: string) {
  const twelveMonthsAgo = subMonths(new Date(), 12);

  const rows = await db
    .select({
      month: sql<string>`DATE_TRUNC('month', ${ workouts.startedAt })`,
      workoutCount: count(),
    })
    .from(workouts)
    .where(and(eq(workouts.userId, userId), gte(workouts.startedAt, twelveMonthsAgo)))
    .groupBy(sql`DATE_TRUNC('month', ${ workouts.startedAt })`)
    .orderBy(asc(sql`DATE_TRUNC('month', ${ workouts.startedAt })`));

  const countByMonth = new Map(rows.map((r) => [r.month.slice(0, 7), r.workoutCount]));

  return Array.from({ length: 12 }, (_, i) => {
    const monthStart = startOfMonth(subMonths(new Date(), 11 - i));
    const key = monthStart.toISOString().slice(0, 7);
    return {
      month: format(monthStart, "MMM yyyy"),
      count: countByMonth.get(key) ?? 0,
    };
  });
}

export async function getRecentWorkouts(userId: string, limit = 5) {
  const recentWorkoutsData = await db
    .select()
    .from(workouts)
    .where(eq(workouts.userId, userId))
    .orderBy(desc(workouts.startedAt))
    .limit(limit);

  if (recentWorkoutsData.length === 0) return [];

  return Promise.all(
    recentWorkoutsData.map(async (workout) => {
      const workoutExercisesData = await db
        .select({ workoutExercise: workoutExercises, exercise: exercises })
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
          return { id: workoutExercise.id, name: exercise.name, sets: setsData };
        })
      );

      return { ...workout, exercises: exercisesWithSets };
    })
  );
}
