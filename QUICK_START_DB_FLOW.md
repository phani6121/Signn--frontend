# ⚡ Quick Start - Test Complete Flow with DB Persistence

## 5-Minute Setup

### 1. Start Backend
```powershell
cd C:\Users\USER\Desktop\Signn-Gatekeeper-main\backend
Push-Location .
& 'C:\Users\USER\AppData\Local\Programs\Python\Python39\python.exe' -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Should see:
```
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### 2. Start Frontend (New Terminal)
```bash
cd C:\Users\USER\Desktop\Signn-Gatekeeper-main
npm run dev
```

Should see:
```
   ▲ Next.js 15.x.x
   - Local:        http://localhost:3000
```

### 3. Open Browser
```
http://localhost:3000
```

---

## Complete Test Flow

### Step 1: Login
```
URL: http://localhost:3000/login
Username: testuser1
Password: 123456
Click: Login
```
✅ **Save to DB**: Creates login_timestamp in check_sessions

### Step 2: Start Check
```
Click: "Start Shift Readiness Check"
```
✅ **Save to DB**: Creates check_sessions document with check_id

### Step 3: Consent
```
Read: Privacy Consent
Click: "I Agree"
```
✅ **Save to DB**: Saves consent.agreed = true

### Step 4: Vision (Face Scan)
```
Click: "Scan Now"
Wait: 2-3 seconds for AI analysis
```
✅ **Save to DB**: Saves intoxicationDetected, fatigueDetected, etc.

### Step 5: Cognitive Test
```
Follow: On-screen visual tasks
Measure: Your reaction time (click as fast as possible)
```
✅ **Save to DB**: Saves latency in milliseconds

### Step 6: Behavioral Assessment
```
Answer: 5 random behavioral questions
Select: Your answer for each
```
✅ **Save to DB**: Saves all answers with question IDs

### Step 7: Final Result
```
View: Color-coded status (Green/Orange/Red)
See: Impairment detections
Read: Recommendations
```
✅ **Save to DB**: Saves overall_status, detection_report, session_duration

---

## Verify Data in Firestore

### Method 1: Firebase Console
1. Go to: https://console.firebase.google.com
2. Select: signn-gatekeeper-d531e
3. Click: Firestore Database
4. Look for: `check_sessions` collection
5. Open: Latest document
6. Verify: All fields populated ✅

### Method 2: Query API
```bash
# Get latest session for testuser1
curl -X GET "http://localhost:8000/api/v1/check/user/testuser1/latest"
```

Response:
```json
{
  "success": true,
  "user_id": "testuser1",
  "session": {
    "check_id": "check_abc123",
    "overall_status": "GREEN",
    "consent": {"agreed": true, "timestamp": "..."},
    "vision_analysis": {...},
    "cognitive_test": {...},
    "behavioral_assessment": {...},
    "session_duration_seconds": 120
  }
}
```

---

## What Gets Saved

| Step | Data | DB Location |
|------|------|-------------|
| Login | timestamp | check_sessions.login_timestamp |
| Consent | agreed, timestamp | check_sessions.consent |
| Vision | All detections, mood | check_sessions.vision_analysis |
| Cognitive | latency, score, passed | check_sessions.cognitive_test |
| Behavioral | answers array | check_sessions.behavioral_assessment |
| Result | status, reason, detection | check_sessions.overall_status |

---

## Check Session Structure

```
check_sessions/
  ├─ check_abc123def456/
  │  ├─ check_id: "check_abc123def456"
  │  ├─ user_id: "testuser1"
  │  ├─ login_timestamp: "2026-02-04T10:30:00"
  │  ├─ consent: {agreed: true, timestamp: "..."}
  │  ├─ vision_analysis: {intoxication, fatigue, stress, fever, mood, ...}
  │  ├─ cognitive_test: {latency: 250, score: 85, passed: true}
  │  ├─ behavioral_assessment: {answers: [...]}
  │  ├─ overall_status: "GREEN"
  │  ├─ status_reason: "All clear"
  │  ├─ detection_report: {...}
  │  ├─ session_duration_seconds: 65
  │  ├─ created_at: "2026-02-04T10:30:00"
  │  └─ updated_at: "2026-02-04T10:31:05"
```

---

## Test Scenarios

### Scenario A: All Clear (Green)
1. Login as: testuser1
2. Scan face: No impairments detected
3. Cognitive: 250ms (good reaction time)
4. Behavioral: Answer correctly
5. Result: **GREEN - All Clear** ✅

### Scenario B: Fatigue Detected (Orange/Red)
1. Scan face: Fatigue detected
2. Result: **RED - Fatigue Detected** ✅

### Scenario C: Slow Reaction (Yellow/Red)  
1. Cognitive test: 450ms (slow)
2. Result: **YELLOW/RED - Cognitive Delay** ✅

---

## Troubleshooting

### Backend not starting?
```powershell
# Kill existing processes
Get-Process python | Stop-Process -Force

# Restart
Push-Location 'C:\Users\USER\Desktop\Signn-Gatekeeper-main\backend'
& 'C:\Users\USER\AppData\Local\Programs\Python\Python39\python.exe' -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Data not saving to Firestore?
1. Check backend logs for errors
2. Verify Firebase credentials
3. Ensure check_sessions collection exists (auto-created on first write)
4. Check browser console (F12) for network errors

### Can't retrieve sessions?
```bash
# Test API directly
curl "http://localhost:8000/api/v1/check/user/testuser1/sessions"
```

Should return session list or empty array if none exist.

---

## Key Files Modified

- ✅ `backend/app/schemas/check.py` - Check session models
- ✅ `backend/app/services/checksessionservice.py` - Session management
- ✅ `backend/app/api/v1/check.py` - API endpoints
- ✅ `src/app/actions.ts` - Frontend server actions
- ✅ `src/app/(app)/check/page.tsx` - Integration in check flow

---

## Next Steps

After completing the flow:

1. ✅ Check Firestore for data
2. ✅ Query API to retrieve sessions
3. ✅ Build admin dashboard to view user history
4. ✅ Generate reports from session data
5. ✅ Setup automated cleanup (optional)

---

## Commands Cheat Sheet

```bash
# Check backend is running
curl http://localhost:8000/api/v1/firebase/health -X POST

# Get user's latest session
curl "http://localhost:8000/api/v1/check/user/testuser1/latest"

# Get all sessions for user
curl "http://localhost:8000/api/v1/check/user/testuser1/sessions"

# Get specific session
curl "http://localhost:8000/api/v1/check/session/check_abc123def456"

# Test detection endpoint
curl -X POST "http://localhost:8000/api/v1/detection/save" \
  -H "Content-Type: application/json" \
  -d '{"user_id":"testuser1",...}'
```

---

## Success Criteria

✅ Can login with testuser1
✅ Check session created
✅ Consent saved to DB
✅ Vision results saved
✅ Cognitive results saved
✅ Behavioral answers saved
✅ Final result saved
✅ Can retrieve session by ID
✅ Can list all user sessions
✅ Color-coded result displays correctly

**When all ✅ are green, system is working perfectly!**
