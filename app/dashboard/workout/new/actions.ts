"use server";

import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { createWorkout } from "@/data/workouts";

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

  await createWorkout(userId, parsed.data.name, parsed.data.startedAt);
}
