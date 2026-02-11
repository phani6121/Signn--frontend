'use client';

import {
  File,
  ListFilter,
  MoreHorizontal,
  PlusCircle,
  Search,
  Eye,
  ShieldCheck,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { useTranslations } from 'next-intl';
import type { ReadinessCheck } from '@/lib/types';
import { AnalysisDetails } from '@/components/check/analysis-details';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const ADMIN_API_KEY = process.env.NEXT_PUBLIC_ADMIN_API_KEY;

type LedgerApiItem = {
  rider_id?: string | null;
  status?: string | null;
  reason?: string | null;
  check_id?: string | null;
  updated_at?: string | null;
  latency?: number | string | null;
  latency_ms?: number | string | null;
  cognitive_test?: {
    latency?: number | string | null;
  } | null;
};

type LedgerApiResponse = {
  page: number;
  limit: number;
  total?: number | null;
  items: LedgerApiItem[];
};

export default function AdminLedgerPage() {
  const t = useTranslations();
  const [selectedEntry, setSelectedEntry] = useState<ReadinessCheck | null>(null);
  const [entries, setEntries] = useState<ReadinessCheck[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [riderQuery, setRiderQuery] = useState('');
  const [riderIdFilter, setRiderIdFilter] = useState<string | null>(null);

  const parseLatency = (item: LedgerApiItem): number | undefined => {
    const raw = item.latency_ms ?? item.latency ?? item.cognitive_test?.latency;
    if (raw === null || raw === undefined) return undefined;
    if (typeof raw === 'number') return Number.isFinite(raw) ? raw : undefined;
    if (typeof raw === 'string' && raw.trim() === '') return undefined;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const formatLatency = (value: number): string => {
    const truncated = Math.trunc(value * 1000) / 1000;
    return Number.isInteger(truncated)
      ? String(truncated)
      : truncated.toFixed(3).replace(/\.?0+$/, '');
  };

  const handleViewDetails = (entry: ReadinessCheck) => {
    setSelectedEntry(entry);
  }

  const handleExport = () => {
    const csvRows = [];
    // Define headers, including flattened impairment data
    const impairmentKeys = entries[0]?.impairment ? Object.keys(entries[0].impairment) : [];
    const headers = ['checkId', 'riderId', 'timestamp', 'status', 'reason', 'latency', ...impairmentKeys];
    csvRows.push(headers.join(','));

    // Convert each entry to a CSV row
    for (const entry of entries) {
        const values = [
            entry.id,
            entry.riderId,
            entry.timestamp,
            entry.status,
            `"${entry.reason.replace(/"/g, '""')}"`, // Handle quotes in reason
            entry.latency ?? '',
        ];
        if (entry.impairment) {
            for (const key of impairmentKeys) {
                // @ts-ignore
                values.push(entry.impairment[key] ?? '');
            }
        }
        csvRows.push(values.join(','));
    }

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `compliance-ledger-${new Date().toISOString()}.csv`);
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;
    const loadLedger = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('limit', String(limit));
        if (statusFilter) params.set('status', statusFilter);
        if (riderIdFilter) params.set('rider_id', riderIdFilter);

        const response = await fetch(
          `${API_BASE_URL}/api/v1/admin/compliance/ledger?${params.toString()}`,
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
        const data = (await response.json()) as LedgerApiResponse;
        const mapped: ReadinessCheck[] = (data.items || []).map((item) => ({
          // Never default missing status to GREEN; incomplete checks should not appear passed.
          status: (
            item.status === 'GREEN' || item.status === 'YELLOW' || item.status === 'RED'
              ? item.status
              : 'YELLOW'
          ) as ReadinessCheck['status'],
          id: item.check_id || 'unknown',
          riderId: item.rider_id || 'Unknown',
          reason: item.reason || 'Assessment incomplete',
          timestamp: item.updated_at || new Date().toISOString(),
          latency: parseLatency(item),
        }));
        if (!cancelled) {
          setEntries(mapped);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError('Unable to load ledger data.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadLedger();
    timer = window.setInterval(loadLedger, 60000);
    return () => {
      cancelled = true;
      if (timer) {
        window.clearInterval(timer);
      }
    };
  }, [page, limit, statusFilter, riderIdFilter]);

  const visibleEntries = useMemo(() => entries, [entries]);
  const canGoPrev = page > 1;
  const canGoNext = visibleEntries.length === limit;

  const ledgerTable = (
    <Card>
      <CardHeader>
        <CardTitle>Compliance Ledger</CardTitle>
        <CardDescription>
          An immutable, searchable database of every readiness check.
        </CardDescription>
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
              <TableHead>Check ID</TableHead>
              <TableHead>User ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Latency</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && visibleEntries.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>Loading ledger...</TableCell>
              </TableRow>
            )}
            {!loading && visibleEntries.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>No ledger entries found.</TableCell>
              </TableRow>
            )}
            {visibleEntries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="font-medium">{entry.id}</TableCell>
                <TableCell>{entry.riderId}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      entry.status === 'GREEN'
                        ? 'default'
                        : entry.status === 'YELLOW'
                        ? 'secondary'
                        : 'destructive'
                    }
                    className={
                      entry.status === 'GREEN'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        : entry.status === 'YELLOW'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                        : ''
                    }
                  >
                    {entry.status}
                  </Badge>
                </TableCell>
                <TableCell>{entry.latency !== undefined ? `${formatLatency(entry.latency)}ms` : '--'}</TableCell>
                <TableCell>{entry.reason}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        aria-haspopup="true"
                        size="icon"
                        variant="ghost"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onSelect={() => handleViewDetails(entry)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>Create Report</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            Page <strong>{page}</strong> · Showing <strong>{visibleEntries.length}</strong> entries
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={!canGoPrev || loading}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={!canGoNext || loading}
              onClick={() => setPage((prev) => prev + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );

  return (
    <>
    <Tabs
      defaultValue="all"
      onValueChange={(value) => {
        if (value === 'all') {
          setStatusFilter(null);
        } else {
          setStatusFilter(value.toUpperCase());
        }
        setPage(1);
      }}
    >
      <div className="flex items-center">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="green">Green</TabsTrigger>
          <TabsTrigger value="yellow">Yellow</TabsTrigger>
          <TabsTrigger value="red">Red</TabsTrigger>
        </TabsList>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative ml-auto flex-1 md:grow-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by User ID..."
              className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
              value={riderQuery}
              onChange={(event) => {
                const value = event.target.value;
                setRiderQuery(value);
                setRiderIdFilter(value.trim() ? value.trim() : null);
                setPage(1);
              }}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1">
                <ListFilter className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Filter
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem checked>
                Status
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem>Date Range</DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" variant="outline" className="h-9 gap-1" onClick={handleExport}>
            <File className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Export
            </span>
          </Button>
        </div>
      </div>
      <TabsContent value="all">{ledgerTable}</TabsContent>
      <TabsContent value="green">{ledgerTable}</TabsContent>
      <TabsContent value="yellow">{ledgerTable}</TabsContent>
      <TabsContent value="red">{ledgerTable}</TabsContent>
    </Tabs>

    {selectedEntry && (
        <Dialog open={!!selectedEntry} onOpenChange={(isOpen) => !isOpen && setSelectedEntry(null)}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Check Details: {selectedEntry.id}</DialogTitle>
                    <DialogDescription>
                       Audit trail for check conducted on {new Date(selectedEntry.timestamp).toLocaleString()}.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Scan Summary</h3>
                        <div className="rounded-lg border bg-muted p-4 text-center">
                            <ShieldCheck className="h-8 w-8 mx-auto text-muted-foreground" />
                            <p className="text-sm text-muted-foreground mt-2">
                                For rider privacy, the captured image was deleted immediately after analysis and is not stored.
                            </p>
                        </div>
                        <div className="space-y-2 text-sm">
                            <p><strong>User ID:</strong> {selectedEntry.riderId}</p>
                            <p><strong>Status:</strong> <Badge variant={selectedEntry.status === 'GREEN' ? 'default' : selectedEntry.status === 'YELLOW' ? 'secondary' : 'destructive'}>{selectedEntry.status}</Badge></p>
                            <p><strong>Reason:</strong> {selectedEntry.reason}</p>
                            <p><strong>Cognitive Latency:</strong> {selectedEntry.latency !== undefined ? `${formatLatency(selectedEntry.latency)}ms` : '--'}</p>
                        </div>
                    </div>
                    <div>
                        {selectedEntry.impairment && <AnalysisDetails impairmentResult={selectedEntry.impairment} />}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )}
    </>
  );
}
