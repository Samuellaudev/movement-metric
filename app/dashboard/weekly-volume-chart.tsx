"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface Props {
  data: { week: string; volumeKg: number }[];
}

const chartConfig = {
  volumeKg: {
    label: "Volume (kg)",
    color: "#9ca3af",
  },
} satisfies ChartConfig;

export default function WeeklyVolumeChart({ data }: Props) {
  return (
    <ChartContainer config={ chartConfig } className="h-64 w-full">
      <BarChart data={ data } margin={ { top: 4, right: 4, bottom: 0, left: 0 } }>
        <CartesianGrid vertical={ false } />
        <XAxis
          dataKey="week"
          tickLine={ false }
          axisLine={ false }
          tick={ { fontSize: 11 } }
        />
        <YAxis tickLine={ false } axisLine={ false } tick={ { fontSize: 11 } } width={ 40 } />
        <ChartTooltip content={ <ChartTooltipContent /> } />
        <Bar dataKey="volumeKg" fill="var(--color-volumeKg)" radius={ 4 } />
      </BarChart>
    </ChartContainer>
  );
}
