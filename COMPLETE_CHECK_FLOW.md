# 📝 Complete Check Flow with DB Persistence

## Overview
The system now **saves EVERY step** of the shift readiness check to Firestore:
- ✅ Login (timestamp)
- ✅ Consent (agreed/not agreed)
- ✅ Vision Analysis (face scan results)
- ✅ Cognitive Test (reaction time/latency)
- ✅ Behavioral Assessment (answers to questions)
- ✅ Final Result (status, reason, detection report)

---

## 📊 Database Schema

### Check Session Collection (`check_sessions`)
Each document represents one complete check flow for a user.

```
check_sessions/
├── check_abc123def456/
│   ├── check_id: "check_abc123def456"
│   ├── user_id: "testuser1"
│   ├── login_timestamp: "2026-02-04T10:30:00"
│   │
│   ├── consent:
│   │   ├── agreed: true
│   │   └── timestamp: "2026-02-04T10:30:05"
│   │
│   ├── vision_analysis:
│   │   ├── intoxicationDetected: false
│   │   ├── fatigueDetected: true
│   │   ├── stressDetected: false
│   │   ├── feverDetected: false
│   │   ├── eyewearDetected: false
│   │   ├── mood: "neutral"
│   │   └── timestamp: "2026-02-04T10:30:15"
│   │
│   ├── cognitive_test:
│   │   ├── latency: 250
│   │   ├── score: 85
│   │   ├── passed: true
│   │   └── timestamp: "2026-02-04T10:30:45"
│   │
│   ├── behavioral_assessment:
│   │   ├── answers:
│   │   │   └── [{question_id, question, answer}, ...]
│   │   └── timestamp: "2026-02-04T10:31:00"
│   │
│   ├── overall_status: "GREEN"
│   ├── status_reason: "All clear"
│   ├── final_result_timestamp: "2026-02-04T10:31:05"
│   │
│   ├── detection_report: {...}  # From detection service
│   │
│   ├── created_at: "2026-02-04T10:30:00"
│   ├── updated_at: "2026-02-04T10:31:05"
│   └── session_duration_seconds: 65
```

---

## 🔄 Complete User Flow with DB Saves

### Step 1: User Starts Check
```
Frontend: Click "Start Shift Readiness Check"
        ↓
Action: createCheckSession(user_id)
        ↓
Backend: POST /api/v1/check/session/create
        ├─ Generate check_id
        ├─ Save to Firestore
        └─ Return check_id
        ↓
State: checkId = "check_abc123def456"
```

### Step 2: Consent Agreement
```
Frontend: User reads consent → Click "Agree"
        ↓
Action: saveConsentToSession(check_id, true)
        ↓
Backend: PUT /api/v1/check/session/consent
        ├─ Find document by check_id
        ├─ Update: consent = {agreed: true, timestamp}
        └─ Success
        ↓
DB: check_sessions/check_abc123def456
    └─ consent.agreed = true ✅
```

### Step 3: Vision Analysis (Face Scan)
```
Frontend: Camera → Scan face → Analysis complete
        ↓
Result: intoxicationDetected, fatigueDetected, etc.
        ↓
Action: saveVisionToSession(check_id, visionData)
        ↓
Backend: PUT /api/v1/check/session/vision
        ├─ Update: vision_analysis = {...all data...}
        └─ timestamp: <now>
        ↓
DB: check_sessions/check_abc123def456
    └─ vision_analysis = {...} ✅
```

### Step 4: Cognitive Test
```
Frontend: Show visual tasks → Measure reaction time
        ↓
Result: latency = 250ms
        ↓
Action: saveCognitiveToSession(check_id, latency)
        ↓
Backend: PUT /api/v1/check/session/cognitive
        ├─ latency, score, passed
        └─ timestamp
        ↓
DB: check_sessions/check_abc123def456
    └─ cognitive_test = {latency, score, passed} ✅
```

### Step 5: Behavioral Assessment
```
Frontend: Show questions → Collect answers
        ↓
Answers: {q1: "answer1", q2: "answer2", ...}
        ↓
Action: saveBehavioralToSession(check_id, answers)
        ↓
Backend: PUT /api/v1/check/session/behavioral
        ├─ Array of {question_id, question, answer}
        └─ timestamp
        ↓
DB: check_sessions/check_abc123def456
    └─ behavioral_assessment = {answers, timestamp} ✅
```

### Step 6: Final Result & Detection
```
Frontend: All steps complete → Submit
        ↓
Backend: evaluateGatekeeperStatus()
        ├─ Determine: status = GREEN|YELLOW|RED
        ├─ Generate: reason = "All clear" | "Warning" | "Critical"
        ├─ Create detection_report (if applicable)
        └─ Call: saveCheckResult()
        ↓
Action: saveCheckResult(check_id, status, reason, detection_report)
        ↓
Backend: PUT /api/v1/check/session/result
        ├─ overall_status: "GREEN"
        ├─ status_reason: "All clear"
        ├─ final_result_timestamp: <now>
        ├─ detection_report: {...}
        ├─ session_duration_seconds: 65
        └─ updated_at: <now>
        ↓
DB: check_sessions/check_abc123def456
    ├─ overall_status = "GREEN" ✅
    ├─ status_reason = "All clear" ✅
    ├─ detection_report = {...} ✅
    └─ session_duration_seconds = 65 ✅
```

---

## 🔌 Backend Endpoints

### Create Session
```
POST /api/v1/check/session/create
{
  "user_id": "testuser1"
}

Response:
{
  "success": true,
  "check_id": "check_abc123def456",
  "message": "Check session created"
}
```

### Save Consent
```
PUT /api/v1/check/session/consent
{
  "check_id": "check_abc123def456",
  "agreed": true
}
```

### Save Vision
```
PUT /api/v1/check/session/vision
{
  "check_id": "check_abc123def456",
  "vision_data": {
    "intoxicationDetected": false,
    "fatigueDetected": true,
    "stressDetected": false,
    "feverDetected": false,
    "mood": "neutral"
  }
}
```

### Save Cognitive
```
PUT /api/v1/check/session/cognitive
{
  "check_id": "check_abc123def456",
  "latency": 250,
  "score": 85,
  "passed": true
}
```

### Save Behavioral
```
PUT /api/v1/check/session/behavioral
{
  "check_id": "check_abc123def456",
  "answers": [
    {
      "question_id": "q1",
      "question": "Are you feeling alert?",
      "answer": "Yes"
    }
  ]
}
```

### Save Result
```
PUT /api/v1/check/session/result
{
  "check_id": "check_abc123def456",
  "overall_status": "GREEN",
  "status_reason": "All clear to proceed",
  "detection_report": {
    "check_id": "check_abc123def456",
    "overall_status": "green",
    "recommendations": [...]
  }
}
```

### Retrieve Session
```
GET /api/v1/check/session/{check_id}

Response:
{
  "success": true,
  "check_id": "check_abc123def456",
  "session": {...all data...}
}
```

### Get User Sessions
```
GET /api/v1/check/user/{user_id}/sessions

Response:
{
  "success": true,
  "user_id": "testuser1",
  "total": 5,
  "sessions": [...]
}
```

### Get Latest Session
```
GET /api/v1/check/user/{user_id}/latest

Response:
{
  "success": true,
  "user_id": "testuser1",
  "session": {...}
}
```

---

## 🚀 Frontend Server Actions

All actions automatically handle network errors and return `{success, error}`:

```typescript
// 1. Create session on page load
const result = await createCheckSession(userId);
// Returns: {success, checkId}

// 2. Save consent when agreed
await saveConsentToSession(checkId, true);

// 3. Save vision results
await saveVisionToSession(checkId, visionData);

// 4. Save cognitive results
await saveCognitiveToSession(checkId, latency);

// 5. Save behavioral answers
await saveBehavioralToSession(checkId, answers);

// 6. Save final result
await saveCheckResult(checkId, status, reason, detectionReport);
```

---

## 📱 Flow Integration in Check Page

### In `check/page.tsx`:
```typescript
// On mount: Create check session
useEffect(() => {
  if (user?.id) {
    createCheckSession(user.id).then((result) => {
      if (result.success) {
        setCheckId(result.checkId);
      }
    });
  }
}, [user?.id]);

// On consent
const handleConsent = async () => {
  if (checkId) {
    await saveConsentToSession(checkId, true);
  }
  setCurrentStep('vision');
};

// On vision complete
const handleVisionCapture = async (photoDataUri) => {
  const result = await getVisionAnalysis(photoDataUri);
  
  // Save to DB
  if (checkId) {
    await saveVisionToSession(checkId, result);
  }
};

// On cognitive complete
const handleCognitiveComplete = (latency) => {
  if (checkId) {
    await saveCognitiveToSession(checkId, latency);
  }
};

// On submit
const handleSubmit = async () => {
  // Save behavioral
  if (checkId) {
    await saveBehavioralToSession(checkId, answers);
  }
  
  // Evaluate and save final result
  await evaluateGatekeeperStatus(finalCheckData, user?.id, checkId);
};
```

---

## 🔍 Query Examples

### Get All Checks for a User
```typescript
const sessions = await fetch(
  `/api/v1/check/user/testuser1/sessions`
).then(r => r.json());

console.log(`User has ${sessions.total} check sessions`);
```

### Get Latest Check Status
```typescript
const latest = await fetch(
  `/api/v1/check/user/testuser1/latest`
).then(r => r.json());

console.log(`Latest status: ${latest.session.overall_status}`);
console.log(`Duration: ${latest.session.session_duration_seconds}s`);
```

### View Complete Check History
```typescript
// In admin dashboard
const sessions = await fetch(`/api/v1/check/user/${userId}/sessions`)
  .then(r => r.json());

sessions.sessions.forEach(session => {
  console.log(`
    Check ID: ${session.check_id}
    Status: ${session.overall_status}
    Duration: ${session.session_duration_seconds}s
    Vision: ${session.vision_analysis?.fatigueDetected ? 'Fatigue' : 'OK'}
    Cognitive: ${session.cognitive_test?.latency}ms
  `);
});
```

---

## ✅ Verification Checklist

After complete flow:

- [ ] Check session created in Firestore
- [ ] Consent saved with timestamp
- [ ] Vision analysis data in DB
- [ ] Cognitive test results saved
- [ ] Behavioral answers recorded
- [ ] Final status saved
- [ ] Detection report included
- [ ] Session duration calculated
- [ ] All timestamps present
- [ ] Can retrieve session by check_id
- [ ] Can list all user sessions
- [ ] Can get latest session for user

---

## 🎯 Benefits

1. **Complete Audit Trail** - Every step timestamped and saved
2. **User History** - Check previous check attempts and trends
3. **Admin Reporting** - Query all checks by user, date, status
4. **Quality Assurance** - Review complete flow for any user
5. **Compliance** - Full documentation of check process
6. **Debugging** - Trace issues through complete session data

---

## 📋 Data Fields per Step

### Login
- timestamp: ISO string

### Consent  
- agreed: boolean
- timestamp: ISO string

### Vision
- intoxicationDetected, fatigueDetected, stressDetected, feverDetected: boolean
- mood: string
- eyewearDetected: boolean
- blinkInstructionFollowed: boolean
- eyeScleraRednessScore, pupilReactivityScore: number
- timestamp: ISO string

### Cognitive
- latency: milliseconds
- score: percentage
- passed: boolean
- timestamp: ISO string

### Behavioral
- answers: array of {question_id, question, answer}
- timestamp: ISO string

### Result
- overall_status: "GREEN" | "YELLOW" | "RED"
- status_reason: string
- detection_report: object
- session_duration_seconds: number
- created_at, updated_at: ISO strings
