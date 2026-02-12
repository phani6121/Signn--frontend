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

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

type CameraCaptureProps = {
  onCapture: (photoDataUri: string) => void;
  userId?: string;
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
export function CameraCapture({ onCapture, userId }: CameraCaptureProps) {
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
  const detectRafRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  const lastDetectTsMsRef = useRef<number>(-1);
  const detectErrorStreakRef = useRef<number>(0);
  const isScanningRef = useRef<boolean>(false);
  const scanIdRef = useRef<string | null>(null);
  const shiftIdRef = useRef<string | null>(null);

  // ✅ MediaPipe refs
  const landmarkerRef = useRef<any>(null);
  const metricsStateRef = useRef(createInitialMetricsState());

  const { toast } = useToast();

  const ensureScanSession = async () => {
    if (!userId) {
      toast({
        variant: 'destructive',
        title: 'Session Error',
        description: 'Missing user ID for scan session.',
      });
      return null;
    }

    if (!shiftIdRef.current) {
      const shiftRes = await fetch(`${API_BASE_URL}/api/v1/shift/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });

      if (!shiftRes.ok) {
        toast({
          variant: 'destructive',
          title: 'Shift Error',
          description: 'Unable to start shift for scan.',
        });
        return null;
      }

      const shiftData = await shiftRes.json();
      shiftIdRef.current = shiftData.shift_id;
    }

    const scanRes = await fetch(`${API_BASE_URL}/api/v1/scan/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shift_id: shiftIdRef.current }),
    });

    if (!scanRes.ok) {
      toast({
        variant: 'destructive',
        title: 'Scan Error',
        description: 'Unable to start scan session.',
      });
      return null;
    }

    const scanData = await scanRes.json();
    scanIdRef.current = scanData.scan_id;
    return scanIdRef.current;
  };

  const finalizeScan = async () => {
    if (!scanIdRef.current) return;
    await fetch(`${API_BASE_URL}/api/v1/scan/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scan_id: scanIdRef.current }),
    }).catch(() => {});
  };

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
      if (detectRafRef.current) {
        cancelAnimationFrame(detectRafRef.current);
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

    const scanId = await ensureScanSession();
    if (!scanId) return;

    // ✅ Init MediaPipe once per scan
    if (!landmarkerRef.current) {
      landmarkerRef.current = await initFaceLandmarker();
    }

    setStatus('scanning');
    isScanningRef.current = true;
    detectErrorStreakRef.current = 0;
    lastDetectTsMsRef.current = -1;
    setScanProgress(0);
    setHealthValue(0);
    setStressValue(0);
    setMoodValue(0);

    const scanDuration = 15;
    let secondsPassed = 0;

    // Start per-frame detection loop (separate from 1s UI interval)
    const runDetection = () => {
      if (!isScanningRef.current) return;

      const video = videoRef.current;
      const landmarker = landmarkerRef.current;

      if (video && landmarker && typeof landmarker.detectForVideo === 'function') {
        if (
          video.readyState >= 2 &&
          video.videoWidth > 0 &&
          video.videoHeight > 0 &&
          !video.paused &&
          !video.ended
        ) {
          const currentTime = video.currentTime;
          if (Number.isFinite(currentTime) && currentTime !== lastVideoTimeRef.current) {
            lastVideoTimeRef.current = currentTime;
            try {
              const frameTimeMs = Math.max(
                Math.floor(currentTime * 1000),
                lastDetectTsMsRef.current + 1
              );
              lastDetectTsMsRef.current = frameTimeMs;

              const res = landmarker.detectForVideo(video, frameTimeMs);
              detectErrorStreakRef.current = 0;

              if (res?.faceLandmarks?.length) {
                const metrics = extractMetrics(
                  res.faceLandmarks[0],
                  res.faceBlendshapes?.[0],
                  metricsStateRef.current
                );

                // 🔴 Send REAL metrics to backend
                if (scanIdRef.current) {
                  fetch(`${API_BASE_URL}/api/v1/scan/frame`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      scan_id: scanIdRef.current,
                      frame_data: metrics,
                    }),
                  }).catch(() => {});
                }
              }
            } catch (err) {
              console.error('FaceLandmarker detectForVideo error:', err);
              detectErrorStreakRef.current += 1;
              // Allow transient frame-level errors without aborting the whole scan.
              if (detectErrorStreakRef.current >= 5) {
                isScanningRef.current = false;
                if (detectRafRef.current) {
                  cancelAnimationFrame(detectRafRef.current);
                  detectRafRef.current = null;
                }
                toast({
                  variant: 'destructive',
                  title: 'Vision Error',
                  description: 'Face analysis failed. Please try again.',
                });
              }
            }
          }
        }
      }

      detectRafRef.current = requestAnimationFrame(runDetection);
    };

    if (detectRafRef.current) {
      cancelAnimationFrame(detectRafRef.current);
    }
    detectRafRef.current = requestAnimationFrame(runDetection);

    scanIntervalRef.current = window.setInterval(() => {
      secondsPassed++;

      const progress = (secondsPassed / scanDuration) * 100;
      setScanProgress(progress);

      // 🟡 UI animation remains unchanged
      setHealthValue(Math.min(100, progress * 0.8 + Math.random() * 20));
      setStressValue(Math.min(100, progress * 0.3 + Math.random() * 20));
      setMoodValue(Math.min(100, progress * 0.6 + Math.random() * 40));

      if (secondsPassed >= scanDuration) {
        clearInterval(scanIntervalRef.current!);
        scanIntervalRef.current = null;
        if (detectRafRef.current) {
          cancelAnimationFrame(detectRafRef.current);
          detectRafRef.current = null;
        }
        isScanningRef.current = false;
        finalizeScan().finally(() => {
          captureImage();
        });
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
    isScanningRef.current = false;
    scanIdRef.current = null;
    onCapture(photoDataUri);
  };

  /* ---------------- UI ---------------- */
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-center">Quick Readiness Check</CardTitle>
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
          Keep your face visible for a few seconds.
        </p>

        <Button
          onClick={handleScan}
          className="w-full"
          disabled={status !== 'idle'}
        >
          {hasCameraPermission
            ? status === 'idle'
              ? 'Start Check'
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


