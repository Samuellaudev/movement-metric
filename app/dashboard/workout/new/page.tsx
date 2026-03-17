import NewWorkoutForm from "./new-workout-form";

export default function NewWorkoutPage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">New Workout</h1>
      <NewWorkoutForm />
    </div>
  );
}
