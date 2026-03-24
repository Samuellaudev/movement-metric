import { auth } from "@clerk/nextjs/server";
import {
  getDashboardStats,
  getWeeklyVolumeData,
  getMonthlyWorkoutCounts,
  getRecentWorkouts,
} from "@/data/workouts";
import StatCards from "./stat-cards";
import WeeklyVolumeChart from "./weekly-volume-chart";
import MonthlyWorkoutsChart from "./monthly-workouts-chart";
import RecentWorkoutsAccordion from "./recent-workouts-accordion";

export default async function DashboardPage() {
  const { userId } = await auth();

  const [stats, weeklyVolume, monthlyCounts, recentWorkouts] = await Promise.all([
    getDashboardStats(userId!),
    getWeeklyVolumeData(userId!),
    getMonthlyWorkoutCounts(userId!),
    getRecentWorkouts(userId!, 5),
  ]);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 space-y-10">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <StatCards
        totalWorkouts={ stats.totalWorkouts }
        totalVolumeKg={ stats.totalVolumeKg }
        avgDurationMinutes={ stats.avgDurationMinutes }
        currentStreakDays={ stats.currentStreakDays }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">Weekly Volume</h2>
          <WeeklyVolumeChart data={ weeklyVolume } />
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-4">Monthly Workouts</h2>
          <MonthlyWorkoutsChart data={ monthlyCounts } />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Recent Workouts</h2>
        <RecentWorkoutsAccordion workouts={ recentWorkouts } />
      </div>
    </div>
  );
}
