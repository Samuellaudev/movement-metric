# Auth Coding Standards

## Authentication Provider

**This app uses [Clerk](https://clerk.com/docs) for all authentication.**

- Do NOT implement custom authentication or session management
- Do NOT use NextAuth, Auth.js, Supabase Auth, or any other auth library
- All auth must go through Clerk's SDK (`@clerk/nextjs` and `@clerk/nextjs/server`)

## Setup

`ClerkProvider` must wrap the entire app in `app/layout.tsx`. All Clerk UI components and hooks require this provider to be present.

```tsx
// app/layout.tsx
import { ClerkProvider } from "@clerk/nextjs";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
```

## Middleware

Route protection is handled via `clerkMiddleware()` in `middleware.ts`. This must be present at the project root.

```ts
// middleware.ts
import { clerkMiddleware } from '@clerk/nextjs/server'

export default clerkMiddleware()

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
```

## Getting the Current User

**In server components and server actions**, use `auth()` from `@clerk/nextjs/server`:

```ts
import { auth } from "@clerk/nextjs/server";

const { userId } = await auth();
```

**In client components**, use the `useAuth()` hook from `@clerk/nextjs`:

```tsx
import { useAuth } from "@clerk/nextjs";

const { userId } = useAuth();
```

## UI Components

Use Clerk's built-in UI components for sign-in/sign-up flows. Do not build custom auth forms.

| Component | Purpose |
|-----------|---------|
| `<SignInButton>` | Triggers sign-in (use `mode="modal"` for modal flow) |
| `<SignUpButton>` | Triggers sign-up (use `mode="modal"` for modal flow) |
| `<UserButton>` | Displays the signed-in user's avatar and account menu |
| `<Show when="signed-in">` | Conditionally renders children for signed-in users |
| `<Show when="signed-out">` | Conditionally renders children for signed-out users |

```tsx
import { SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";

<Show when="signed-out">
  <SignInButton mode="modal" />
  <SignUpButton mode="modal" />
</Show>
<Show when="signed-in">
  <UserButton />
</Show>
```

## User ID in Data Queries

Always retrieve `userId` from `auth()` in server components before passing it to data helper functions. Never accept a `userId` from URL params or user input — always source it from the authenticated session.

```ts
// app/dashboard/page.tsx
import { auth } from "@clerk/nextjs/server";
import { getWorkouts } from "@/data/workouts";

export default async function DashboardPage() {
  const { userId } = await auth();
  const workouts = await getWorkouts(userId!);

  return <WorkoutList workouts={workouts} />;
}
```

See `/docs/data-fetching.md` for the full data isolation requirements.
