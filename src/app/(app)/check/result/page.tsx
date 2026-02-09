'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
  Coffee,
  MapPin,
  Ticket,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { RestStopSuggestion, RiderStatus } from '@/lib/types';
import type { AnalyzeRiderFaceForImpairmentOutput } from '@/ai/flows';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { getRestStopSuggestion, saveDetection, getDetectionReport } from '@/app/actions';
import { Skeleton } from '@/components/ui/skeleton';
import { AnalysisDetails } from '@/components/check/analysis-details';
import { DetectionReport } from '@/components/check/detection-report';
import type { DetectionResult } from '@/app/actions';

function ResultContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get('status') as RiderStatus | null;
  const reason = searchParams.get('reason');
  const impairmentString = searchParams.get('impairment');
  const userIdParam = searchParams.get('userId');
  const moodParam = searchParams.get('mood');
  
  const impairmentResult = impairmentString
    ? (JSON.parse(impairmentString) as AnalyzeRiderFaceForImpairmentOutput)
    : null;

  const [suggestion, setSuggestion] = useState<RestStopSuggestion | null>(null);
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
  const [detectionReport, setDetectionReport] = useState<DetectionResult | null>(null);
  const [isLoadingDetection, setIsLoadingDetection] = useState(false);
  const hasSavedDetectionRef = useRef(false);
  
  const restStopImage = PlaceHolderImages.find((img) => img.id === 'restStop');

  useEffect(() => {
    // Save detection if we have impairment results and userId
    if (impairmentResult && userIdParam && !hasSavedDetectionRef.current) {
      hasSavedDetectionRef.current = true;
      setIsLoadingDetection(true);
      
      // Build impairments object from impairment result
      const impairments: any = {
        intoxication: {
          detected: impairmentResult.intoxicationDetected || false,
          confidence: 0.75, // Default confidence for now
        },
        fatigue: {
          detected: impairmentResult.fatigueDetected || false,
          confidence: 0.75,
        },
        stress: {
          detected: impairmentResult.stressDetected || false,
          confidence: 0.75,
        },
        fever: {
          detected: impairmentResult.feverDetected || false,
          confidence: 0.75,
        },
      };

      saveDetection(userIdParam, impairments, moodParam || 'neutral').then((result) => {
        if (result.success && result.result) {
          setDetectionReport(result.result);
        }
        setIsLoadingDetection(false);
      });
    }
  }, [impairmentResult, userIdParam, moodParam]);

  useEffect(() => {
    if (status === 'RED' && reason !== 'Please remove eyewear and rescan') {
      setIsLoadingSuggestion(true);
      getRestStopSuggestion().then((data) => {
        setSuggestion(data);
        setIsLoadingSuggestion(false);
      });
    }
  }, [status, reason]);


  if (!status) {
    return (
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <CardTitle>Invalid Result</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Could not determine the check result. Please try again.</p>
          <Button asChild className="mt-4">
            <Link href="/check">Try Again</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const getRedStatusDescription = (reason: string | null): string => {
    const baseMessage = "Your app access is temporarily blocked for your safety.";
    const restMessage = "Please rest for 15 minutes before re-checking."
    switch (reason) {
      case 'Critical Cognitive Fatigue':
        return `Your reaction time was significantly slower than your baseline, indicating critical fatigue. This impairs your ability to react to road hazards. ${baseMessage} ${restMessage}`;
      case 'Fatigue Detected':
        return `Our system detected signs of significant fatigue, which can slow your reaction time. ${baseMessage} ${restMessage}`;
      case 'Intoxication Detected':
        return `Our system detected signs of intoxication. ${baseMessage} ${restMessage}`;
      case 'Fever Detected':
        return `Our system detected potential signs of fever. For your safety and the safety of others, please rest. ${baseMessage}`;
      case 'Please remove eyewear and rescan':
        return `You appear to be wearing eyewear. Please remove any glasses or sunglasses and perform the scan again to continue.`;
      default:
        return `A significant issue was detected: ${reason}. ${baseMessage} ${restMessage}`;
    }
  };

  const statusConfig = {
    GREEN: {
      icon: <ShieldCheck className="h-24 w-24 text-green-500" />,
      title: "You're cleared to start!",
      description: "You've passed the readiness check. Have a safe and productive shift.",
      bgColor: 'bg-green-500/10',
    },
    YELLOW: {
      icon: <ShieldAlert className="h-24 w-24 text-yellow-500" />,
      title: 'Limited Access Granted',
      description: 'A minor cognitive delay was detected. Please stick to local, low-speed deliveries and avoid highways. Re-check in 2 hours.',
      bgColor: 'bg-yellow-500/10',
    },
    RED: {
      icon: <ShieldOff className="h-24 w-24 text-red-500" />,
      title: reason === 'Please remove eyewear and rescan' ? 'Action Required' : 'Mandatory Rest Required',
      description: getRedStatusDescription(reason),
      bgColor: 'bg-red-500/10',
    },
  };

  const config = statusConfig[status];

  return (
    <div className="flex flex-col items-center gap-8 w-full">
        <Card className={`w-full max-w-lg text-center ${config.bgColor}`}>
        <CardContent className="pt-6">
            <div className="flex justify-center mb-6">{config.icon}</div>
            <h1 className="text-3xl font-bold mb-2">{config.title}</h1>
            <p className="text-muted-foreground mb-6">{config.description}</p>
            <div className="flex gap-4 justify-center">
            <Button asChild>
              <Link href="/">Go to Dashboard</Link>
            </Button>
            <Button asChild variant={status === 'RED' ? 'default' : 'outline'}>
                <Link href="/check">{reason === 'Please remove eyewear and rescan' ? 'Scan Again' : 'Re-check Status'}</Link>
            </Button>
            </div>
        </CardContent>
        </Card>

        {impairmentResult && reason !== 'Please remove eyewear and rescan' && (
           <AnalysisDetails impairmentResult={impairmentResult} />
        )}

        {status === 'RED' && reason !== 'Please remove eyewear and rescan' && (
            <Card >
                
                
            </Card>
        )}

        {/* Detection Report */}
        {isLoadingDetection && (
          <Card className="w-full max-w-lg">
            <CardContent className="pt-6 space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        )}

        
    </div>
  );
}


export default function ResultPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
            <ResultContent />
        </Suspense>
    )
}
