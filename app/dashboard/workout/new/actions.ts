"use server";

import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import {
  createWorkout,
  addExerciseToWorkout,
  removeExerciseFromWorkout,
  addSet,
  removeSet,
} from "@/data/workouts";

const createWorkoutSchema = z.object({
  name: z.string().min(1, "Workout name is required"),
  startedAt: z.date(),
});

type CreateWorkoutInput = z.infer<typeof createWorkoutSchema>;

export async function createWorkoutAction(input: CreateWorkoutInput) {
  const parsed = createWorkoutSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  const { userId } = await auth();
  if (!userId) {
    return { error: "Not authenticated" };
  }

  const [workout] = await createWorkout(userId, parsed.data.name, parsed.data.startedAt);
  return { workoutId: workout.id };
}

const addExerciseSchema = z.object({
  workoutId: z.number().int().positive(),
  exerciseId: z.number().int().positive(),
});

type AddExerciseInput = z.infer<typeof addExerciseSchema>;

export async function addExerciseAction(input: AddExerciseInput) {
  const parsed = addExerciseSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  const { userId } = await auth();
  if (!userId) {
    return { error: "Not authenticated" };
  }

  const result = await addExerciseToWorkout(parsed.data.workoutId, parsed.data.exerciseId, userId);
  if (!result?.[0]) return { error: "Failed to add exercise." };
  return { workoutExerciseId: result[0].id, order: result[0].order };
}

const removeExerciseSchema = z.object({
  workoutExerciseId: z.number().int().positive(),
  workoutId: z.number().int().positive(),
});

type RemoveExerciseInput = z.infer<typeof removeExerciseSchema>;

export async function removeExerciseAction(input: RemoveExerciseInput) {
  const parsed = removeExerciseSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  const { userId } = await auth();
  if (!userId) {
    return { error: "Not authenticated" };
  }

  await removeExerciseFromWorkout(parsed.data.workoutExerciseId, parsed.data.workoutId, userId);
}

const addSetSchema = z.object({
  workoutExerciseId: z.number().int().positive(),
  workoutId: z.number().int().positive(),
  reps: z.number().int().positive(),
  weightKg: z.string().regex(/^\d+(\.\d{1,2})?$/, "Weight must be a positive number with up to 2 decimal places"),
});

type AddSetInput = z.infer<typeof addSetSchema>;

export async function addSetAction(input: AddSetInput) {
  const parsed = addSetSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  const { userId } = await auth();
  if (!userId) {
    return { error: "Not authenticated" };
  }

  const result = await addSet(
    parsed.data.workoutExerciseId,
    parsed.data.workoutId,
    userId,
    parsed.data.reps,
    parsed.data.weightKg
  );
  if (!result?.[0]) return { error: "Failed to add set." };
  return { set: result[0] };
}

const removeSetSchema = z.object({
  setId: z.number().int().positive(),
  workoutId: z.number().int().positive(),
});

type RemoveSetInput = z.infer<typeof removeSetSchema>;

export async function removeSetAction(input: RemoveSetInput) {
  const parsed = removeSetSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  const { userId } = await auth();
  if (!userId) {
    return { error: "Not authenticated" };
  }

  await removeSet(parsed.data.setId, parsed.data.workoutId, userId);
}
