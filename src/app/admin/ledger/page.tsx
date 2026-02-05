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
import { useState } from 'react';
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
import { useLanguage } from '@/context/language-context';
import type { ReadinessCheck } from '@/lib/types';
import { AnalysisDetails } from '@/components/check/analysis-details';


// Mock data
const ledgerEntries: ReadinessCheck[] = [
  {
    id: 'CHECK-001',
    riderId: 'Rider-451',
    status: 'RED',
    reason: 'Critical Cognitive Fatigue',
    timestamp: '2024-07-29T10:30:00Z',
    latency: 280,
    impairment: {
        "intoxicationDetected": false,
        "fatigueDetected": true,
        "stressDetected": true,
        "blinkInstructionFollowed": false,
        "eyeScleraRednessScore": 0.2,
        "facialDroopingDetected": true,
        "microNodsDetected": true,
        "pupilReactivityScore": 0.8,
        "feverDetected": false,
        "eyewearDetected": false,
        "mood": "sad"
    }
  },
  {
    id: 'CHECK-002',
    riderId: 'Rider-237',
    status: 'GREEN',
    reason: 'Clear',
    timestamp: '2024-07-29T10:28:00Z',
    latency: 140,
    impairment: {
        "intoxicationDetected": false,
        "fatigueDetected": false,
        "stressDetected": false,
        "blinkInstructionFollowed": true,
        "eyeScleraRednessScore": 0.1,
        "facialDroopingDetected": false,
        "microNodsDetected": false,
        "pupilReactivityScore": 0.9,
        "feverDetected": false,
        "eyewearDetected": false,
        "mood": "happy"
    }
  },
  {
    id: 'CHECK-003',
    riderId: 'Rider-890',
    status: 'YELLOW',
    reason: 'Slight impairment detected',
    timestamp: '2024-07-29T10:25:00Z',
    latency: 195,
    impairment: {
        "intoxicationDetected": false,
        "fatigueDetected": false,
        "stressDetected": true,
        "blinkInstructionFollowed": true,
        "eyeScleraRednessScore": 0.3,
        "facialDroopingDetected": false,
        "microNodsDetected": false,
        "pupilReactivityScore": 0.8,
        "feverDetected": false,
        "eyewearDetected": false,
        "mood": "neutral"
    }
  },
  {
    id: 'CHECK-004',
    riderId: 'Rider-112',
    status: 'GREEN',
    reason: 'Clear',
    timestamp: '2024-07-29T10:22:00Z',
    latency: 155,
    impairment: {
        "intoxicationDetected": false,
        "fatigueDetected": false,
        "stressDetected": false,
        "blinkInstructionFollowed": true,
        "eyeScleraRednessScore": 0.1,
        "facialDroopingDetected": false,
        "microNodsDetected": false,
        "pupilReactivityScore": 0.9,
        "feverDetected": false,
        "eyewearDetected": false,
        "mood": "neutral"
    }
  },
    {
    id: 'CHECK-005',
    riderId: 'Rider-789',
    status: 'GREEN',
    reason: 'Clear',
    timestamp: '2024-07-28T22:05:00Z',
    latency: 150,
    impairment: {
        "intoxicationDetected": false,
        "fatigueDetected": false,
        "stressDetected": false,
        "blinkInstructionFollowed": true,
        "eyeScleraRednessScore": 0.1,
        "facialDroopingDetected": false,
        "microNodsDetected": false,
        "pupilReactivityScore": 0.9,
        "feverDetected": false,
        "eyewearDetected": false,
        "mood": "happy"
    }
  },
];

export default function AdminLedgerPage() {
  const { t } = useLanguage();
  const [selectedEntry, setSelectedEntry] = useState<ReadinessCheck | null>(null);

  const handleViewDetails = (entry: ReadinessCheck) => {
    setSelectedEntry(entry);
  }

  const handleExport = () => {
    const csvRows = [];
    // Define headers, including flattened impairment data
    const impairmentKeys = ledgerEntries[0].impairment ? Object.keys(ledgerEntries[0].impairment) : [];
    const headers = ['checkId', 'riderId', 'timestamp', 'status', 'reason', 'latency', ...impairmentKeys];
    csvRows.push(headers.join(','));

    // Convert each entry to a CSV row
    for (const entry of ledgerEntries) {
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


  return (
    <>
    <Tabs defaultValue="all">
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
              placeholder={t('search_by_rider_id')}
              className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
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
      <TabsContent value="all">
        <Card>
          <CardHeader>
            <CardTitle>Compliance Ledger</CardTitle>
            <CardDescription>
              An immutable, searchable database of every readiness check.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Check ID</TableHead>
                  <TableHead>{t('rider_id')}</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Latency</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledgerEntries.map((entry) => (
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
                    <TableCell>{entry.latency}ms</TableCell>
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
            <div className="text-xs text-muted-foreground">
              Showing <strong>1-5</strong> of <strong>32</strong> entries
            </div>
          </CardFooter>
        </Card>
      </TabsContent>
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
                            <p><strong>Rider ID:</strong> {selectedEntry.riderId}</p>
                            <p><strong>Status:</strong> <Badge variant={selectedEntry.status === 'GREEN' ? 'default' : selectedEntry.status === 'YELLOW' ? 'secondary' : 'destructive'}>{selectedEntry.status}</Badge></p>
                            <p><strong>Reason:</strong> {selectedEntry.reason}</p>
                            <p><strong>Cognitive Latency:</strong> {selectedEntry.latency}ms</p>
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
