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

const chartData = [
  { status: 'GREEN', riders: 275, fill: 'var(--color-green)' },
  { status: 'YELLOW', riders: 50, fill: 'var(--color-yellow)' },
  { status: 'RED', riders: 25, fill: 'var(--color-red)' },
];

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

export function FleetStatusChart() {
  const totalRiders = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.riders, 0);
  }, []);

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
                          {totalRiders.toLocaleString()}
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
          85% of fleet is fully operational
          <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Showing total riders for today
        </div>
      </CardFooter>
    </Card>
  );
}
