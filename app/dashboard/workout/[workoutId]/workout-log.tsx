"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  addExerciseToWorkoutAction,
  removeExerciseFromWorkoutAction,
  addSetAction,
  removeSetAction,
} from "./actions";
import type { Exercise } from "@/db/schema";

type SetData = {
  id: number;
  setNumber: number;
  reps: number | null;
  weightKg: string | null;
};

type ExerciseData = {
  workoutExerciseId: number;
  exerciseId: number;
  name: string;
  order: number;
  sets: SetData[];
};

type WorkoutWithExercises = {
  id: number;
  name: string | null;
  startedAt: Date | null;
  exercises: ExerciseData[];
};

interface Props {
  workout: WorkoutWithExercises;
  allExercises: Exercise[];
}

export default function WorkoutLog({ workout, allExercises }: Props) {
  const [addingSetFor, setAddingSetFor] = useState<number | null>(null);
  const [setReps, setSetReps] = useState("");
  const [setWeightKg, setSetWeightKg] = useState("");
  const [selectedExerciseId, setSelectedExerciseId] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAddExercise() {
    if (!selectedExerciseId) return;
    setError(null);
    setPending(true);
    const result = await addExerciseToWorkoutAction({
      workoutId: workout.id,
      exerciseId: parseInt(selectedExerciseId, 10),
    });
    setPending(false);
    if (result?.error) {
      setError(typeof result.error === "string" ? result.error : "Failed to add exercise.");
      return;
    }
    setSelectedExerciseId("");
  }

  async function handleRemoveExercise(workoutExerciseId: number) {
    setError(null);
    setPending(true);
    const result = await removeExerciseFromWorkoutAction({
      workoutExerciseId,
      workoutId: workout.id,
    });
    setPending(false);
    if (result?.error) {
      setError(typeof result.error === "string" ? result.error : "Failed to remove exercise.");
    }
  }

  async function handleAddSet(workoutExerciseId: number) {
    setError(null);
    setPending(true);
    const result = await addSetAction({
      workoutExerciseId,
      workoutId: workout.id,
      reps: parseInt(setReps, 10),
      weightKg: setWeightKg,
    });
    setPending(false);
    if (result?.error) {
      setError(typeof result.error === "string" ? result.error : "Failed to add set.");
      return;
    }
    setAddingSetFor(null);
    setSetReps("");
    setSetWeightKg("");
  }

  async function handleRemoveSet(setId: number) {
    setError(null);
    setPending(true);
    const result = await removeSetAction({ setId, workoutId: workout.id });
    setPending(false);
    if (result?.error) {
      setError(typeof result.error === "string" ? result.error : "Failed to remove set.");
    }
  }

  return (
    <section className="mt-8 space-y-6">
      <h2 className="text-xl font-semibold">Exercises</h2>

      {workout.exercises.length === 0 && (
        <p className="text-sm text-muted-foreground">No exercises added yet.</p>
      )}

      {workout.exercises.map((exercise) => (
        <div key={exercise.workoutExerciseId} className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">{exercise.name}</h3>
            <Button
              variant="destructive"
              size="sm"
              disabled={pending}
              onClick={() => handleRemoveExercise(exercise.workoutExerciseId)}
            >
              Remove Exercise
            </Button>
          </div>

          {exercise.sets.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b">
                  <th className="pb-2 pr-4">Set</th>
                  <th className="pb-2 pr-4">Weight (kg)</th>
                  <th className="pb-2 pr-4">Reps</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {exercise.sets.map((set) => (
                  <tr key={set.id} className="border-b last:border-0">
                    <td className="py-2 pr-4">{set.setNumber}</td>
                    <td className="py-2 pr-4">{set.weightKg ?? "—"}</td>
                    <td className="py-2 pr-4">{set.reps ?? "—"}</td>
                    <td className="py-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={pending}
                        onClick={() => handleRemoveSet(set.id)}
                      >
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {addingSetFor === exercise.workoutExerciseId ? (
            <div className="flex items-end gap-2 flex-wrap">
              <div className="space-y-1">
                <Label htmlFor={`reps-${exercise.workoutExerciseId}`}>Reps</Label>
                <Input
                  id={`reps-${exercise.workoutExerciseId}`}
                  type="number"
                  min="1"
                  placeholder="e.g. 10"
                  value={setReps}
                  onChange={(e) => setSetReps(e.target.value)}
                  className="w-24"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`weight-${exercise.workoutExerciseId}`}>Weight (kg)</Label>
                <Input
                  id={`weight-${exercise.workoutExerciseId}`}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 60"
                  value={setWeightKg}
                  onChange={(e) => setSetWeightKg(e.target.value)}
                  className="w-28"
                />
              </div>
              <Button
                size="sm"
                disabled={pending || !setReps || !setWeightKg}
                onClick={() => handleAddSet(exercise.workoutExerciseId)}
              >
                {pending ? "Saving..." : "Save Set"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setAddingSetFor(null);
                  setSetReps("");
                  setSetWeightKg("");
                }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSetReps("");
                setSetWeightKg("");
                setAddingSetFor(exercise.workoutExerciseId);
              }}
            >
              + Add Set
            </Button>
          )}
        </div>
      ))}

      <div className="border rounded-lg p-4 space-y-3">
        <h3 className="font-medium">Add Exercise</h3>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={selectedExerciseId} onValueChange={setSelectedExerciseId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select an exercise" />
            </SelectTrigger>
            <SelectContent>
              {allExercises.map((exercise) => (
                <SelectItem key={exercise.id} value={String(exercise.id)}>
                  {exercise.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            disabled={pending || !selectedExerciseId}
            onClick={handleAddExercise}
          >
            {pending ? "Adding..." : "Add"}
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </section>
  );
}
