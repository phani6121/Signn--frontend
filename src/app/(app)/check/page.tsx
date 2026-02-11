'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import {
  Camera,
  BrainCircuit,
  MessageSquare,
  Loader2,
  ArrowRight,
  ShieldAlert,
  FileCheck2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { CameraCapture } from '@/components/check/camera-capture';
import { CognitiveTest } from '@/components/check/cognitive-test';
import { Progress } from '@/components/ui/progress';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui/radio-group';
import * as serverActions from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { AnalysisDetails } from '@/components/check/analysis-details';
import type { AnalyzeRiderFaceForImpairmentOutput } from '@/ai/flows';
import type { RiderStatus } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { useTranslations } from 'next-intl';
import { behavioralQuestions, type BehavioralQuestion } from '@/lib/behavioral-questions';


type Step = 'consent' | 'vision' | 'vision-result' | 'cognitive' | 'behavioral' | 'submitting';

const STEPS: { id: Exclude<Step, 'vision-result' | 'submitting'>; title: string; icon: React.ReactNode }[] = [
  { id: 'consent', title: 'Privacy Consent', icon: <FileCheck2 /> },
  { id: 'vision', title: 'Vision Analysis', icon: <Camera /> },
  { id: 'cognitive', title: 'Cognitive Test', icon: <BrainCircuit /> },
  {
    id: 'behavioral',
    title: 'Behavioral Check',
    icon: <MessageSquare />,
  },
];

export default function ShiftCheckPage() {
  const searchParams = useSearchParams();
  const shiftParam = searchParams.get('shift');
  const shiftType = shiftParam === 'logout' ? 'logout' : 'login';
  const [currentStep, setCurrentStep] = useState<Step>('consent');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkData, setCheckData] = useState<{
    impairmentResult?: AnalyzeRiderFaceForImpairmentOutput | null;
    latency?: number;
    cognitiveRoundLatencies?: number[];
  }>({});
  const [selectedQuestions, setSelectedQuestions] = useState<BehavioralQuestion[]>([]);
  const [behavioralAnswers, setBehavioralAnswers] = useState<Record<string, string>>({});
  const [visionAnalysisResult, setVisionAnalysisResult] = useState<AnalyzeRiderFaceForImpairmentOutput | null>(null);
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);
  const [preliminaryStatus, setPreliminaryStatus] = useState<RiderStatus>('GREEN');
  const [preliminaryReason, setPreliminaryReason] = useState('');
  const [checkId, setCheckId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const t = useTranslations();
  const shiftTypeForSession = user?.user_type === 'employee' ? shiftType : undefined;
  const storageKey = user?.id ? `checkSession:${user.id}` : null;

  const ensureCheckSession = async () => {
    if (!user?.id) return null;
    if (!checkId && storageKey) {
      const stored = sessionStorage.getItem(storageKey);
      if (stored) {
        setCheckId(stored);
        return stored;
      }
    }
    if (checkId) return checkId;
    const result = await serverActions.createCheckSession(user.id, shiftTypeForSession);
    if (result.success && result.checkId) {
      setCheckId(result.checkId);
      if (storageKey) {
        sessionStorage.setItem(storageKey, result.checkId);
      }
      return result.checkId;
    }
    return null;
  };

  useEffect(() => {
    if (!storageKey) return;
    const stored = sessionStorage.getItem(storageKey);
    if (stored && !checkId) {
      setCheckId(stored);
    }
  }, [storageKey, checkId]);

  useEffect(() => {
    if (currentStep === 'behavioral' && selectedQuestions.length === 0) {
      const shuffled = [...behavioralQuestions].sort(() => 0.5 - Math.random());
      setSelectedQuestions(shuffled.slice(0, 5)); // Select 5 random questions
      setBehavioralAnswers({}); // Reset answers when step loads
    }
  }, [currentStep, selectedQuestions.length]);

  let currentStepIndex = STEPS.findIndex(step => step.id === currentStep);
  if (currentStep === 'vision-result') {
    // Treat vision-result as being at the second step for progress and navigation logic
    currentStepIndex = 1;
  }
  
  const progress = isSubmitting ? 100 : ((currentStepIndex + 1) / (STEPS.length + 1)) * 100;
  
  const goToNextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex].id);
    }
  };
  
  const handleBehavioralChange = (questionId: string, value: string) => {
    setBehavioralAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleVisionCapture = async (photoDataUri: string) => {
    setCapturedPhotoUri(photoDataUri);
    setCurrentStep('vision-result');
    setIsSubmitting(true); // Show loader while analyzing

    const result = await serverActions.getVisionAnalysis(photoDataUri);
    setIsSubmitting(false);

    if (result) {
      // Make a mutable copy to apply test overrides
      const finalResult = { ...result };

      // FOR TESTING: Special rule for rider-789 to always pass this step
      if (user?.id === 'rider-789') {
        finalResult.fatigueDetected = false;
        finalResult.intoxicationDetected = false;
        finalResult.stressDetected = false;
        finalResult.feverDetected = false;
        finalResult.eyewearDetected = false;
      }
      
      setVisionAnalysisResult(finalResult);
      setCheckData((prev) => ({ ...prev, impairmentResult: finalResult }));

      // Determine preliminary status based on the (potentially overridden) result
      if (finalResult.eyewearDetected) {
        setPreliminaryStatus('RED');
        setPreliminaryReason('Please remove eyewear and rescan');
      } else if (finalResult.feverDetected) {
        setPreliminaryStatus('RED');
        setPreliminaryReason('Fever Detected');
      } else if (finalResult.intoxicationDetected || finalResult.fatigueDetected) {
        setPreliminaryStatus('RED');
        setPreliminaryReason(finalResult.intoxicationDetected ? 'Intoxication Detected' : 'Fatigue Detected');
      } else {
        setPreliminaryStatus('GREEN');
        setPreliminaryReason('');
      }
    } else {
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: 'Could not analyze the image. Please try again.',
      });
      setCurrentStep('vision'); // Go back to vision step
    }
  };

  const handleCognitiveComplete = (latency: number, roundLatencies: number[]) => {
    setCheckData((prev) => ({ ...prev, latency, cognitiveRoundLatencies: roundLatencies }));

    setTimeout(goToNextStep, 500);
  };
  
  const handleConsent = async () => {
    // Do not create a check session at consent time.
    // Session is created after face scan starts/completes.
    setCurrentStep('vision');
  }

  const handleSubmit = async () => {
    if (!checkData.impairmentResult) {
        toast({
          variant: 'destructive',
          title: 'Incomplete Check',
          description: 'Please complete the vision analysis step.',
        });
        return;
    }

    // For incomplete checks (RED from vision), some data will be missing.
    const finalCheckData: serverActions.CheckData = {
        impairmentResult: checkData.impairmentResult,
        latency: checkData.latency,
        cognitiveRoundLatencies: checkData.cognitiveRoundLatencies,
        behavioralAnswers: (Object.keys(behavioralAnswers).length > 0) ? behavioralAnswers : undefined,
    };

    const sessionId = await ensureCheckSession();
    if (!sessionId) {
      toast({
        variant: 'destructive',
        title: 'Session Error',
        description: 'Unable to save check. Please try again.',
      });
      return;
    }

    // Persist all completed steps only at final submit to avoid storing abandoned/incomplete checks.
    await serverActions.saveConsentToSession(sessionId, true);
    await serverActions.saveVisionToSession(sessionId, checkData.impairmentResult);
    if (typeof checkData.latency === 'number' && Number.isFinite(checkData.latency)) {
      await serverActions.saveCognitiveToSession(sessionId, checkData.latency, checkData.cognitiveRoundLatencies);
    }
    if (Object.keys(behavioralAnswers).length > 0) {
      const answers = Object.entries(behavioralAnswers).map(([questionId, answer]) => ({
        question_id: questionId,
        question: '',
        answer: answer as string,
      }));
      await serverActions.saveBehavioralToSession(sessionId, answers);
    }

    setIsSubmitting(true);
    setCurrentStep('submitting');
    
    // Pass checkId to evaluation so it can be saved in final result
    if (storageKey) {
      sessionStorage.removeItem(storageKey);
    }
    await serverActions.evaluateGatekeeperStatus(finalCheckData, user?.id, sessionId || undefined);
  };

  const getStepTitle = () => {
    if (currentStep === 'vision-result') return 'Vision Analysis Result';
    if (currentStep === 'submitting') return 'Evaluating...';
    if(currentStepIndex > -1) return STEPS[currentStepIndex].title;
    return 'Shift Readiness Check';
  }


  return (
    <div className="flex flex-col items-center gap-8">
      <div className="w-full max-w-md text-center">
        <h1 className="text-3xl font-bold">Shift Readiness Check</h1>
        <p className="text-muted-foreground">
          Complete the following steps to start your shift.
        </p>
        <Progress value={progress} className="mt-4" />
        <p className="text-sm mt-2 text-muted-foreground">{getStepTitle()}</p>
      </div>

      {currentStep === 'submitting' || (isSubmitting && currentStep !== 'vision-result') ? (
         <div className="flex flex-col items-center justify-center gap-4 p-8">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg font-semibold">Evaluating your results...</p>
          <p className="text-muted-foreground">This may take a moment.</p>
        </div>
      ) : (
        <>
          {currentStep === 'consent' && (
            <Card className="w-full max-w-lg">
                <CardHeader>
                    <CardTitle>{t('consent_title')}</CardTitle>
                    <CardDescription>{t('consent_intro')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <div className="space-y-1">
                        <h3 className="font-semibold">{t('consent_what_we_measure_title')}</h3>
                        <p className="text-muted-foreground">{t('consent_what_we_measure_list')}</p>
                    </div>
                     <div className="space-y-1">
                        <h3 className="font-semibold">{t('consent_purpose_title')}</h3>
                        <p className="text-muted-foreground">{t('consent_purpose_text')}</p>
                    </div>
                     <div className="space-y-1">
                        <h3 className="font-semibold">{t('consent_erasure_title')}</h3>
                        <p className="text-muted-foreground">{t('consent_erasure_text')}</p>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleConsent} className="w-full">
                        {t('consent_agree_button')}
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </CardFooter>
            </Card>
          )}

          {currentStep === 'vision' && (
            <CameraCapture onCapture={handleVisionCapture} userId={user?.id} />
          )}

          {currentStep === 'vision-result' && (
            <div className="w-full max-w-md flex flex-col gap-4">
              {!visionAnalysisResult ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Loader2 className="animate-spin" /> Analyzing Scan...
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center gap-4">
                    {capturedPhotoUri && (
                      <Image
                        src={capturedPhotoUri}
                        width={400}
                        height={300}
                        alt="Scan result"
                        className="rounded-lg object-cover"
                      />
                    )}
                    <p className="text-muted-foreground text-center">
                      Please wait a moment while we analyze your facial signals for impairment.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <AnalysisDetails impairmentResult={visionAnalysisResult} />
                  {preliminaryStatus === 'RED' ? (
                    <Card className="bg-destructive/10 border-destructive">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive">
                          <ShieldAlert />
                          Action Required
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-destructive mb-4">{`A critical issue was detected: ${preliminaryReason}. You cannot proceed with the check.`}</p>
                        <Button
                          onClick={handleSubmit}
                          className="w-full"
                          variant="destructive"
                        >
                          See Full Result
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <Button onClick={goToNextStep} className="w-full">
                      Continue to Cognitive Test
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </>
              )}
            </div>
          )}

          {currentStep === 'cognitive' && (
            <CognitiveTest onComplete={handleCognitiveComplete} />
          )}

          {currentStep === 'behavioral' && (
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Behavioral Check</CardTitle>
                <CardDescription>
                  Answer these quick questions based on your training.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6">
                {selectedQuestions.map((q, index) => (
                  <div key={q.id} className="grid gap-2">
                    <Label>
                      {index + 1}. {t(q.questionKey as any)}
                    </Label>
                    <RadioGroup value={behavioralAnswers[q.id] || ''} onValueChange={(value) => handleBehavioralChange(q.id, value)}>
                      {q.options.map(opt => (
                        <div key={opt.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={opt.value} id={`${q.id}-${opt.value}`} />
                          <Label htmlFor={`${q.id}-${opt.value}`}>{t(opt.key as any)}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                ))}
              </CardContent>
              <CardFooter>
                 <Button onClick={handleSubmit} className="w-full" disabled={Object.keys(behavioralAnswers).length < selectedQuestions.length}>
                    Finish & Evaluate
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
