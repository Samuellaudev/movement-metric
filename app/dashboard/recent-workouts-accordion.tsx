"use client";

import Link from "next/link";
import { format } from "date-fns";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Set {
  id: number;
  setNumber: number;
  reps: number | null;
  weightKg: string | null;
}

interface Exercise {
  id: number;
  name: string;
  sets: Set[];
}

interface Workout {
  id: number;
  name: string | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  exercises: Exercise[];
}

interface Props {
  workouts: Workout[];
}

export default function RecentWorkoutsAccordion({ workouts }: Props) {
  if (workouts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No workouts logged yet.</p>
    );
  }

  return (
    <Accordion type="single" collapsible className="space-y-2">
      { workouts.map((workout) => (
        <AccordionItem
          key={ workout.id }
          value={ String(workout.id) }
          className="border border-border rounded-lg px-5"
        >
          <AccordionTrigger className="hover:no-underline cursor-pointer">
            <div className="flex items-center justify-between w-full pr-2">
              <span className="font-semibold">{ workout.name ?? "Unnamed Workout" }</span>
              <span className="text-xs text-muted-foreground">
                { workout.startedAt && format(workout.startedAt, "do MMM yyyy") }
                { workout.startedAt &&
                  ` · ${ format(workout.startedAt, "h:mm a") }` }
                { workout.finishedAt &&
                  ` – ${ format(workout.finishedAt, "h:mm a") }` }
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            { workout.exercises.length === 0 ? (
              <p className="text-sm text-muted-foreground pb-2">No exercises recorded.</p>
            ) : (
              <div className="space-y-4 pb-2">
                { workout.exercises.map((exercise) => (
                  <div key={ exercise.id }>
                    <h3 className="font-medium text-sm mb-2">{ exercise.name }</h3>
                    { exercise.sets.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No sets recorded.</p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-muted-foreground text-xs">
                            <th className="text-left font-medium pb-1 w-12">Set</th>
                            <th className="text-left font-medium pb-1 w-24">Weight</th>
                            <th className="text-left font-medium pb-1">Reps</th>
                          </tr>
                        </thead>
                        <tbody>
                          { exercise.sets.map((set) => (
                            <tr key={ set.id } className="border-t border-border/50">
                              <td className="py-1 text-muted-foreground">{ set.setNumber }</td>
                              <td className="py-1">
                                { set.weightKg ? `${ set.weightKg } kg` : "—" }
                              </td>
                              <td className="py-1">{ set.reps ?? "—" }</td>
                            </tr>
                          )) }
                        </tbody>
                      </table>
                    ) }
                  </div>
                )) }
              </div>
            ) }
            <Link
              href={ `/dashboard/workout/${ workout.id }` }
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              View full workout →
            </Link>
          </AccordionContent>
        </AccordionItem>
      )) }
    </Accordion>
  );
}
