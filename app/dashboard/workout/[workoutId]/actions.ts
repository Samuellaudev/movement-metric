"use server";

import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import {
  deleteWorkout,
  updateWorkout,
  addExerciseToWorkout,
  removeExerciseFromWorkout,
  addSet,
  removeSet,
} from "@/data/workouts";

export async function deleteWorkoutAction(workoutId: number) {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated" };
  await deleteWorkout(workoutId, userId);
}

const updateWorkoutSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1, "Workout name is required"),
  startedAt: z.date(),
  finishedAt: z.date().optional(),
});

type UpdateWorkoutInput = z.infer<typeof updateWorkoutSchema>;

export async function updateWorkoutAction(input: UpdateWorkoutInput) {
  const parsed = updateWorkoutSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  const { userId } = await auth();
  if (!userId) {
    return { error: "Not authenticated" };
  }

  await updateWorkout(parsed.data.id, userId, {
    name: parsed.data.name,
    startedAt: parsed.data.startedAt,
    finishedAt: parsed.data.finishedAt,
  });
}

const addExerciseToWorkoutSchema = z.object({
  workoutId: z.number().int().positive(),
  exerciseId: z.number().int().positive(),
});

type AddExerciseToWorkoutInput = z.infer<typeof addExerciseToWorkoutSchema>;

export async function addExerciseToWorkoutAction(input: AddExerciseToWorkoutInput) {
  const parsed = addExerciseToWorkoutSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  const { userId } = await auth();
  if (!userId) {
    return { error: "Not authenticated" };
  }

  await addExerciseToWorkout(parsed.data.workoutId, parsed.data.exerciseId, userId);
  revalidatePath(`/dashboard/workout/${ parsed.data.workoutId }`);
}

const removeExerciseFromWorkoutSchema = z.object({
  workoutExerciseId: z.number().int().positive(),
  workoutId: z.number().int().positive(),
});

type RemoveExerciseFromWorkoutInput = z.infer<typeof removeExerciseFromWorkoutSchema>;

export async function removeExerciseFromWorkoutAction(input: RemoveExerciseFromWorkoutInput) {
  const parsed = removeExerciseFromWorkoutSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  const { userId } = await auth();
  if (!userId) {
    return { error: "Not authenticated" };
  }

  await removeExerciseFromWorkout(parsed.data.workoutExerciseId, parsed.data.workoutId, userId);
  revalidatePath(`/dashboard/workout/${ parsed.data.workoutId }`);
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

  await addSet(
    parsed.data.workoutExerciseId,
    parsed.data.workoutId,
    userId,
    parsed.data.reps,
    parsed.data.weightKg
  );
  revalidatePath(`/dashboard/workout/${ parsed.data.workoutId }`);
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
  revalidatePath(`/dashboard/workout/${ parsed.data.workoutId }`);
}
