'use client';

import React, { useState, useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

import { CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// ✅ MediaPipe imports
import { initFaceLandmarker } from '@/lib/vision/faceLandmarker';
import {
  extractMetrics,
  createInitialMetricsState,
} from '@/lib/vision/metrics';

type CameraCaptureProps = {
  onCapture: (photoDataUri: string) => void;
};

/* ------------------ Gauge Meter Component ------------------ */
const GaugeMeter = ({
  label,
  value,
  variant,
}: {
  label: string;
  value: number;
  variant: 'health' | 'stress' | 'mood';
}) => {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  const variants = {
    health: 'stroke-green-500',
    stress: 'stroke-yellow-500',
    mood: 'stroke-blue-500',
  };

  return (
    <div className="flex flex-col items-center gap-1.5 text-white">
      <div className="relative w-16 h-16">
        <svg className="w-full h-full -rotate-90 transform">
          <circle
            className="text-white/20"
            strokeWidth="6"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="32"
            cy="32"
          />
          <circle
            className={cn(
              variants[variant],
              'transition-all duration-300 ease-linear'
            )}
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="32"
            cy="32"
          />
        </svg>

        <span className="absolute inset-0 flex items-center justify-center text-lg font-bold">
          {Math.round(value)}
        </span>
      </div>

      <span className="text-xs font-medium">{label}</span>
    </div>
  );
};

/* ------------------ Main Component ------------------ */
export function CameraCapture({ onCapture }: CameraCaptureProps) {
  const [status, setStatus] = useState<'idle' | 'scanning' | 'complete'>(
    'idle'
  );
  const [scanProgress, setScanProgress] = useState(0);
  const [healthValue, setHealthValue] = useState(0);
  const [stressValue, setStressValue] = useState(0);
  const [moodValue, setMoodValue] = useState(0);
  const [hasCameraPermission, setHasCameraPermission] =
    useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const scanIntervalRef = useRef<number | null>(null);

  // ✅ MediaPipe refs
  const landmarkerRef = useRef<any>(null);
  const metricsStateRef = useRef(createInitialMetricsState());

  const { toast } = useToast();

  /* ---------------- Cleanup ---------------- */
  useEffect(() => {
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, []);

  /* ---------------- Start Camera ---------------- */
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setHasCameraPermission(true);
    } catch (error) {
      console.error('Camera Error:', error);
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: 'Camera Blocked',
        description: 'Please allow camera permission in browser settings.',
      });
    }
  };

  /* ---------------- Handle Scan ---------------- */
  const handleScan = async () => {
    if (status !== 'idle') return;

    if (!hasCameraPermission) {
      await startCamera();
      return;
    }

    // ✅ Init MediaPipe once per scan
    if (!landmarkerRef.current) {
      landmarkerRef.current = await initFaceLandmarker();
    }

    setStatus('scanning');
    setScanProgress(0);
    setHealthValue(0);
    setStressValue(0);
    setMoodValue(0);

    const scanDuration = 15;
    let secondsPassed = 0;

    scanIntervalRef.current = window.setInterval(() => {
      secondsPassed++;

      const progress = (secondsPassed / scanDuration) * 100;
      setScanProgress(progress);

      /* ---------- MediaPipe per-frame processing ---------- */
      const video = videoRef.current;
      const landmarker = landmarkerRef.current;

      if (video && landmarker) {
        // MediaPipe throws if the video element isn't ready yet
        if (video.readyState < 2 || video.videoWidth === 0) {
          return;
        }

        let res;
        try {
          res = landmarker.detectForVideo(video, performance.now());
        } catch (err) {
          console.error('FaceLandmarker detectForVideo error:', err);
          return;
        }

        if (res?.faceLandmarks?.length) {
          const metrics = extractMetrics(
            res.faceLandmarks[0],
            res.faceBlendshapes?.[0],
            metricsStateRef.current
          );

          // 🔴 Send REAL metrics to backend
          fetch('/api/v1/scan/frame', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              scan_id: 'TEMP_SCAN_ID',
              frame_data: metrics,
            }),
          }).catch(() => {});
        }
      }

      // 🟡 UI animation remains unchanged
      setHealthValue(Math.min(100, progress * 0.8 + Math.random() * 20));
      setStressValue(Math.min(100, progress * 0.3 + Math.random() * 20));
      setMoodValue(Math.min(100, progress * 0.6 + Math.random() * 40));

      if (secondsPassed >= scanDuration) {
        clearInterval(scanIntervalRef.current!);
        scanIntervalRef.current = null;
        captureImage();
      }
    }, 1000);
  };

  /* ---------------- Capture Image ---------------- */
  const captureImage = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0);
    const photoDataUri = canvas.toDataURL('image/jpeg');

    setStatus('complete');
    onCapture(photoDataUri);
  };

  /* ---------------- UI ---------------- */
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-center">AI Vision Analysis</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col items-center gap-4">
        <div className="relative flex h-64 w-full items-center justify-center rounded-lg border overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />

          {status === 'scanning' && (
            <div className="absolute inset-0 flex flex-col justify-end gap-4 p-4 bg-black/60">
              <div className="flex justify-around">
                <GaugeMeter label="Health" value={healthValue} variant="health" />
                <GaugeMeter label="Stress" value={stressValue} variant="stress" />
                <GaugeMeter label="Mood" value={moodValue} variant="mood" />
              </div>

              <Progress value={scanProgress} className="h-3" />

              <p className="text-center text-white font-semibold">
                {15 - Math.floor((scanProgress / 100) * 15)} seconds remaining...
              </p>
            </div>
          )}

          {status === 'complete' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <p className="text-white text-xl font-bold">Scan Complete</p>
            </div>
          )}
        </div>

        <p className="text-sm text-muted-foreground text-center">
          Click start, keep your face centered, blink slowly 3–5 times.
        </p>

        <Button
          onClick={handleScan}
          className="w-full"
          disabled={status !== 'idle'}
        >
          {hasCameraPermission
            ? status === 'idle'
              ? 'Start 15-Second Scan'
              : status === 'scanning'
              ? 'Scanning...'
              : 'Done'
            : 'Enable Camera First'}
        </Button>

        {!hasCameraPermission && (
          <Alert variant="destructive">
            <AlertTitle>Camera Permission Needed</AlertTitle>
            <AlertDescription>
              Click button to allow camera access.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
