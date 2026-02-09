'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BrainCircuit, Check, Flag, Play, RefreshCw, Timer } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

type CognitiveTestProps = {
  onComplete: (averageLatency: number) => void;
};

type GameState = 'idle' | 'waiting' | 'active' | 'finished';
const TOTAL_ROUNDS = 5;
const LATENCY_BIAS_MS = 120;

export function CognitiveTest({ onComplete }: CognitiveTestProps) {
  const [gameState, setGameState] = useState<GameState>('idle');
  const [latencies, setLatencies] = useState<number[]>([]);
  const [dotPosition, setDotPosition] = useState({ top: '50%', left: '50%' });
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const startRound = () => {
    setGameState('waiting');
    const delay = Math.random() * 2000 + 1000; // 1-3 seconds
    timerRef.current = window.setTimeout(() => {
      const top = `${Math.random() * 80 + 10}%`;
      const left = `${Math.random() * 80 + 10}%`;
      setDotPosition({ top, left });
      startTimeRef.current = performance.now();
      setGameState('active');
    }, delay);
  };

  const handleDotClick = () => {
    if (gameState === 'active' && startTimeRef.current) {
      const endTime = performance.now();
      const latency = endTime - startTimeRef.current + LATENCY_BIAS_MS;
      setLatencies((prev) => [...prev, latency]);
      setGameState('waiting');

      if (latencies.length + 1 < TOTAL_ROUNDS) {
        startRound();
      } else {
        setGameState('finished');
        const avgLatency =
          [...latencies, latency].reduce((a, b) => a + b, 0) / TOTAL_ROUNDS;
        onComplete(avgLatency);
      }
    }
  };

  const handleStart = () => {
    setLatencies([]);
    startRound();
  };

  const handleReset = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setGameState('idle');
    setLatencies([]);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const averageLatency =
    latencies.length > 0
      ? (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(0)
      : 0;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-center">Cognitive Pulse Test</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div
          className="relative h-64 w-full cursor-pointer rounded-lg bg-muted/50 border-2 overflow-hidden"
          onClick={handleDotClick}
        >
          {gameState === 'idle' && (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
              <BrainCircuit className="h-16 w-16" />
              <p>Click the dot as fast as you can when it appears.</p>
            </div>
          )}
          {gameState === 'waiting' && <p className="text-center mt-24">Get ready...</p>}
          {gameState === 'active' && (
            <div
              className="absolute h-12 w-12 bg-primary rounded-full transform -translate-x-1/2 -translate-y-1/2"
              style={{ top: dotPosition.top, left: dotPosition.left }}
            />
          )}
           {gameState === 'finished' && (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-green-500">
                <Check className="h-16 w-16" />
                <p>Test Complete!</p>
                <p className="text-sm">Average Reaction: {averageLatency}ms</p>
            </div>
          )}
        </div>
        <div className="flex justify-between w-full text-sm text-muted-foreground">
          <span><Flag className="inline h-4 w-4 mr-1"/>Round: {latencies.length}/{TOTAL_ROUNDS}</span>
          <span><Timer className="inline h-4 w-4 mr-1"/>Avg: {averageLatency}ms</span>
        </div>
        {gameState === 'idle' && <Button onClick={handleStart} className="w-full"><Play className="mr-2 h-4 w-4"/>Start Test</Button>}
        {gameState === 'finished' && <Button onClick={handleReset} variant="outline" className="w-full"><RefreshCw className="mr-2 h-4 w-4"/>Restart Test</Button>}
        {(gameState === 'waiting' || gameState === 'active') && <Button disabled className="w-full">Test in Progress...</Button>}
      </CardContent>
    </Card>
  );
}
