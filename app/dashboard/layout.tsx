import Link from "next/link";
import Image from "next/image";
import { getAllExercises } from "@/data/workouts";
import NewWorkoutModal from "./new-workout-modal";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const allExercises = await getAllExercises();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="w-full px-4 md:px-8 h-14 flex items-center justify-between">
          <Link href="/dashboard">
            <Image src="/logo.png" alt="Movement Metric" width={120} height={32} className="h-8 w-auto" />
          </Link>
          <NewWorkoutModal allExercises={allExercises} />
        </div>
      </header>
      {children}
    </div>
  );
}
