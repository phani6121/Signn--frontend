'use client';

import Link from 'next/link';
import {
  Activity,
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
import { useLanguage } from '@/context/language-context';
import { LanguageSwitcher } from '@/components/language-switcher';

// This component is a combination of the original /app/(app)/layout.tsx and /app/(app)/page.tsx
// to work around a Next.js routing conflict with the AuthProvider.

// Mock data, in a real app this would come from Firestore
const currentStatus: RiderStatus = 'GREEN';
const lastCheckTime = '15 minutes ago';

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

const recentChecks = [
  {
    time: '2 hours ago',
    status: 'GREEN',
    latency: '145ms',
  },
  {
    time: 'Yesterday',
    status: 'GREEN',
    latency: '140ms',
  },
  {
    time: '2 days ago',
    status: 'YELLOW',
    latency: '190ms',
  },
];

function RiderDashboard() {
  const { t } = useLanguage();
  const { icon, text, description } = statusConfig[currentStatus];
  return (
    <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
      <Card className="lg:col-span-2">
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
          <Button asChild className="mt-6 w-full sm:w-auto" size="lg">
            <Link href="/check">Start New Shift Check</Link>
          </Button>
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
              {recentChecks.map((check, index) => (
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
              ))}
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
