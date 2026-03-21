import { getAllExercises } from "@/data/workouts";
import NewWorkoutForm from "./new-workout-form";

export default async function NewWorkoutPage() {
  const allExercises = await getAllExercises();

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">New Workout</h1>
      <NewWorkoutForm allExercises={allExercises} />
    </div>
  );
}
