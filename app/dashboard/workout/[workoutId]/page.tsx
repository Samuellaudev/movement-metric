import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getWorkoutById } from "@/data/workouts";
import EditWorkoutForm from "./edit-workout-form";

interface Props {
  params: Promise<{ workoutId: string }>;
}

export default async function EditWorkoutPage({ params }: Props) {
  const { workoutId } = await params;
  const id = parseInt(workoutId, 10);

  if (isNaN(id)) {
    notFound();
  }

  const { userId } = await auth();
  const workout = await getWorkoutById(id, userId!);

  if (!workout) {
    notFound();
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Edit Workout</h1>
      <EditWorkoutForm workout={workout} />
    </div>
  );
}
