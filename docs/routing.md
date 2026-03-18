# Routing Standards

## Route Structure

**All application routes must be nested under `/dashboard`.**

- The root `/` page is a public landing/marketing page only
- All authenticated app functionality lives under `/dashboard` and its sub-routes
- Do NOT add top-level app routes (e.g. `/workouts`, `/profile`) — nest them under `/dashboard`

Example structure:
```
/app
  page.tsx                          # Public landing page (/)
  /dashboard
    page.tsx                        # Main dashboard (/dashboard)
    /workout
      /new
        page.tsx                    # New workout form (/dashboard/workout/new)
      /[workoutId]
        page.tsx                    # Workout detail (/dashboard/workout/:workoutId)
```

## Protected Routes

**`/dashboard` and all sub-routes are protected — only authenticated users may access them.**

- Unauthenticated users who visit any `/dashboard/*` route must be redirected to sign-in
- Do NOT add manual auth checks inside page components to guard against unauthenticated access — this is handled by middleware

## Route Protection via Middleware

**Route protection must be implemented in `middleware.ts` using `clerkMiddleware()`.**

- Do NOT use layout-level redirects or per-page auth checks to protect routes
- Use Clerk's `createRouteMatcher` to define the set of protected routes and call `auth.protect()` for matched routes

```ts
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
```

See `/docs/auth.md` for the full Clerk authentication setup.
