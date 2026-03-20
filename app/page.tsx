import Image from "next/image";
import { SignIn, SignInButton, SignUpButton, Show } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

const LogoPlaceholder = () => (
  <div className="flex flex-col items-center gap-4 text-zinc-400 dark:text-zinc-600">
    <Image className="shadow-md rounded-sm" src="/logo.png" alt="Movement Metric logo" width={ 240 } height={ 240 } priority />
    <p className="text-sm">Track your workouts, crush your goals.</p>
  </div>
);

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Top on mobile / Left on md+: logo panel */ }
      <div className="flex md:w-1/2 items-center justify-center bg-zinc-100 dark:bg-zinc-300 py-12 md:py-0">
        <LogoPlaceholder />
      </div>

      {/* Bottom on mobile / Right on md+: sign-in panel */ }
      <div className="flex flex-1 md:w-1/2 items-center justify-center p-8 bg-white dark:bg-black">
        <Show when="signed-out">
          <div className="flex flex-col gap-3 w-full max-w-xs mx-auto md:hidden">
            <SignInButton mode="modal">
              <Button className="w-full">Sign In</Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button variant="outline" className="w-full">Sign Up</Button>
            </SignUpButton>
          </div>
          {/* Desktop: embedded sign-in */ }
          <div className="hidden md:block">
            <SignIn routing="hash" />
          </div>
        </Show>
        <Show when="signed-in">
          <div className="text-zinc-600 dark:text-zinc-400">
            You are signed in. <a href="/dashboard" className="underline">Go to dashboard</a>
          </div>
        </Show>
      </div>
    </div>
  );
}
