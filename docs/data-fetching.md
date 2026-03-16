# Data Fetching Standards

## Server Components Only

**ALL data fetching must be done exclusively via React Server Components.**

- Do NOT fetch data in route handlers (`app/api/`)
- Do NOT fetch data in client components (`"use client"`)
- Do NOT use `useEffect`, `fetch`, SWR, React Query, or any client-side data fetching pattern
- Data must flow one way: database → server component → rendered UI

This is a hard requirement. If you need data in a client component, fetch it in a server component parent and pass it down as props.

## Database Queries via /data Directory

**All database queries must be implemented as helper functions in the `/data` directory.**

- Do NOT write database queries inline inside components or pages
- Do NOT use raw SQL — all queries must use [Drizzle ORM](https://orm.drizzle.team/docs/overview)
- Each helper function should be focused on a single data access concern

Example structure:
```
/data
  workouts.ts     # e.g. getWorkouts(), getWorkoutById()
  exercises.ts    # e.g. getExercises()
  sets.ts         # e.g. getSetsByWorkoutId()
```

Example helper function:
```ts
// data/workouts.ts
import { db } from "@/db";
import { workouts } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getWorkouts(userId: string) {
  return db.select().from(workouts).where(eq(workouts.userId, userId));
}
```

## Data Isolation — Users May Only Access Their Own Data

**Every query must be scoped to the authenticated user's ID.**

- Always retrieve the current user's ID from the auth session before querying
- Always filter queries with `where(eq(table.userId, userId))`
- Never expose a query that can return another user's data
- Never accept a `userId` as a URL parameter or user-supplied input without verifying it matches the authenticated session

This is a critical security requirement. A logged-in user must never be able to read, modify, or delete data belonging to another user.

Example of correct usage in a server component:
```ts
// app/dashboard/page.tsx
import { auth } from "@/auth";
import { getWorkouts } from "@/data/workouts";

export default async function DashboardPage() {
  const session = await auth();
  const workouts = await getWorkouts(session.user.id);

  return <WorkoutList workouts={workouts} />;
}
```
