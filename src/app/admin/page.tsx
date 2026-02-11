'use client';
 
import { ShieldOff, Users, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { FleetStatusChart } from '@/components/admin/fleet-status-chart';
import { RecentChecks } from '@/components/admin/recent-checks';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslations } from 'next-intl';
 
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
 
type DashboardMetrics = {
  total_active_riders: number;
  fleet_readiness: {
    green: number;
    yellow: number;
    red: number;
  };
  fleet_operational_percentage: number;
  fatigue_detections: number;
  stress_detections: number;
  shift_risk_detections: number;
};
 
export default function AdminDashboard() {
  const t = useTranslations();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [rangeDays, setRangeDays] = useState<'all' | '1' | '7' | '14' | '21'>('all');
 
  useEffect(() => {
    let cancelled = false;
    const loadMetrics = async () => {
      try {
        const params = new URLSearchParams();
        if (rangeDays === 'all') {
          params.set('all_time', 'true');
        } else {
          params.set('range_days', rangeDays);
        }
        const response = await fetch(
          `${API_BASE_URL}/api/v1/admin/dashboard/metrics?${params.toString()}`,
          {
            method: 'GET',
          }
        );
        if (!response.ok) {
          throw new Error(`Request failed: ${response.status}`);
        }
        const data = (await response.json()) as DashboardMetrics;
        if (!cancelled) {
          setMetrics(data);
          setMetricsError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setMetricsError('Unable to load dashboard metrics.');
        }
      }
    };
 
    loadMetrics();
 
    return () => {
      cancelled = true;
    };
  }, [rangeDays]);
 
  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-lg font-semibold md:text-2xl">{t('readiness_control_room')}</h1>
        <div className="w-full sm:w-auto">
          <Select
            value={rangeDays}
            onValueChange={(value) => setRangeDays(value as typeof rangeDays)}
          >
            <SelectTrigger className="h-9 w-full border-slate-300 bg-white text-slate-900 sm:w-[180px]">
              <SelectValue placeholder="All data" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All data</SelectItem>
              <SelectItem value="1">Last 24 hours</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="21">Last 21 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {metricsError && (
        <div className="text-sm text-red-600">{metricsError}</div>
      )}
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('total_active_riders')}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.total_active_riders ?? '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              +20.1% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Fatigue Detections
            </CardTitle>
            <ShieldOff className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.fatigue_detections ?? '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Stress Detections
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.stress_detections ?? '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>
        <Card className="lg:col-span-1 hidden lg:block">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Shift Risk
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.shift_risk_detections ?? '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Accident Prevention Log
            </CardTitle>
            <ShieldOff className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="select-none blur-[2px]">
              <div className="text-lg font-semibold">42</div>
              <p className="text-xs text-muted-foreground">
                {t('impaired_riders_blocked')} this week
              </p>
            </div>
          </CardContent>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="rounded-full bg-background/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Coming soon
            </div>
          </div>
        </Card>
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Alerts
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="select-none blur-[2px]">
              <div className="text-lg font-semibold">5 zones</div>
              <p className="text-xs text-muted-foreground">
                Showing high fatigue signals
              </p>
            </div>
          </CardContent>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="rounded-full bg-background/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Coming soon
            </div>
          </div>
        </Card>
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Premium Reduction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="select-none blur-[2px]">
              <div className="text-lg font-semibold">15%</div>
              <p className="text-xs text-muted-foreground">
                Potential insurance premium reduction
              </p>
            </div>
          </CardContent>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="rounded-full bg-background/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Coming soon
            </div>
          </div>
        </Card>
      </div>
      <div className="grid items-start gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <RecentChecks />
        </div>
        <FleetStatusChart
          readiness={metrics?.fleet_readiness}
          totalRiders={metrics?.total_active_riders}
          operationalPercentage={metrics?.fleet_operational_percentage}
        />
      </div>
    </>
  );
}