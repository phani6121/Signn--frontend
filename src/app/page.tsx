'use client';
 
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
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
import { getLocaleFromPathname, withLocale } from '@/i18n/config';
 
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
 
const fallbackRecentChecks: {
  time: string;
  status: RiderStatus;
  latency: string;
}[] = [];
 
function formatRelativeTime(
  iso: string | null | undefined,
  t: ReturnType<typeof useTranslations>
): string {
  if (!iso) return t('no_recent_checks');
  const hasTimezone = /[Zz]|[+-]\d{2}:\d{2}$/.test(iso);
  const normalized = hasTimezone ? iso : `${iso}Z`;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return t('no_recent_checks');
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(0, Math.round(diffMs / 60000));
  if (diffMinutes < 1) return t('just_now');
  if (diffMinutes < 60) return t('minutes_ago', {count: diffMinutes});
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return t('hours_ago', {count: diffHours});
  const diffDays = Math.round(diffHours / 24);
  if (diffDays === 1) return t('yesterday');
  return t('days_ago', {count: diffDays});
}

function formatLatencyMs(value?: number | null): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '--';
  const truncated = Math.trunc(value * 1000) / 1000;
  return `${Number.isInteger(truncated) ? String(truncated) : truncated.toFixed(3).replace(/\.?0+$/, '')}ms`;
}
 
function RiderDashboard() {
  const t = useTranslations();
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [startingShift, setStartingShift] = useState(false);
  const [shiftType, setShiftType] = useState<'login' | 'logout'>('login');
  const statusConfig = {
    GREEN: {
      icon: <ShieldCheck className="h-6 w-6 text-green-500" />,
      text: t('status_ready_to_go'),
      description: t('status_desc_green'),
      badge: <Badge className="bg-green-500 hover:bg-green-600">{t('badge_active')}</Badge>,
    },
    YELLOW: {
      icon: <ShieldAlert className="h-6 w-6 text-yellow-500" />,
      text: t('status_proceed_with_caution'),
      description: t('status_desc_yellow'),
      badge: <Badge className="bg-yellow-500 hover:bg-yellow-600">{t('badge_limited')}</Badge>,
    },
    RED: {
      icon: <ShieldOff className="h-6 w-6 text-red-500" />,
      text: t('status_mandatory_rest'),
      description: t('status_desc_red'),
      badge: <Badge variant="destructive">{t('badge_blocked')}</Badge>,
    },
  };
 
  useEffect(() => {
    const userId = user?.id || user?.username;
    if (!userId) return;
 
    let cancelled = false;
    let timer: number | undefined;
    const loadDashboard = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('user_id', userId);
        if (user?.username) {
          params.set('username', user.username);
        }
        const response = await fetch(
          `${API_BASE_URL}/api/v1/user/dashboard?${params.toString()}&_t=${Date.now()}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store',
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
    timer = window.setInterval(loadDashboard, 15000);
    const handleFocus = () => loadDashboard();
    window.addEventListener('focus', handleFocus);
    return () => {
      cancelled = true;
      if (timer) {
        window.clearInterval(timer);
      }
      window.removeEventListener('focus', handleFocus);
    };
  }, [user]);
 
  const currentStatus = (dashboard?.readiness_status || 'GREEN') as RiderStatus;
  const lastCheckTime = formatRelativeTime(dashboard?.last_check_at, t);
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
    router.push(withLocale(startCheckHref, locale));
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
      time: formatRelativeTime(check.timestamp, t),
      status: (check.overall_status || 'GREEN') as RiderStatus,
      latency: formatLatencyMs(check.latency_ms),
    }));
  }, [dashboard, t]);
 
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
            {t('last_check_prefix')}: {lastCheckTime}
          </p>
          <p className="mt-4 text-muted-foreground">{description}</p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Button
              className="w-full sm:w-auto"
              size="lg"
              onClick={handleStartShiftCheck}
              loading={startingShift}
              loadingText={t('start_shift_check_loading')}
              autoLoading={false}
            >
              {t('start_shift_check')}
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
                  <Label htmlFor="login-time">{t('shift_login')}</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="logout" id="logout-time" />
                  <Label htmlFor="logout-time">{t('shift_logout')}</Label>
                </div>
              </RadioGroup>
            )}
          </div>
          {loading && (
            <p className="mt-3 text-xs text-muted-foreground">
              {t('loading_latest_dashboard')}
            </p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>{t('health_index')}</CardTitle>
            <CardDescription>{t('last_30_checks')}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <AnimatedRadialChart value={healthIndex} size={220} />
          <div className="flex w-full justify-between text-sm text-muted-foreground">
            <span className="font-semibold text-green-600">{t('green_label')}: {checkCounts.green}</span>
            <span className="font-semibold text-yellow-600">{t('yellow_label')}: {checkCounts.yellow}</span>
            <span className="font-semibold text-red-600">{t('red_label')}: {checkCounts.red}</span>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="grid gap-2">
            <CardTitle>{t('recent_checks')}</CardTitle>
            <CardDescription>{t('recent_checks_subtitle')}</CardDescription>
          </div>
          <Button asChild size="sm" className="gap-1 self-start sm:ml-auto">
            <Link href="#">
              {t('view_all')}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('time')}</TableHead>
                <TableHead>{t('status')}</TableHead>
                <TableHead className="text-right">{t('latency')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentChecks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    {t('no_recent_checks_yet')}
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
