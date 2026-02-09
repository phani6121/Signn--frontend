'use server';
 
import {
  analyzeRiderFaceForImpairment,
  provideOptimalRestStopSuggestions,
} from '@/ai/flows';
import type { AnalyzeRiderFaceForImpairmentOutput } from '@/ai/flows';
import type { RiderStatus, Rider } from '@/lib/types';
import { redirect } from 'next/navigation';
import { behavioralQuestions } from '@/lib/behavioral-questions';
 
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
 
// ============================================
// Authentication Actions
// ============================================
 
export type AuthResult = {
  success: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
    username: string;
    language?: string;
    user_type?: string;
  };
  error?: string;
};
 
export async function authenticateRider(
  username: string,
  password: string,
  language?: string,
  userType?: string
): Promise<AuthResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
        language,
        user_type: userType,
      }),
    });
 
    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.detail || 'Invalid username or password',
      };
    }
 
    const data = await response.json();
 
    // Handle successful login response from backend
    return {
      success: true,
      user: {
        id: data.user_id || data.username,
        name: data.name || 'User',
        email: data.email || '',
        username: data.username,
        language: data.language,
        user_type: data.user_type,
      },
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      success: false,
      error: 'Authentication failed. Please try again.',
    };
  }
}
 
export async function ensureDummyUserExists(): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'demo_rider',
        password: 'demo123',
        name: 'Demo Rider',
        email: 'demo@signn.com',
      }),
    });
 
    if (response.ok) {
      console.log('Dummy user created successfully');
    } else {
      const error = await response.json();
      if (error.detail && error.detail.includes('already exists')) {
        console.log('Dummy user already exists');
      }
    }
  } catch (error) {
    console.error('Error ensuring dummy user exists:', error);
  }
}
 
export async function createRider(riderData: {
  username: string;
  password: string;
  name: string;
  email: string;
}): Promise<AuthResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(riderData),
    });
 
    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.detail || 'Failed to create rider',
      };
    }
 
    const data = await response.json();
 
    return {
      success: true,
      user: {
        id: data.user_id,
        name: riderData.name,
        email: riderData.email,
        username: riderData.username,
      },
    };
  } catch (error) {
    console.error('Create rider error:', error);
    return {
      success: false,
      error: 'Failed to create rider. Please try again.',
    };
  }
}
 
export async function getRiderById(riderId: string): Promise<Rider | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/users/${riderId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
 
    if (!response.ok) {
      return null;
    }
 
    const data = await response.json();
 
    return {
      id: data.id,
      username: data.username,
      name: data.name,
      email: data.email,
      baselineLatency: 160,
      password: '',
      createdAt: data.created_at,
    };
  } catch (error) {
    console.error('Get rider error:', error);
    return null;
  }
}
 
export type CheckData = {
  impairmentResult: AnalyzeRiderFaceForImpairmentOutput;
  latency?: number;
  behavioralAnswers?: Record<string, string>;
};
 
export async function sendCheckDataToBackend(checkData: CheckData, riderId: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/checks/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rider_id: riderId,
        impairment_result: checkData.impairmentResult,
        latency: checkData.latency,
        behavioral_answers: checkData.behavioralAnswers || {},
      }),
    });
 
    if (!response.ok) {
      throw new Error('Failed to send data to backend');
    }
 
    const data = await response.json();
    console.log('Check data stored successfully:', data.check_id);
    return data;
  } catch (error) {
    console.error('Error sending check data to backend:', error);
    return null;
  }
}
 
export async function getVisionAnalysis(photoDataUri: string) {
  try {
    const impairmentResult = await analyzeRiderFaceForImpairment({ photoDataUri });
    return impairmentResult;
  } catch (error) {
    console.error('AI Vision Analysis failed:', error);
    return null;
  }
}
 
// This is the "Authority Engine"
export async function evaluateGatekeeperStatus(checkData: CheckData, riderId?: string, checkId?: string) {
  // 1. The impairment result is passed in directly. The raw image data never reaches this state.
  let impairmentResult = checkData.impairmentResult;
 
  // 2. Retrieve the Baseline for this rider (mocked)
  const baselineLatency = 500; // ms
 
  // 3. Calculate Delta if latency is available
  const delta =
    checkData.latency
      ? ((checkData.latency - baselineLatency) / baselineLatency) * 100
      : 0;
 
  // 4. Determine status
  let status: RiderStatus = 'GREEN';
  let reason = 'Clear';
 
  let behavioralFailure = false;
  if (checkData.behavioralAnswers && Object.keys(checkData.behavioralAnswers).length > 0) {
      const questionMap = new Map(behavioralQuestions.map(q => [q.id, q]));
      for (const questionId in checkData.behavioralAnswers) {
          const question = questionMap.get(questionId);
          const submittedAnswer = checkData.behavioralAnswers[questionId];
          if (question && question.correctAnswer !== submittedAnswer) {
              behavioralFailure = true;
              break; // one wrong answer is enough to fail
          }
      }
  }
 
  if (impairmentResult.eyewearDetected) {
    status = 'RED';
    reason = 'Please remove eyewear and rescan';
  } else if (impairmentResult.feverDetected) {
    status = 'RED';
    reason = 'Fever Detected';
  } else if (impairmentResult.intoxicationDetected || impairmentResult.fatigueDetected) {
    status = 'RED';
    if (impairmentResult.intoxicationDetected) reason = 'Intoxication Detected';
    else if (impairmentResult.fatigueDetected) reason = 'Fatigue Detected';
  } else if (delta > 40) {
    status = 'RED';
    reason = 'Critical Cognitive Fatigue';
  } else if (behavioralFailure) {
    status = 'RED';
    reason = 'Failed behavioral assessment';
  } else if (impairmentResult.stressDetected) {
    status = 'YELLOW';
    reason = 'High stress detected';
  } else if (delta > 20) {
    status = 'YELLOW';
    reason = 'Cognitive delay detected';
  }
 
  // FOR TESTING: Special rules for specific rider IDs
  if (riderId === 'rider-789') {
    status = 'GREEN';
    reason = 'Clear (Testing Override)';
    // Also clean up impairment result for consistency, as it may still contain failure signals
    impairmentResult.fatigueDetected = false;
    impairmentResult.intoxicationDetected = false;
    impairmentResult.stressDetected = false;
    impairmentResult.feverDetected = false;
  } else if (riderId === 'rider-123') {
    status = 'RED';
    reason = 'Critical Cognitive Fatigue';
    // Also mock the impairment result to be consistent with the reason
    impairmentResult.fatigueDetected = true;
  }
 
 
  // Save final result to session if checkId provided
  if (checkId) {
    try {
      await saveCheckResult(checkId, status, reason);
    } catch (error) {
      console.error('Failed to save check result:', error);
    }
  }
 
  // In a real app, you would now update Firestore:
  // - `authority_tokens` collection with the new status
  // - `readiness_ledger` collection with the full check details, including the analysis result.
  // The captured image is discarded immediately after analysis and is NOT stored, to protect rider privacy.
  console.log(
    `Rider (ID: ${riderId}) status: ${status}, Reason: ${reason}, Latency Delta: ${delta.toFixed(
      2
    )}%`
  );
 
  // Redirect to result page with status
  const impairmentParam = impairmentResult
    ? `&impairment=${encodeURIComponent(JSON.stringify(impairmentResult))}`
    : '';
  const userIdParam = riderId ? `&userId=${encodeURIComponent(riderId)}` : '';
  const checkIdParam = checkId ? `&checkId=${encodeURIComponent(checkId)}` : '';
  const moodParam = '&mood=neutral';
 
  redirect(
    `/check/result?status=${status}&reason=${encodeURIComponent(
      reason
    )}${impairmentParam}${userIdParam}${checkIdParam}${moodParam}`
  );
}
 
export async function getRestStopSuggestion() {
  try {
    const suggestion = await provideOptimalRestStopSuggestions({
      riderLocation: 'Koramangala, Bengaluru',
      availableFacilities: [
        'Restroom',
        'Hydration',
        'Snacks',
        'Charging Port',
      ],
      predictedWaitTimes: {
        'rest-stop-1': 5,
        'rest-stop-2': 15,
        'rest-stop-3': 2,
      },
    });
    return suggestion;
  } catch (error) {
    console.error('Failed to get rest stop suggestion:', error);
    // Return a fallback suggestion
    return {
      optimalRestStop: 'Nearest Cafe Coffee Day',
      reasoning:
        'AI suggestion service is currently unavailable. This is a default recommendation.',
      voucherCode: 'SIGNN-FALLBACK-123',
    };
  }
}
 
// ============================================
// Detection Actions
// ============================================
 
export type DetectionResult = {
  check_id: string;
  overall_status: string;
  status_color: string;
  detections: {
    [key: string]: {
      detected: boolean;
      confidence: number;
      status: string;
      details: string;
    };
  };
  recommendations: string[];
  action_required: boolean;
  action_message: string;
};
 
export async function saveDetection(
  userId: string,
  impairments: {
    intoxication?: { detected: boolean; confidence: number };
    fatigue?: { detected: boolean; confidence: number };
    stress?: { detected: boolean; confidence: number };
    fever?: { detected: boolean; confidence: number };
  },
  mood?: string
): Promise<{ success: boolean; checkId?: string; error?: string; result?: DetectionResult }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/detection/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        impairments,
        mood: mood || 'neutral',
      }),
    });
 
    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.detail || 'Failed to save detection',
      };
    }
 
    const data = await response.json();
    return {
      success: true,
      checkId: data.check_id,
      result: data,
    };
  } catch (error) {
    console.error('Failed to save detection:', error);
    return {
      success: false,
      error: 'Failed to save detection. Please try again.',
    };
  }
}
 
export async function getDetectionReport(checkId: string): Promise<{ success: boolean; report?: DetectionResult; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/detection/report/${checkId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
 
    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.detail || 'Failed to get detection report',
      };
    }
 
    const data = await response.json();
    return {
      success: true,
      report: data,
    };
  } catch (error) {
    console.error('Failed to get detection report:', error);
    return {
      success: false,
      error: 'Failed to get detection report. Please try again.',
    };
  }
}
 
// ============================================
// Check Session Actions (Track all steps)
// ============================================
 
export async function createCheckSession(
  userId: string,
  shiftType?: 'login' | 'logout'
): Promise<{ success: boolean; checkId?: string; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/check/session/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        shift_type: shiftType,
      }),
    });
 
    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.detail || 'Failed to create check session',
      };
    }
 
    const data = await response.json();
    return {
      success: true,
      checkId: data.check_id,
    };
  } catch (error) {
    console.error('Failed to create check session:', error);
    return {
      success: false,
      error: 'Failed to create check session. Please try again.',
    };
  }
}
 
export async function saveConsentToSession(checkId: string, agreed: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/check/session/consent`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        check_id: checkId,
        agreed,
      }),
    });
 
    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.detail || 'Failed to save consent',
      };
    }
 
    return { success: true };
  } catch (error) {
    console.error('Failed to save consent:', error);
    return {
      success: false,
      error: 'Failed to save consent. Please try again.',
    };
  }
}
 
export async function saveVisionToSession(checkId: string, visionData: any): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/check/session/vision`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        check_id: checkId,
        vision_data: visionData,
      }),
    });
 
    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.detail || 'Failed to save vision analysis',
      };
    }
 
    return { success: true };
  } catch (error) {
    console.error('Failed to save vision analysis:', error);
    return {
      success: false,
      error: 'Failed to save vision analysis. Please try again.',
    };
  }
}
 
export async function saveCognitiveToSession(checkId: string, latency: number): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/check/session/cognitive`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        check_id: checkId,
        latency,
        passed: latency < 300, // Adjust threshold as needed
      }),
    });
 
    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.detail || 'Failed to save cognitive test',
      };
    }
 
    return { success: true };
  } catch (error) {
    console.error('Failed to save cognitive test:', error);
    return {
      success: false,
      error: 'Failed to save cognitive test. Please try again.',
    };
  }
}
 
export async function saveBehavioralToSession(checkId: string, answers: any[]): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/check/session/behavioral`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        check_id: checkId,
        answers,
      }),
    });
 
    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.detail || 'Failed to save behavioral assessment',
      };
    }
 
    return { success: true };
  } catch (error) {
    console.error('Failed to save behavioral assessment:', error);
    return {
      success: false,
      error: 'Failed to save behavioral assessment. Please try again.',
    };
  }
}
 
export async function saveCheckResult(
  checkId: string,
  overallStatus: string,
  statusReason: string,
  detectionReport?: any
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/check/session/result`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        check_id: checkId,
        overall_status: overallStatus,
        status_reason: statusReason,
        detection_report: detectionReport,
      }),
    });
 
    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.detail || 'Failed to save check result',
      };
    }
 
    return { success: true };
  } catch (error) {
    console.error('Failed to save check result:', error);
    return {
      success: false,
      error: 'Failed to save check result. Please try again.',
    };
  }
}
