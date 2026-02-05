'use client';

import {
  ShieldCheck,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AnalyzeRiderFaceForImpairmentOutput } from '@/ai/flows';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const MoodIcon = ({ mood }: { mood: string }) => {
  const commonProps = {
    viewBox: "0 0 24 24",
    className: "h-10 w-10",
    strokeWidth: "2",
    fill: "none",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (mood.toLowerCase()) {
    case 'happy':
      return (
        <svg {...commonProps}>
          <rect x="3" y="3" width="18" height="18" rx="3" className="stroke-green-500" />
          <circle cx="9" cy="10" r="1" className="fill-green-500 stroke-none" />
          <circle cx="15" cy="10" r="1" className="fill-green-500 stroke-none" />
          <path d="M9 15a3 3 0 016 0" className="stroke-green-500" />
        </svg>
      );
    case 'neutral':
      return (
        <svg {...commonProps}>
          <rect x="3" y="3" width="18" height="18" rx="3" className="stroke-yellow-500" />
          <circle cx="9" cy="10" r="1" className="fill-yellow-500 stroke-none" />
          <circle cx="15" cy="10" r="1" className="fill-yellow-500 stroke-none" />
          <line x1="9" y1="15" x2="15" y2="15" className="stroke-yellow-500" />
        </svg>
      );
    case 'sad':
        return (
            <svg {...commonProps}>
              <rect x="3" y="3" width="18" height="18" rx="3" className="stroke-orange-500" />
              <circle cx="9" cy="10" r="1" className="fill-orange-500 stroke-none" />
              <circle cx="15" cy="10" r="1" className="fill-orange-500 stroke-none" />
              <path d="M9 16a3 3 0 006 0" className="stroke-orange-500" />
            </svg>
        );
    case 'angry':
        return (
            <svg {...commonProps}>
              <rect x="3" y="3" width="18" height="18" rx="3" className="stroke-red-500" />
              <circle cx="9" cy="10" r="1" className="fill-red-500 stroke-none" />
              <circle cx="15" cy="10" r="1" className="fill-red-500 stroke-none" />
              <path d="M9 16a3 3 0 006 0" className="stroke-red-500" />
            </svg>
        );
    default:
      return (
         <svg {...commonProps}>
          <rect x="3" y="3" width="18" height="18" rx="3" className="stroke-muted-foreground" />
          <circle cx="9" cy="10" r="1" className="fill-muted-foreground stroke-none" />
          <circle cx="15" cy="10" r="1" className="fill-muted-foreground stroke-none" />
          <line x1="9" y1="15" x2="15" y2="15" className="stroke-muted-foreground" />
        </svg>
      );
  }
};


const SignalIndicator = ({
  label,
  detected,
  description,
}: {
  label: string;
  detected: boolean;
  description?: string;
}) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-1.5">
      <p>{label}</p>
      {description && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 cursor-pointer text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">{description}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
    {detected ? (
      <div className="flex items-center gap-2 text-destructive">
        <ShieldAlert className="h-5 w-5" />
        <span>Detected</span>
      </div>
    ) : (
      <div className="flex items-center gap-2 text-green-500">
        <ShieldCheck className="h-5 w-5" />
        <span>Not Detected</span>
      </div>
    )}
  </div>
);

type AnalysisDetailsProps = {
    impairmentResult: AnalyzeRiderFaceForImpairmentOutput;
}

export function AnalysisDetails({ impairmentResult }: AnalysisDetailsProps) {
    if (!impairmentResult) return null;

    return (
        <Card className="w-full">
            <CardHeader>
            <CardTitle>Analysis Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
            <div className="flex items-center justify-between rounded-lg bg-muted p-4">
                <div className="space-y-1">
                <p className="text-sm font-medium">Mood Meter</p>
                <p className="text-2xl font-bold capitalize">
                    {impairmentResult.mood}
                </p>
                </div>
                <MoodIcon mood={impairmentResult.mood} />
            </div>
            <div className="space-y-4">
                <h3 className="font-semibold">Health & Impairment Signals</h3>
                <SignalIndicator
                label="Intoxication"
                detected={impairmentResult.intoxicationDetected}
                description="Impairment from alcohol or other substances, detected through signs like eye redness and pupil reactivity."
                />
                <SignalIndicator
                label="Fatigue"
                detected={impairmentResult.fatigueDetected}
                description="A state of tiredness detected through signs like slow eye movement, facial drooping, and failure to follow blink instructions."
                />
                <SignalIndicator
                  label="Stress"
                  detected={impairmentResult.stressDetected}
                  description="Signs of high stress, such as facial tension or a furrowed brow, which can impact focus and decision-making."
                />
                <SignalIndicator
                label="Fever"
                detected={impairmentResult.feverDetected}
                description="An abnormally high body temperature, often a sign of illness, detected through indicators like flushed skin and excessive sweating."
                />
            </div>
            </CardContent>
        </Card>
    )
}
