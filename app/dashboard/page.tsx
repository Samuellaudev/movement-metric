"use client";

import { useState } from "react";
import { format } from "date-fns";
import DatePicker from "./date-picker";

const MOCK_WORKOUTS = [
  {
    id: 1,
    name: "Morning Push Session",
    startedAt: new Date(2026, 2, 16, 7, 30),
    finishedAt: new Date(2026, 2, 16, 8, 45),
    exercises: [
      {
        id: 1,
        name: "Bench Press",
        sets: [
          { id: 1, setNumber: 1, reps: 8, weightKg: "80" },
          { id: 2, setNumber: 2, reps: 8, weightKg: "82.5" },
          { id: 3, setNumber: 3, reps: 6, weightKg: "85" },
        ],
      },
      {
        id: 2,
        name: "Overhead Press",
        sets: [
          { id: 4, setNumber: 1, reps: 10, weightKg: "50" },
          { id: 5, setNumber: 2, reps: 10, weightKg: "50" },
          { id: 6, setNumber: 3, reps: 8, weightKg: "52.5" },
        ],
      },
      {
        id: 3,
        name: "Tricep Pushdown",
        sets: [
          { id: 7, setNumber: 1, reps: 12, weightKg: "30" },
          { id: 8, setNumber: 2, reps: 12, weightKg: "30" },
        ],
      },
    ],
  },
];

export default function DashboardPage() {
  const [date, setDate] = useState(new Date(2026, 2, 16));

  const formattedDate = format(date, "do MMM yyyy");
  const workouts = MOCK_WORKOUTS;

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Workout Dashboard</h1>

      <div className="flex items-center gap-3 mb-8">
        <span className="text-sm text-muted-foreground">Date:</span>
        <DatePicker date={date} onDateChange={setDate} />
      </div>

      {workouts.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No workouts logged for {formattedDate}.
        </p>
      ) : (
        <div className="space-y-6">
          {workouts.map((workout) => (
            <div key={workout.id} className="border border-border rounded-lg p-5">
              <div className="flex items-start justify-between mb-4">
                <h2 className="font-semibold text-lg">{workout.name}</h2>
                <span className="text-xs text-muted-foreground">
                  {format(workout.startedAt, "h:mm a")}
                  {workout.finishedAt &&
                    ` – ${format(workout.finishedAt, "h:mm a")}`}
                </span>
              </div>

              {workout.exercises.length === 0 ? (
                <p className="text-sm text-muted-foreground">No exercises recorded.</p>
              ) : (
                <div className="space-y-4">
                  {workout.exercises.map((exercise) => (
                    <div key={exercise.id}>
                      <h3 className="font-medium text-sm mb-2">{exercise.name}</h3>
                      {exercise.sets.length === 0 ? (
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
                            {exercise.sets.map((set) => (
                              <tr key={set.id} className="border-t border-border/50">
                                <td className="py-1 text-muted-foreground">{set.setNumber}</td>
                                <td className="py-1">
                                  {set.weightKg ? `${set.weightKg} kg` : "—"}
                                </td>
                                <td className="py-1">{set.reps ?? "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
