'use client';

import { ArrowUpRight, ShieldAlert, ShieldCheck, ShieldOff } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RiderStatus } from '@/lib/types';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const ADMIN_API_KEY = process.env.NEXT_PUBLIC_ADMIN_API_KEY;

type RecentCheck = {
  rider_id?: string | null;
  status?: RiderStatus | null;
  reason?: string | null;
  check_id?: string | null;
  updated_at?: string | null;
};

const StatusIcon = ({ status }: { status: RiderStatus }) => {
    switch (status) {
        case 'GREEN':
            return <ShieldCheck className="w-4 h-4 text-green-500" />;
        case 'YELLOW':
            return <ShieldAlert className="w-4 h-4 text-yellow-500" />;
        case 'RED':
            return <ShieldOff className="w-4 h-4 text-red-500" />;
        default:
            return null;
    }
}

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

export function RecentChecks() {
  const t = useTranslations();
  const [checks, setChecks] = useState<RecentCheck[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rangeDays, setRangeDays] = useState<'all' | '1' | '7' | '14' | '21'>('all');

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;

    const loadChecks = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/v1/admin/readiness/recent?limit=10`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              ...(ADMIN_API_KEY
                ? { Authorization: `Bearer ${ADMIN_API_KEY}` }
                : {}),
            },
          }
        );
        if (!response.ok) {
          throw new Error(`Request failed: ${response.status}`);
        }
        const data = (await response.json()) as RecentCheck[];
        if (!cancelled) {
          setChecks(Array.isArray(data) ? data : []);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError('Unable to load recent checks.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadChecks();
    timer = window.setInterval(loadChecks, 60000);

    return () => {
      cancelled = true;
      if (timer) {
        window.clearInterval(timer);
      }
    };
  }, []);

  const cutoffMs = useMemo(() => {
    if (rangeDays === 'all') return null;
    const days = Number(rangeDays);
    if (!Number.isFinite(days)) return null;
    return Date.now() - days * 24 * 60 * 60 * 1000;
  }, [rangeDays]);

  const rows = useMemo(() => {
    const filtered = cutoffMs === null
      ? checks
      : checks.filter((check) => {
          if (!check.updated_at) return false;
          const hasTimezone = /[Zz]|[+-]\d{2}:\d{2}$/.test(check.updated_at);
          const normalized = hasTimezone ? check.updated_at : `${check.updated_at}Z`;
          const parsed = new Date(normalized);
          if (Number.isNaN(parsed.getTime())) return false;
          return parsed.getTime() >= cutoffMs;
        });

    return filtered.map((check) => ({
      rider: check.rider_id || 'Unknown',
      time: formatRelativeTime(check.updated_at),
      status: (check.status || 'GREEN') as RiderStatus,
      reason: check.reason || '-',
      checkId: check.check_id || check.rider_id || Math.random().toString(36),
    }));
  }, [checks, cutoffMs]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center">
        <div className="grid gap-2">
          <CardTitle>Recent Readiness Checks</CardTitle>
          <CardDescription>
            Live feed of rider checks as they happen.
          </CardDescription>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Select
            value={rangeDays}
            onValueChange={(value) => setRangeDays(value as typeof rangeDays)}
          >
            <SelectTrigger className="h-9 w-[180px]">
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
          <Button asChild size="sm" className="gap-1">
            <Link href="/admin/ledger">
              View Full Ledger
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-3 text-sm text-red-600">
            {error}
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('rider')}</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead className="text-right">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={4}>Loading latest checks...</TableCell>
              </TableRow>
            )}
            {!loading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={4}>No recent checks yet.</TableCell>
              </TableRow>
            )}
            {rows.map((check) => (
              <TableRow key={check.checkId}>
                <TableCell>
                  <div className="font-medium">{check.rider}</div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`
                      ${check.status === 'GREEN' && 'border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400'}
                      ${check.status === 'YELLOW' && 'border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400'}
                      ${check.status === 'RED' && 'border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-400'}
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <StatusIcon status={check.status as RiderStatus} />
                      {check.status}
                    </div>
                  </Badge>
                </TableCell>
                <TableCell>{check.reason}</TableCell>
                <TableCell className="text-right">{check.time}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
