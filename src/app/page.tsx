'use client';
 
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowUpRight,
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RiderStatus } from '@/lib/types';
import { Logo } from '@/components/logo';
import { UserNav } from '@/components/user-nav';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useAuth } from '@/context/auth-context';
import { AnimatedRadialChart } from '@/components/animated-radial-chart';
import { useTranslations } from 'next-intl';
 
// This component is a combination of the original /app/(app)/layout.tsx and /app/(app)/page.tsx
// to work around a Next.js routing conflict with the AuthProvider.
 
type RecentCheck = {
  check_id?: string | null;
  timestamp?: string | null;
  overall_status?: RiderStatus | null;
  status_reason?: string | null;
  latency_ms?: number | null;
  session_duration_seconds?: number | null;
};
 
type DashboardResponse = {
  user_id: string;
  readiness_status?: RiderStatus | null;
  status_reason?: string | null;
  last_check_at?: string | null;
  recent_checks?: RecentCheck[];
  check_counts?: {
    green: number;
    yellow: number;
    red: number;
    total: number;
  };
  health_index?: number | null;
  active_shifts?: number;
  open_scans?: number;
  last_updated?: string | null;
};
 
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
 
const statusConfig = {
  GREEN: {
    icon: <ShieldCheck className="h-6 w-6 text-green-500" />,
    text: 'Ready to Go',
    description: "You've passed the readiness check and are cleared to start your shift.",
    badge: <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>,
  },
  YELLOW: {
    icon: <ShieldAlert className="h-6 w-6 text-yellow-500" />,
    text: 'Proceed with Caution',
    description: 'Minor fatigue detected. Low-speed, local access only.',
    badge: <Badge className="bg-yellow-500 hover:bg-yellow-600">Limited</Badge>,
  },
  RED: {
    icon: <ShieldOff className="h-6 w-6 text-red-500" />,
    text: 'Mandatory Rest',
    description:
      'Significant impairment detected. Your access is temporarily blocked.',
    badge: <Badge variant="destructive">Blocked</Badge>,
  },
};
 
const fallbackRecentChecks: {
  time: string;
  status: RiderStatus;
  latency: string;
}[] = [];
 
function formatRelativeTime(iso?: string | null): string {
  if (!iso) return 'No recent checks';
  const hasTimezone = /[Zz]|[+-]\d{2}:\d{2}$/.test(iso);
  const normalized = hasTimezone ? iso : `${iso}Z`;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return 'No recent checks';
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(0, Math.round(diffMs / 60000));
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hours ago`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
}
 
function RiderDashboard() {
  const t = useTranslations();
  const { user } = useAuth();
  const router = useRouter();
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [startingShift, setStartingShift] = useState(false);
  const [shiftType, setShiftType] = useState<'login' | 'logout'>('login');
 
  useEffect(() => {
    const userId = user?.id || user?.username;
    if (!userId) return;
 
    let cancelled = false;
    const loadDashboard = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/v1/user/dashboard?user_id=${encodeURIComponent(
            userId
          )}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          }
        );
 
        if (!response.ok) {
          throw new Error('Failed to load dashboard');
        }
 
        const data = (await response.json()) as DashboardResponse;
        if (!cancelled) {
          setDashboard(data);
        }
      } catch (error) {
        console.error('Dashboard load error:', error);
        if (!cancelled) {
          setDashboard(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
 
    loadDashboard();
    return () => {
      cancelled = true;
    };
  }, [user]);
 
  const currentStatus = (dashboard?.readiness_status || 'GREEN') as RiderStatus;
  const lastCheckTime = formatRelativeTime(dashboard?.last_check_at);
  const { icon, text, description } = statusConfig[currentStatus];
  const checkCounts = dashboard?.check_counts ?? {
    green: 0,
    yellow: 0,
    red: 0,
    total: 0,
  };
  const healthIndex =
    dashboard?.health_index ?? (checkCounts.total ? Math.round((checkCounts.green / checkCounts.total) * 100) : 0);
  const startCheckHref =
    user?.user_type === 'employee' ? `/check?shift=${shiftType}` : '/check';

  const handleStartShiftCheck = () => {
    setStartingShift(true);
    router.push(startCheckHref);
  };

  useEffect(() => {
    if (!startingShift) return;
    const timer = window.setTimeout(() => {
      setStartingShift(false);
    }, 12000);
    return () => window.clearTimeout(timer);
  }, [startingShift]);
 
  const recentChecks = useMemo(() => {
    const checks = dashboard?.recent_checks || [];
    if (checks.length === 0) return fallbackRecentChecks;
    return checks.map((check) => ({
      time: formatRelativeTime(check.timestamp),
      status: (check.overall_status || 'GREEN') as RiderStatus,
      latency: check.latency_ms ? `${check.latency_ms}ms` : '--',
    }));
  }, [dashboard]);
 
  return (
    <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>{t('your_readiness_status')}</CardTitle>
          {icon}
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold">{text}</div>
          <p className="text-xs text-muted-foreground">
            Last check: {lastCheckTime}
          </p>
          <p className="mt-4 text-muted-foreground">{description}</p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Button
              className="w-full sm:w-auto"
              size="lg"
              onClick={handleStartShiftCheck}
              loading={startingShift}
              loadingText="Starting shift check..."
              autoLoading={false}
            >
              Start Shift Check
            </Button>
            {user?.user_type === 'employee' && (
              <RadioGroup
                value={shiftType}
                onValueChange={(value) => {
                  if (value === 'login' || value === 'logout') {
                    setShiftType(value);
                  }
                }}
                className="flex items-center gap-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="login" id="login-time" />
                  <Label htmlFor="login-time">Shift Login</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="logout" id="logout-time" />
                  <Label htmlFor="logout-time">Shift Logout</Label>
                </div>
              </RadioGroup>
            )}
          </div>
          {loading && (
            <p className="mt-3 text-xs text-muted-foreground">
              Loading latest dashboard...
            </p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Health Index</CardTitle>
            <CardDescription>Last 30 checks</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <AnimatedRadialChart value={healthIndex} size={220} />
          <div className="flex w-full justify-between text-sm text-muted-foreground">
            <span className="font-semibold text-green-600">Green: {checkCounts.green}</span>
            <span className="font-semibold text-yellow-600">Yellow: {checkCounts.yellow}</span>
            <span className="font-semibold text-red-600">Red: {checkCounts.red}</span>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center">
          <div className="grid gap-2">
            <CardTitle>Recent Checks</CardTitle>
            <CardDescription>Your last 3 readiness checks.</CardDescription>
          </div>
          <Button asChild size="sm" className="ml-auto gap-1">
            <Link href="#">
              View All
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Latency</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentChecks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    No recent checks yet.
                  </TableCell>
                </TableRow>
              ) : (
                recentChecks.map((check, index) => (
                  <TableRow key={index}>
                    <TableCell>{check.time}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          check.status === 'GREEN'
                            ? 'default'
                            : check.status === 'YELLOW'
                            ? 'secondary'
                            : 'destructive'
                        }
                        className={
                          check.status === 'GREEN'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                            : check.status === 'YELLOW'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                            : ''
                        }
                      >
                        {check.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{check.latency}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
 
 
export default function Home() {
  // AuthProvider will redirect to /login if not authenticated.
  // This page will only be rendered for authenticated users.
  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-50">
        <Logo />
        <div className="ml-auto flex items-center gap-2">
          <LanguageSwitcher />
          <UserNav />
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <RiderDashboard />
      </main>
    </div>
  );
}
