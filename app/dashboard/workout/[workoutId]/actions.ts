"use server";

import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { updateWorkout } from "@/data/workouts";

const updateWorkoutSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1, "Workout name is required"),
  startedAt: z.date(),
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
  });
}
