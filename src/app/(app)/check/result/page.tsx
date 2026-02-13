'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
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
import { getLocaleFromPathname, withLocale } from '@/i18n/config';
import { useLanguage } from '@/context/language-context';
import { getMessagesForLocale } from '@/lib/i18n';

function ResultContent() {
  const { language } = useLanguage();
  const messages = getMessagesForLocale(language);
  const t = (key: string, values?: Record<string, string>) => {
    let text = messages[key] || key;
    if (!values) return text;
    for (const [name, value] of Object.entries(values)) {
      text = text.replaceAll(`{${name}}`, value);
    }
    return text;
  };
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
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
          <CardTitle>{t('invalid_result_title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{t('invalid_result_desc')}</p>
          <Button asChild className="mt-4">
            <Link href={withLocale('/check', locale)}>{t('try_again')}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const getRedStatusDescription = (reason: string | null): string => {
    const baseMessage = t('result_base_block_message');
    const restMessage = t('result_rest_message');
    switch (reason) {
      case 'Critical Cognitive Fatigue':
        return t('result_desc_critical_cognitive_fatigue', {
          baseMessage,
          restMessage,
        });
      case 'Fatigue Detected':
        return t('result_desc_fatigue_detected', {
          baseMessage,
          restMessage,
        });
      case 'Intoxication Detected':
        return t('result_desc_intoxication_detected', {
          baseMessage,
          restMessage,
        });
      case 'Fever Detected':
        return t('result_desc_fever_detected', {baseMessage});
      case 'Please remove eyewear and rescan':
        return t('result_desc_remove_eyewear');
      default:
        return t('result_desc_general_issue', {
          reason: reason || t('unknown_status'),
          baseMessage,
          restMessage,
        });
    }
  };

  const statusConfig = {
    GREEN: {
      icon: <ShieldCheck className="h-24 w-24 text-green-500" />,
      title: t('result_green_title'),
      description: t('result_green_description'),
      bgColor: 'bg-green-500/10',
    },
    YELLOW: {
      icon: <ShieldAlert className="h-24 w-24 text-yellow-500" />,
      title: t('result_yellow_title'),
      description: t('result_yellow_description'),
      bgColor: 'bg-yellow-500/10',
    },
    RED: {
      icon: <ShieldOff className="h-24 w-24 text-red-500" />,
      title:
        reason === 'Please remove eyewear and rescan'
          ? t('action_required')
          : t('mandatory_rest_required'),
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
              <Link href={withLocale('/', locale)}>{t('go_to_dashboard')}</Link>
            </Button>
            <Button asChild variant={status === 'RED' ? 'default' : 'outline'}>
                <Link href={withLocale('/check', locale)}>
                  {reason === 'Please remove eyewear and rescan'
                    ? t('scan_again')
                    : t('re_check_status')}
                </Link>
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
