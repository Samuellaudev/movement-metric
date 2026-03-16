import {
  pgTable,
  serial,
  text,
  integer,
  numeric,
  timestamp,
} from "drizzle-orm/pg-core";

export const exercises = pgTable("exercises", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const workouts = pgTable("workouts", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name"),
  startedAt: timestamp("started_at").defaultNow(),
  finishedAt: timestamp("finished_at"),
});

export const workoutExercises = pgTable("workout_exercises", {
  id: serial("id").primaryKey(),
  workoutId: integer("workout_id")
    .notNull()
    .references(() => workouts.id, { onDelete: "cascade" }),
  exerciseId: integer("exercise_id")
    .notNull()
    .references(() => exercises.id),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sets = pgTable("sets", {
  id: serial("id").primaryKey(),
  workoutExerciseId: integer("workout_exercise_id")
    .notNull()
    .references(() => workoutExercises.id, { onDelete: "cascade" }),
  setNumber: integer("set_number").notNull(),
  reps: integer("reps"),
  weightKg: numeric("weight_kg", { precision: 6, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Inferred types
export type Exercise = typeof exercises.$inferSelect;
export type NewExercise = typeof exercises.$inferInsert;

export type Workout = typeof workouts.$inferSelect;
export type NewWorkout = typeof workouts.$inferInsert;

export type WorkoutExercise = typeof workoutExercises.$inferSelect;
export type NewWorkoutExercise = typeof workoutExercises.$inferInsert;

export type Set = typeof sets.$inferSelect;
export type NewSet = typeof sets.$inferInsert;
