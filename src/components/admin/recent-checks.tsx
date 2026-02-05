'use client';

import { ArrowUpRight, ShieldAlert, ShieldCheck, ShieldOff } from 'lucide-react';
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
import { RiderStatus } from '@/lib/types';
import Link from 'next/link';
import { useLanguage } from '@/context/language-context';

const checks = [
  {
    rider: 'Rider-451',
    time: '2 minutes ago',
    status: 'RED',
    reason: 'Critical Cognitive Fatigue',
  },
  {
    rider: 'Rider-237',
    time: '5 minutes ago',
    status: 'GREEN',
    reason: 'Clear',
  },
  {
    rider: 'Rider-890',
    time: '8 minutes ago',
    status: 'YELLOW',
    reason: 'Slight impairment detected',
  },
  {
    rider: 'Rider-112',
    time: '10 minutes ago',
    status: 'GREEN',
    reason: 'Clear',
  },
  {
    rider: 'Rider-303',
    time: '12 minutes ago',
    status: 'GREEN',
    reason: 'Clear',
  },
];

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

export function RecentChecks() {
  const { t } = useLanguage();
  return (
    <Card>
      <CardHeader className="flex flex-row items-center">
        <div className="grid gap-2">
          <CardTitle>Recent Readiness Checks</CardTitle>
          <CardDescription>
            Live feed of rider checks as they happen.
          </CardDescription>
        </div>
        <Button asChild size="sm" className="ml-auto gap-1">
          <Link href="/admin/ledger">
            View Full Ledger
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
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
            {checks.map((check) => (
              <TableRow key={check.rider}>
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
