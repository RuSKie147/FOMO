# 🚀 FOMO: The Campus Social Matchmaking Platform

## 📌 Project Description
FOMO is a hyper-local, spontaneous social matchmaking platform designed specifically for university students. It connects students to impromptu campus events based on their unique "vibe vectors" instead of traditional profiles or endless swiping. 

## 🏗️ Architecture Overview
- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** Python (FastAPI, Serverless)
- **Database:** Amazon DynamoDB (Single-table design)
- **Storage:** Amazon S3 (for media)
- **AI/ML:** Amazon Bedrock (Embeddings for vibe vectors)
- **Auth:** Amazon Cognito (with `.edu` domain validation)
- **Infra:** AWS SAM (Serverless Application Model)

## 💻 Tech Stack
- Frontend: Node.js, React, Vite
- Backend: Python 3.12, FastAPI, Uvicorn
- Cloud: AWS (API Gateway, Lambda, DynamoDB, S3, Cognito)
- IaC: AWS SAM

## 🚀 Quick Start (Local Development)

### 1. Backend Setup
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.local_server:app --reload --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 3. Seed Demo Data
```bash
python scripts/seed_demo_data.py
```

## ☁️ AWS Deployment

1. Ensure AWS CLI and AWS SAM CLI are installed and configured.
2. Run the build and deploy commands:
```bash
sam build -t infra/template.yaml
sam deploy --guided
```

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/demo-login` | Authenticate as a demo user |
| POST | `/api/vibe-check` | Submit vibe answers to generate a vibe vector |
| GET | `/api/upload-url` | Get S3 presigned URL for media upload |
| POST | `/api/events` | Create a new campus event |
| GET | `/api/feed` | Get personalized, ranked event feed |
| POST | `/api/events/{id}/join` | Join a specific event |

## 🎮 Demo Walkthrough
1. Start the local backend and frontend servers.
2. Run the seed script `python scripts/seed_demo_data.py`.
3. Open the frontend in your browser.
4. Login using one of the demo users (e.g., `aarav.mehta@iiitd.ac.in`).
5. Complete the initial Vibe Check quiz to generate your embeddings.
6. Browse the personalized event feed.
7. Find the "Indie Jam Session & Synth Hangout" (which is pre-filled with 3 members).
8. Join the event to trigger the `CREW_LOCKED` state.