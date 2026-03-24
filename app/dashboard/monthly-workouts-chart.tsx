"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface Props {
  data: { month: string; count: number }[];
}

const chartConfig = {
  count: {
    label: "Workouts",
    color: "#9ca3af",
  },
} satisfies ChartConfig;

export default function MonthlyWorkoutsChart({ data }: Props) {
  return (
    <ChartContainer config={ chartConfig } className="h-64 w-full">
      <LineChart data={ data } margin={ { top: 4, right: 4, bottom: 0, left: 0 } }>
        <CartesianGrid vertical={ false } />
        <XAxis
          dataKey="month"
          tickLine={ false }
          axisLine={ false }
          tick={ { fontSize: 11 } }
          tickFormatter={ (v: string) => v.slice(0, 3) }
        />
        <YAxis
          tickLine={ false }
          axisLine={ false }
          tick={ { fontSize: 11 } }
          width={ 30 }
          allowDecimals={ false }
        />
        <ChartTooltip content={ <ChartTooltipContent /> } />
        <Line
          type="monotone"
          dataKey="count"
          stroke="var(--color-count)"
          strokeWidth={ 2 }
          dot={ false }
        />
      </LineChart>
    </ChartContainer>
  );
}
