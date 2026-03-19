import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { getWorkoutWithExercises, getAllExercises } from "@/data/workouts";
import EditWorkoutForm from "./edit-workout-form";
import WorkoutLog from "./workout-log";
import { Button } from "@/components/ui/button";

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
  const [workout, allExercises] = await Promise.all([
    getWorkoutWithExercises(id, userId!),
    getAllExercises(),
  ]);

  if (!workout) {
    notFound();
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Edit Workout</h1>
        <Button asChild variant="outline">
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
      <EditWorkoutForm workout={workout} />
      <WorkoutLog workout={workout} allExercises={allExercises} />
    </div>
  );
}
