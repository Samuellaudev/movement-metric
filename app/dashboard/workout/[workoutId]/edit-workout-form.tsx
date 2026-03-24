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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { updateWorkoutAction, deleteWorkoutAction } from "./actions";
import type { Workout } from "@/db/schema";

interface Props {
  workout: Workout;
}

function toTimeString(date: Date | null | undefined): string {
  if (!date) return "";
  return `${ String(date.getHours()).padStart(2, "0") }:${ String(date.getMinutes()).padStart(2, "0") }`;
}

function toTimeStringPlusOneHour(date: Date | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  d.setHours(d.getHours() + 1);
  return toTimeString(d);
}

function buildDateTime(base: Date, time: string): Date {
  const [hours, minutes] = time.split(":").map(Number);
  const result = new Date(base);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

export default function EditWorkoutForm({ workout }: Props) {
  const router = useRouter();
  const [name, setName] = useState(workout.name ?? "");
  const [date, setDate] = useState<Date>(workout.startedAt ?? new Date());
  const [startTime, setStartTime] = useState(() => toTimeString(workout.startedAt));
  const [finishTime, setFinishTime] = useState(() =>
    workout.finishedAt ? toTimeString(workout.finishedAt) : toTimeStringPlusOneHour(workout.startedAt)
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const startedAt = startTime ? buildDateTime(date, startTime) : date;
    const finishedAt = finishTime ? buildDateTime(date, finishTime) : undefined;
    const result = await updateWorkoutAction({ id: workout.id, name, startedAt, finishedAt });

    if (result?.error) {
      setError(typeof result.error === "string" ? result.error : "Invalid input.");
      setPending(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <form onSubmit={ handleSubmit } className="space-y-6">
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
              initialFocus
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

      { error && <p className="text-sm text-destructive">{ error }</p> }

      <div className="flex gap-3">
        <Button type="submit" disabled={ pending || deleting } className="cursor-pointer">
          { pending ? "Saving..." : "Save Changes" }
        </Button>
        <Button type="button" variant="outline" disabled={ pending || deleting } onClick={ () => router.back() } className="cursor-pointer">
          Cancel
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="destructive"
              disabled={ pending || deleting }
              className="cursor-pointer ml-auto"
            >
              { deleting ? "Deleting..." : "Delete Workout" }
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete workout?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete <span className="font-medium text-foreground">{ workout.name }</span> and all its exercises and sets. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                className="bg-destructive "
                onClick={ async () => {
                  setDeleting(true);
                  await deleteWorkoutAction(workout.id);
                  router.push("/dashboard");
                } }
              >
                Delete Workout
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </form>
  );
}
