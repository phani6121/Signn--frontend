'use client';

import * as React from 'react';
import { TrendingUp } from 'lucide-react';
import { Label, Pie, PieChart } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

type FleetReadinessCounts = {
  green: number;
  yellow: number;
  red: number;
};

const chartConfig = {
  riders: {
    label: 'Riders',
  },
  green: {
    label: 'Green',
    color: 'hsl(142.1 76.2% 36.3%)',
  },
  yellow: {
    label: 'Yellow',
    color: 'hsl(47.9 95.8% 53.1%)',
  },
  red: {
    label: 'Red',
    color: 'hsl(0 84.2% 60.2%)',
  },
};

export function FleetStatusChart({
  readiness,
  totalRiders,
  operationalPercentage,
}: {
  readiness?: FleetReadinessCounts;
  totalRiders?: number;
  operationalPercentage?: number;
}) {
  const chartData = React.useMemo(() => {
    const green = readiness?.green ?? 0;
    const yellow = readiness?.yellow ?? 0;
    const red = readiness?.red ?? 0;
    return [
      { status: 'GREEN', riders: green, fill: 'var(--color-green)' },
      { status: 'YELLOW', riders: yellow, fill: 'var(--color-yellow)' },
      { status: 'RED', riders: red, fill: 'var(--color-red)' },
    ];
  }, [readiness]);

  const totalRidersValue = React.useMemo(() => {
    if (typeof totalRiders === 'number') {
      return totalRiders;
    }
    return chartData.reduce((acc, curr) => acc + curr.riders, 0);
  }, [chartData, totalRiders]);

  const computedOperationalPercentage = React.useMemo(() => {
    const green = readiness?.green ?? 0;
    const yellow = readiness?.yellow ?? 0;
    const red = readiness?.red ?? 0;
    const total = green + yellow + red;
    if (!total) {
      return null;
    }
    return Math.round(((green + yellow) / total) * 100);
  }, [readiness]);

  const resolvedOperationalPercentage =
    typeof operationalPercentage === 'number' && operationalPercentage > 0
      ? operationalPercentage
      : computedOperationalPercentage;

  const operationalText =
    typeof resolvedOperationalPercentage === 'number'
      ? `${resolvedOperationalPercentage}% of fleet is fully operational`
      : 'Fleet readiness is updating...';

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Fleet Readiness Status</CardTitle>
        <CardDescription>Live data from all active riders</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="riders"
              nameKey="status"
              innerRadius={60}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {totalRidersValue.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Active Riders
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          {operationalText}
          <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Showing total riders for today
        </div>
      </CardFooter>
    </Card>
  );
}
