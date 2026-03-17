# Data Mutations Standards

## Helper Functions via /data Directory

**ALL data mutations must be implemented as helper functions in the `/data` directory.**

- Do NOT write database mutation calls inline inside components, pages, or server actions
- Do NOT use raw SQL — all mutations must use [Drizzle ORM](https://orm.drizzle.team/docs/overview)
- Each helper function should be focused on a single mutation concern

Example structure:
```
/data
  workouts.ts     # e.g. createWorkout(), updateWorkout(), deleteWorkout()
  exercises.ts    # e.g. createExercise(), deleteExercise()
  sets.ts         # e.g. createSet(), updateSet(), deleteSet()
```

Example helper function:
```ts
// data/workouts.ts
import { db } from "@/db";
import { workouts } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function createWorkout(userId: string, name: string, date: Date) {
  return db.insert(workouts).values({ userId, name, date }).returning();
}

export async function deleteWorkout(id: string, userId: string) {
  return db.delete(workouts).where(eq(workouts.id, id) && eq(workouts.userId, userId));
}
```

## Server Actions

**ALL data mutations must be performed via server actions.**

- Do NOT mutate data via route handlers (`app/api/`)
- Do NOT mutate data directly inside client components
- Server actions must be defined in colocated `actions.ts` files next to the page or component that uses them

Example structure:
```
/app
  /workouts
    page.tsx
    actions.ts    # server actions for the workouts page
  /workouts/[id]
    page.tsx
    actions.ts    # server actions for the workout detail page
```

Example server action file:
```ts
// app/workouts/actions.ts
"use server";

import { createWorkout } from "@/data/workouts";

export async function createWorkoutAction(input: CreateWorkoutInput) {
  // validate, then call /data helper
}
```

## Typed Parameters — No FormData

**Server action parameters must be typed. Do NOT use `FormData` as a parameter type.**

- Define an explicit TypeScript type or interface for every server action's input
- Pass structured objects, not raw form data

```ts
// ✅ Correct
type CreateWorkoutInput = {
  name: string;
  date: Date;
};

export async function createWorkoutAction(input: CreateWorkoutInput) { ... }

// ❌ Wrong
export async function createWorkoutAction(formData: FormData) { ... }
```

## Validation via Zod

**ALL server actions must validate their arguments using [Zod](https://zod.dev/) before performing any mutation.**

- Define a Zod schema for every server action's input
- Parse and validate input at the top of the action before any other logic
- If validation fails, return an error — do not proceed with the mutation

Example:
```ts
// app/workouts/actions.ts
"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { createWorkout } from "@/data/workouts";

const createWorkoutSchema = z.object({
  name: z.string().min(1),
  date: z.date(),
});

type CreateWorkoutInput = z.infer<typeof createWorkoutSchema>;

export async function createWorkoutAction(input: CreateWorkoutInput) {
  const parsed = createWorkoutSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.flatten() };
  }

  const session = await auth();
  await createWorkout(session.user.id, parsed.data.name, parsed.data.date);
}
```

## Data Isolation — Users May Only Mutate Their Own Data

**Every mutation must be scoped to the authenticated user's ID.**

- Always retrieve the current user's ID from the auth session inside the server action
- Always pass `userId` from the session — never accept it as user-supplied input
- The `/data` helper must include `userId` in its `where` clause for updates and deletes to prevent cross-user mutation

This is a critical security requirement. A logged-in user must never be able to create, modify, or delete data belonging to another user.
