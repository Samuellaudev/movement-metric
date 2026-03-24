"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Exercise } from "@/db/schema";
import {
  createWorkoutAction,
  addExerciseAction,
  removeExerciseAction,
  addSetAction,
  removeSetAction,
} from "./actions";

type LocalSet = {
  id: number;
  setNumber: number;
  reps: number | null;
  weightKg: string | null;
};

type LocalExercise = {
  workoutExerciseId: number;
  exerciseId: number;
  name: string;
  order: number;
  sets: LocalSet[];
};

interface Props {
  allExercises: Exercise[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function NewWorkoutForm({ allExercises, onSuccess, onCancel }: Props) {
  const router = useRouter();

  function timeString(date: Date) {
    return `${ String(date.getHours()).padStart(2, "0") }:${ String(date.getMinutes()).padStart(2, "0") }`;
  }

  function buildDateTime(base: Date, time: string): Date {
    const [hours, minutes] = time.split(":").map(Number);
    const result = new Date(base);
    result.setHours(hours, minutes, 0, 0);
    return result;
  }

  // Phase 1 state
  const [name, setName] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState(() => timeString(new Date()));
  const [finishTime, setFinishTime] = useState(() => {
    const t = new Date();
    t.setHours(t.getHours() + 1);
    return timeString(t);
  });
  const [createError, setCreateError] = useState<string | null>(null);
  const [createPending, setCreatePending] = useState(false);

  // Phase 2 state
  const [workoutId, setWorkoutId] = useState<number | null>(null);
  const [localExercises, setLocalExercises] = useState<LocalExercise[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState("");
  const [addingSetFor, setAddingSetFor] = useState<number | null>(null);
  const [setReps, setSetReps] = useState("");
  const [setWeightKg, setSetWeightKg] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.SyntheticEvent) {
    e.preventDefault();
    setCreateError(null);
    setCreatePending(true);

    const startedAt = buildDateTime(date, startTime);
    const finishedAt = finishTime ? buildDateTime(date, finishTime) : undefined;
    const result = await createWorkoutAction({ name, startedAt, finishedAt });

    if (result?.error || !result.workoutId) {
      setCreateError(typeof result?.error === "string" ? result.error : "Invalid input.");
      setCreatePending(false);
      return;
    }

    setWorkoutId(result.workoutId);
    setCreatePending(false);
  }

  async function handleAddExercise() {
    if (!selectedExerciseId || !workoutId) return;
    setError(null);
    setPending(true);

    const exerciseId = parseInt(selectedExerciseId, 10);
    const result = await addExerciseAction({ workoutId, exerciseId });

    setPending(false);
    if (result?.error || !result.workoutExerciseId || !result.order) {
      setError(typeof result?.error === "string" ? result.error : "Failed to add exercise.");
      return;
    }

    const exercise = allExercises.find((e) => e.id === exerciseId)!;
    setLocalExercises((prev) => [
      ...prev,
      { workoutExerciseId: result.workoutExerciseId!, exerciseId, name: exercise.name, order: result.order!, sets: [] },
    ]);
    setSelectedExerciseId("");
  }

  async function handleRemoveExercise(workoutExerciseId: number) {
    if (!workoutId) return;
    setError(null);
    setPending(true);

    const result = await removeExerciseAction({ workoutExerciseId, workoutId });

    setPending(false);
    if (result?.error) {
      setError(typeof result.error === "string" ? result.error : "Failed to remove exercise.");
      return;
    }

    setLocalExercises((prev) => prev.filter((e) => e.workoutExerciseId !== workoutExerciseId));
  }

  async function handleAddSet(workoutExerciseId: number) {
    if (!workoutId) return;
    setError(null);
    setPending(true);

    const result = await addSetAction({
      workoutExerciseId,
      workoutId,
      reps: parseInt(setReps, 10),
      weightKg: setWeightKg,
    });

    setPending(false);
    if (result?.error || !result.set) {
      setError(typeof result?.error === "string" ? result.error : "Failed to add set.");
      return;
    }

    const newSet = result.set;
    setLocalExercises((prev) =>
      prev.map((e) =>
        e.workoutExerciseId === workoutExerciseId
          ? { ...e, sets: [...e.sets, { id: newSet.id, setNumber: newSet.setNumber, reps: newSet.reps, weightKg: newSet.weightKg }] }
          : e
      )
    );
    setAddingSetFor(null);
    setSetReps("");
    setSetWeightKg("");
  }

  async function handleRemoveSet(setId: number, workoutExerciseId: number) {
    if (!workoutId) return;
    setError(null);
    setPending(true);

    const result = await removeSetAction({ setId, workoutId });

    setPending(false);
    if (result?.error) {
      setError(typeof result.error === "string" ? result.error : "Failed to remove set.");
      return;
    }

    setLocalExercises((prev) =>
      prev.map((e) =>
        e.workoutExerciseId === workoutExerciseId
          ? { ...e, sets: e.sets.filter((s) => s.id !== setId) }
          : e
      )
    );
  }

  function handleDone() {
    if (onSuccess) {
      onSuccess();
    } else {
      router.push("/dashboard");
    }
  }

  // Phase 1: create workout
  if (!workoutId) {
    return (
      <form onSubmit={ handleCreate } className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Workout Name</Label>
          <Input
            id="name"
            placeholder="e.g. Push Day"
            value={ name }
            onChange={ (e) => setName(e.target.value) }
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                { format(date, "do MMM yyyy") }
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={ date }
                onSelect={ (d) => d && setDate(d) }
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startTime">Start Time</Label>
            <div className="relative">
              <Input
                id="startTime"
                type="time"
                value={ startTime }
                onChange={ (e) => setStartTime(e.target.value) }
                required
                className="[&::-webkit-calendar-picker-indicator]:hidden"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="finishTime">Finish Time</Label>
            <div className="relative">
              <Input
                id="finishTime"
                type="time"
                value={ finishTime }
                onChange={ (e) => setFinishTime(e.target.value) }
                className="[&::-webkit-calendar-picker-indicator]:hidden"
              />
            </div>
          </div>
        </div>

        { createError && <p className="text-sm text-destructive">{ createError }</p> }

        <div className="flex gap-3">
          <Button type="submit" disabled={ createPending }>
            { createPending ? "Creating..." : "Create Workout" }
          </Button>
          <Button type="button" variant="outline" onClick={ () => onCancel ? onCancel() : router.back() }>
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  // Phase 2: add exercises
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Workout <span className="font-medium text-foreground">{ name }</span> created. Add exercises below.
      </p>

      { localExercises.length === 0 && (
        <p className="text-sm text-muted-foreground">No exercises added yet.</p>
      ) }

      { localExercises.map((exercise) => (
        <div key={ exercise.workoutExerciseId } className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">{ exercise.name }</h3>
            <Button
              variant="destructive"
              size="sm"
              disabled={ pending }
              onClick={ () => handleRemoveExercise(exercise.workoutExerciseId) }
            >
              Remove
            </Button>
          </div>

          { exercise.sets.length > 0 && (
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
                { exercise.sets.map((set) => (
                  <tr key={ set.id } className="border-b last:border-0">
                    <td className="py-2 pr-4">{ set.setNumber }</td>
                    <td className="py-2 pr-4">{ set.weightKg ?? "—" }</td>
                    <td className="py-2 pr-4">{ set.reps ?? "—" }</td>
                    <td className="py-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={ pending }
                        onClick={ () => handleRemoveSet(set.id, exercise.workoutExerciseId) }
                      >
                        Remove
                      </Button>
                    </td>
                  </tr>
                )) }
              </tbody>
            </table>
          ) }

          { addingSetFor === exercise.workoutExerciseId ? (
            <div className="flex items-end gap-2 flex-wrap">
              <div className="space-y-1">
                <Label htmlFor={ `reps-${ exercise.workoutExerciseId }` }>Reps</Label>
                <Input
                  id={ `reps-${ exercise.workoutExerciseId }` }
                  type="number"
                  min="1"
                  placeholder="e.g. 10"
                  value={ setReps }
                  onChange={ (e) => setSetReps(e.target.value) }
                  className="w-24"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={ `weight-${ exercise.workoutExerciseId }` }>Weight (kg)</Label>
                <Input
                  id={ `weight-${ exercise.workoutExerciseId }` }
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 60"
                  value={ setWeightKg }
                  onChange={ (e) => setSetWeightKg(e.target.value) }
                  className="w-28"
                />
              </div>
              <Button
                size="sm"
                disabled={ pending || !setReps || !setWeightKg }
                onClick={ () => handleAddSet(exercise.workoutExerciseId) }
              >
                { pending ? "Saving..." : "Save Set" }
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={ () => {
                  setAddingSetFor(null);
                  setSetReps("");
                  setSetWeightKg("");
                } }
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={ () => {
                setSetReps("");
                setSetWeightKg("");
                setAddingSetFor(exercise.workoutExerciseId);
              } }
            >
              + Add Set
            </Button>
          ) }
        </div>
      )) }

      <div className="border rounded-lg p-4 space-y-3">
        <h3 className="font-medium">Add Exercise</h3>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={ selectedExerciseId } onValueChange={ setSelectedExerciseId }>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select an exercise" />
            </SelectTrigger>
            <SelectContent>
              { allExercises.map((exercise) => (
                <SelectItem key={ exercise.id } value={ String(exercise.id) }>
                  { exercise.name }
                </SelectItem>
              )) }
            </SelectContent>
          </Select>
          <Button disabled={ pending || !selectedExerciseId } onClick={ handleAddExercise }>
            { pending ? "Adding..." : "Add" }
          </Button>
        </div>
      </div>

      { error && <p className="text-sm text-destructive">{ error }</p> }

      <Button onClick={ handleDone }>Done</Button>
    </div>
  );
}
