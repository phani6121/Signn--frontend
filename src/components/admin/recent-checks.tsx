'use client';

import { ArrowUpRight, ShieldAlert, ShieldCheck, ShieldOff } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RiderStatus } from '@/lib/types';
import Link from 'next/link';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const ADMIN_API_KEY = process.env.NEXT_PUBLIC_ADMIN_API_KEY;

type RecentCheck = {
  rider_id?: string | null;
  status?: RiderStatus | string | null;
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
};

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

function normalizeStatus(input?: string | null): RiderStatus | null {
  const s = (input || '').toUpperCase();
  if (s === 'GREEN' || s === 'YELLOW' || s === 'RED') return s as RiderStatus;
  return null;
}

export function RecentChecks() {
  const [checks, setChecks] = useState<RecentCheck[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rangeDays, setRangeDays] = useState<'all' | '1' | '7' | '14' | '21'>('all');

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;
    let inFlight = false;

    const loadChecks = async () => {
      if (inFlight) return;
      inFlight = true;
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('limit', '10');

        // If your backend supports it, great. If not, it will still work as long as it ignores unknown params.
        if (rangeDays === 'all') params.set('all_time', 'true');
        else params.set('range_days', rangeDays);

        const response = await fetch(`${API_BASE_URL}/api/v1/admin/readiness/recent?${params.toString()}`, {
          method: 'GET',
          headers: {
            ...(ADMIN_API_KEY ? { Authorization: `Bearer ${ADMIN_API_KEY}` } : {}),
          },
          cache: 'no-store',
        });

        if (!response.ok) throw new Error(`Request failed: ${response.status}`);

        const data = (await response.json()) as RecentCheck[];
        if (!cancelled) {
          setChecks(Array.isArray(data) ? data : []);
          setError(null);
        }
      } catch {
        if (!cancelled) setError('Unable to load recent checks.');
      } finally {
        inFlight = false;
        if (!cancelled) setLoading(false);
      }
    };

    loadChecks();
    timer = window.setInterval(loadChecks, 15000);

    return () => {
      cancelled = true;
      if (timer) window.clearInterval(timer);
    };
  }, [rangeDays]);

  const rows = useMemo(() => {
    return checks
      .map((check) => {
        const status = normalizeStatus(check.status as string);
        if (!status) return null;

        const checkId =
          check.check_id ||
          (check.rider_id && check.updated_at ? `${check.rider_id}-${check.updated_at}` : null) ||
          `row-${Math.random().toString(36).slice(2)}`;

        return {
          rider: check.rider_id || 'Unknown',
          time: formatRelativeTime(check.updated_at),
          status,
          reason: check.reason || '-',
          checkId,
        };
      })
      .filter(
        (row): row is { rider: string; time: string; status: RiderStatus; reason: string; checkId: string } =>
          row !== null
      );
  }, [checks]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center">
        <div className="grid gap-2">
          <CardTitle>Recent Readiness Checks</CardTitle>
          <CardDescription>Live feed of rider checks as they happen.</CardDescription>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Select value={rangeDays} onValueChange={(value) => setRangeDays(value as typeof rangeDays)}>
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
              View Full Ledger <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {error && <div className="mb-3 text-sm text-red-600">{error}</div>}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
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
                      <StatusIcon status={check.status} />
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
