// src/lib/vision/metrics.ts

export type FaceMetrics = {
  eye_aspect_ratio: number;
  eye_blink_rate: number;
  blink_variance: number;
  brow_furrow: number;
  lip_tighten: number;
  mouth_open: number;
  head_stability: number;
  head_tilt_variance: number;
  face_visibility: number;
  timestamp_ms: number;
};

export type MetricsState = {
  blinkHistory: number[];
  tiltHistory: number[];
  openDurations: number[];
  lastNose: { x: number; y: number } | null;
  headStability: number;
  lastFrameTs: number | null;
  openStartTs: number | null;
  lastBlinkState: boolean;
};
const BLINK_HISTORY = 30;
const TILT_HISTORY = 30;
const OPEN_HISTORY = 10;
function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function distance(a: any, b: any) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function variance(values: number[]) {
  if (!values.length) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  return values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
}

function getBlendshapeScore(blendshapes: any, name: string): number | null {
  if (!blendshapes?.categories?.length) return null;
  const match = blendshapes.categories.find(
    (c: any) => c.categoryName === name
  );
  return match ? match.score : null;
}
export function createInitialMetricsState(): MetricsState {
  return {
    blinkHistory: [],
    tiltHistory: [],
    openDurations: [],
    lastNose: null,
    headStability: 1,
    lastFrameTs: null,
    openStartTs: null,
    lastBlinkState: false,
  };
}
export function extractMetrics(
  faceLandmarks: any[],
  blendshapes: any,
  state: MetricsState
): FaceMetrics {
  const nowTs = performance.now();

  // -----------------------------
  // Eye Aspect Ratio (EAR)
  // -----------------------------
  const leftEyeOpen =
    distance(faceLandmarks[159], faceLandmarks[145]) /
    distance(faceLandmarks[33], faceLandmarks[133]);

  const rightEyeOpen =
    distance(faceLandmarks[386], faceLandmarks[374]) /
    distance(faceLandmarks[263], faceLandmarks[362]);

  const eyeOpen = (leftEyeOpen + rightEyeOpen) / 2;

  // -----------------------------
  // Blink detection
  // -----------------------------
  const blinkLeft = getBlendshapeScore(blendshapes, "eyeBlinkLeft");
  const blinkRight = getBlendshapeScore(blendshapes, "eyeBlinkRight");

  let isBlink = false;
  if (blinkLeft !== null && blinkRight !== null) {
    isBlink = (blinkLeft + blinkRight) / 2 > 0.6;
  } else {
    isBlink = eyeOpen < 0.18;
  }

  state.blinkHistory.push(isBlink ? 1 : 0);
  if (state.blinkHistory.length > BLINK_HISTORY) {
    state.blinkHistory.shift();
  }

  const eye_blink_rate =
    state.blinkHistory.reduce((s, v) => s + v, 0) /
    state.blinkHistory.length;

  const blink_variance = variance(state.blinkHistory);

  // -----------------------------
  // Avg eye open duration
  // -----------------------------
  if (!isBlink) {
    if (state.openStartTs === null) {
      state.openStartTs = nowTs;
    }
  } else if (state.openStartTs !== null && !state.lastBlinkState) {
    const durationSec = (nowTs - state.openStartTs) / 1000;
    state.openDurations.push(durationSec);
    if (state.openDurations.length > OPEN_HISTORY) {
      state.openDurations.shift();
    }
    state.openStartTs = null;
  }
  state.lastBlinkState = isBlink;

  // -----------------------------
  // Brow furrow
  // -----------------------------
  const browDownLeft = getBlendshapeScore(blendshapes, "browDownLeft");
  const browDownRight = getBlendshapeScore(blendshapes, "browDownRight");
  const brow_furrow =
    browDownLeft !== null && browDownRight !== null
      ? (browDownLeft + browDownRight) / 2
      : 0;

  // -----------------------------
  // Lip tighten
  // -----------------------------
  const mouthPressLeft = getBlendshapeScore(blendshapes, "mouthPressLeft");
  const mouthPressRight = getBlendshapeScore(blendshapes, "mouthPressRight");
  const lip_tighten =
    mouthPressLeft !== null && mouthPressRight !== null
      ? (mouthPressLeft + mouthPressRight) / 2
      : 0;

  // -----------------------------
  // Mouth open
  // -----------------------------
  const jawOpen = getBlendshapeScore(blendshapes, "jawOpen");
  const mouth_open = jawOpen ?? 0;

  // -----------------------------
  // Head stability (nose movement)
  // -----------------------------
  const nose = faceLandmarks[1];
  if (state.lastNose) {
    const delta = Math.hypot(
      nose.x - state.lastNose.x,
      nose.y - state.lastNose.y
    );
    const stability = 1 - clamp(delta * 5, 0, 1);
    state.headStability = state.headStability * 0.7 + stability * 0.3;
  }
  state.lastNose = { x: nose.x, y: nose.y };

  // -----------------------------
  // Head tilt variance
  // -----------------------------
  const leftEye = faceLandmarks[33];
  const rightEye = faceLandmarks[263];
  const tilt = leftEye.y - rightEye.y;

  state.tiltHistory.push(tilt);
  if (state.tiltHistory.length > TILT_HISTORY) {
    state.tiltHistory.shift();
  }

  const head_tilt_variance = variance(state.tiltHistory);

  // -----------------------------
  // Final metrics (sent to backend)
  // -----------------------------
  return {
    eye_aspect_ratio: eyeOpen,
    eye_blink_rate,
    blink_variance,
    brow_furrow,
    lip_tighten,
    mouth_open,
    head_stability: state.headStability,
    head_tilt_variance,
    face_visibility: 1,
    timestamp_ms: Date.now(),
  };
}
