import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  totalWorkouts: number;
  totalVolumeKg: number;
  avgDurationMinutes: number;
  currentStreakDays: number;
}

export default function StatCards({
  totalWorkouts,
  totalVolumeKg,
  avgDurationMinutes,
  currentStreakDays,
}: Props) {
  const formattedVolume =
    totalVolumeKg >= 1000
      ? `${ (totalVolumeKg / 1000).toFixed(1) } t`
      : `${ Math.round(totalVolumeKg).toLocaleString() } kg`;

  const formattedDuration =
    avgDurationMinutes > 0 ? `${ Math.round(avgDurationMinutes) } min` : "—";

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Workouts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{ totalWorkouts }</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Volume
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{ formattedVolume }</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Avg Duration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{ formattedDuration }</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Current Streak
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">
            { currentStreakDays }
            <span className="text-lg font-normal text-muted-foreground ml-1">
              { currentStreakDays === 1 ? "day" : "days" }
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
