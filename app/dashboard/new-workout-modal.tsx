"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Exercise } from "@/db/schema";
import NewWorkoutForm from "./workout/new/new-workout-form";

interface Props {
  allExercises: Exercise[];
}

export default function NewWorkoutModal({ allExercises }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  function handleSuccess() {
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={ open } onOpenChange={ setOpen }>
      <DialogTrigger asChild>
        <Button size="sm" className="cursor-pointer">Add Workout</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Workout</DialogTitle>
        </DialogHeader>
        <NewWorkoutForm
          allExercises={ allExercises }
          onSuccess={ handleSuccess }
          onCancel={ () => setOpen(false) }
        />
      </DialogContent>
    </Dialog>
  );
}
