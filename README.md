# Signn Gatekeeper

Next.js frontend and FastAPI backend for the Signn Gatekeeper app.

## Prerequisites

- **Node.js** 18+ and npm (for frontend)
- **Python** 3.10+ (for backend)
- Firebase project with Firestore and `backend/serviceAccountKey.json` in place

## Run the application

### Option 1: Two terminals (recommended)

**Terminal 1 – Frontend**

```bash
npm install
npm run dev
```

Frontend: **http://localhost:9002**

**Terminal 2 – Backend**

```bash
cd backend
# Windows
run.bat

# macOS / Linux
chmod +x run.sh
./run.sh
```

Backend API: **http://localhost:8000**  
API docs: **http://localhost:8000/docs**

### Option 2: Manual backend run

```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
set PYTHONPATH=%CD%   # Windows
# export PYTHONPATH=$PWD   # macOS/Linux
python -m uvicorn src.main:app --reload --port 8000
```

## Ports

| Service   | URL                     | Port |
|----------|-------------------------|------|
| Frontend | http://localhost:9002   | 9002 |
| Backend  | http://localhost:8000   | 8000 |

## Environment

- Frontend: copy `.env.local.example` to `.env.local` and set Firebase and (optional) backend URL.
- Backend: expects `backend/serviceAccountKey.json` for Firestore.
