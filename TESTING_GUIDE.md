# 🧪 Health Impairment Detection System - Testing Guide

## Quick Start - 5 Minute Test

### Step 1: Start the Backend
```powershell
# Open PowerShell in backend directory
cd c:\Users\USER\Desktop\Signn-Gatekeeper-main\backend

# Start server
Push-Location .
& 'C:\Users\USER\AppData\Local\Programs\Python\Python39\python.exe' -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Backend should show:
```
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Step 2: Start the Frontend
```bash
# In another terminal, in workspace root
npm run dev
```

Frontend should be available at: `http://localhost:3000`

### Step 3: Login with Test User
```
URL: http://localhost:3000/login
Username: testuser1
Password: 123456
Click Login
```

Expected: Redirected to dashboard or home page ✅

---

## Complete Test Flow

### Part 1: Setup
1. ✅ Backend running on port 8000
2. ✅ Frontend running on port 3000
3. ✅ Logged in as testuser1
4. ✅ Firestore database connected

### Part 2: Initiate Check
```
1. Click "Start Shift Readiness Check"
2. Click "Agree" on Privacy Consent
3. Grant camera permission
```

Expected: Camera feed shows, "Ready to Scan" appears

### Part 3: Vision Analysis
```
1. Click "Scan Now"
2. Wait for vision analysis to complete (2-3 seconds)
```

Expected: Result page loads with analysis data

### Part 4: Detection Report
```
On Result Page:
1. Look for DetectionReport component loading
2. Color-coded status card appears (Red/Orange/Green)
3. Impairment signals displayed with badges
4. Recommendations shown
5. Check ID visible at bottom
```

Expected: Detection data saved to Firestore ✅

---

## Verification Checklist

### Frontend Display
- [ ] Color-coded status card visible
- [ ] Status matches expected value
- [ ] Impairment badges show correct detection status
- [ ] Recommendations are displayed
- [ ] Check ID is visible
- [ ] No console errors

### Backend Operations
- [ ] POST /api/v1/detection/save succeeds
- [ ] Check ID is generated correctly
- [ ] Status determination is correct
- [ ] Recommendations are generated

### Database (Firestore)
- [ ] New document created in `checks` collection
- [ ] Document ID matches check_id
- [ ] user_id field contains "testuser1"
- [ ] overall_status is set (red/orange/green)
- [ ] All impairments recorded
- [ ] Recommendations array populated
- [ ] Timestamp set

---

## Test Scenarios

### Scenario 1: All Clear (Green)
**Setup:** Create mock detection with all signals false
```json
{
  "intoxication": {"detected": false},
  "fatigue": {"detected": false},
  "stress": {"detected": false},
  "fever": {"detected": false}
}
```
**Expected:** 
- Status Card: GREEN
- Color: #4CAF50
- Message: "All Clear"

### Scenario 2: Fatigue Detected (Orange)
**Setup:** Fatigue detected, others clear
```json
{
  "fatigue": {"detected": true, "confidence": 0.75}
}
```
**Expected:**
- Status Card: ORANGE
- Color: #FF9800
- Message: "Warning - Fatigue Detected"
- Recommendations: Rest-related

### Scenario 3: Multiple Issues (Red)
**Setup:** Intoxication + Fatigue detected
```json
{
  "intoxication": {"detected": true, "confidence": 0.9},
  "fatigue": {"detected": true, "confidence": 0.85}
}
```
**Expected:**
- Status Card: RED
- Color: #FF4444
- Message: "Action Required"
- Recommendations: Multiple (rest, hydration, etc.)

---

## Debugging Guide

### Issue: DetectionReport not showing

**Check:**
1. Console for errors: F12 → Console tab
2. Network tab: Is /api/v1/detection/save returning 200?
3. Backend logs: Any error messages?
4. Response format: Check if `result` is null

**Fix:**
```typescript
// In result page, add logging:
saveDetection(userIdParam, impairments, moodParam || 'neutral').then((result) => {
  console.log('Detection result:', result);
  if (result.success && result.result) {
    setDetectionReport(result.result);
  }
});
```

### Issue: Wrong user_id in Firestore

**Check:**
1. URL params: ?userId=testuser1 present?
2. evaluateGatekeeperStatus: Is riderId being passed?

**Fix:**
```typescript
// Ensure evaluateGatekeeperStatus called with riderId:
await serverActions.evaluateGatekeeperStatus(finalCheckData, user?.id);
```

### Issue: Status color not matching logic

**Check:**
1. Impairment confidence scores
2. Backend status determination function
3. Color mapping in DetectionReport

**Expected Mapping:**
```
red    → #FF4444 (Critical)
orange → #FF9800 (Warning)
green  → #4CAF50 (OK)
```

---

## API Testing with cURL/PowerShell

### Test Detection Save Endpoint

```powershell
$body = @{
  user_id = "testuser1"
  mood = "neutral"
  intoxication = @{detected = $false; confidence = 0.1}
  fatigue = @{detected = $true; confidence = 0.85}
  stress = @{detected = $false; confidence = 0.2}
  fever = @{detected = $false; confidence = 0.05}
} | ConvertTo-Json

$response = Invoke-WebRequest `
  -Uri "http://localhost:8000/api/v1/detection/save" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body `
  -UseBasicParsing

$response.Content | ConvertFrom-Json | Format-Output
```

### Test Report Retrieval

```powershell
# Get the check_id from save response above
$checkId = "check_abc123def456"

$response = Invoke-WebRequest `
  -Uri "http://localhost:8000/api/v1/detection/report/$checkId" `
  -Method GET `
  -UseBasicParsing

$response.Content | ConvertFrom-Json | Format-Output
```

---

## Performance Benchmarks

### Expected Response Times:
- POST /save: 500-1000ms
- GET /report: 200-500ms
- Frontend render: <300ms

### Database Operations:
- Firestore create: <500ms
- Firestore read: <200ms

---

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Port 8000 already in use | Previous server still running | Kill python process: `Get-Process python \| Stop-Process` |
| "No module named 'app'" | Wrong working directory | Use `Push-Location` before uvicorn command |
| Detection not saving | userId not passed | Check URL params in result page |
| Color not displaying | CSS not applied | Check TailwindCSS classes: `bg-red-500/10` |
| Empty recommendations | Service not returning | Check DetectionService.get_recommendations() |
| Check ID mismatch | Not extracted correctly | Log check_id from response |

---

## Firefox/Chrome DevTools Testing

### Network Tab:
1. Open DevTools (F12)
2. Network tab
3. Perform detection
4. Look for POST to `/api/v1/detection/save`
5. Verify 200 status
6. Check response payload

### Console Tab:
```javascript
// Check if DetectionReport loaded
console.log(document.querySelector('[class*="detection"]'));

// Verify color applied
console.log(window.getComputedStyle(statusCard).backgroundColor);
```

### Storage Tab (IndexedDB):
- Check if any local detection cache

---

## Firestore Verification

### In Firebase Console:
1. Go to Firestore Database
2. Click on `checks` collection
3. Verify new documents created
4. Check fields match expected schema
5. Verify user_id = testuser1
6. Check timestamp is recent

### Fields to Verify:
```
✓ check_id: "check_xxxx"
✓ user_id: "testuser1"  
✓ timestamp: (today's date)
✓ overall_status: "red" | "orange" | "green"
✓ status_color: "#XXXXXX"
✓ impairments: (object)
✓ recommendations: (array)
✓ action_message: (string)
✓ mood: "neutral"
```

---

## Automation Test Example

```typescript
// Jest test for detection flow
test('Detection report should display with correct color', async () => {
  // 1. Render result page with params
  render(<ResultPage />, {
    initialRoute: '/check/result?status=RED&userId=testuser1&impairment={...}'
  });
  
  // 2. Wait for detection report to load
  await waitFor(() => {
    expect(screen.queryByText(/CRITICAL/i)).toBeInTheDocument();
  });
  
  // 3. Verify color-coded card
  const statusCard = screen.getByRole('card');
  expect(statusCard).toHaveClass('bg-red-500/10');
  
  // 4. Verify impairments shown
  expect(screen.getByText(/Fatigue/i)).toBeInTheDocument();
  
  // 5. Verify recommendations shown
  expect(screen.getByText(/Rest/i)).toBeInTheDocument();
});
```

---

## Cleanup

After testing:
```powershell
# Stop backend
# Press Ctrl+C in backend terminal

# Stop frontend
# Press Ctrl+C in frontend terminal

# Clear test data (optional)
# Delete recent documents from Firestore
```

---

## Final Verification

✅ System ready for testing when all show GREEN:
- [ ] Backend running without errors
- [ ] Frontend accessible
- [ ] Test users available
- [ ] Firestore connected
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Detection endpoints responding

**Status:** ✅ **READY FOR TESTING**
