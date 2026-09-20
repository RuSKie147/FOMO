# FOMO

FOMO is a campus social app for discovering and joining small, spontaneous student events. It combines a React frontend with a FastAPI backend and can run locally without AWS credentials using mock mode.

## Project structure

- `/home/runner/work/FOMO/FOMO/frontend` - React + Vite + Tailwind web app
- `/home/runner/work/FOMO/FOMO/backend` - FastAPI API, services, and tests
- `/home/runner/work/FOMO/FOMO/infra` - AWS SAM template for cloud deployment
- `/home/runner/work/FOMO/FOMO/scripts` - helper scripts for demo data and API checks

## Tech stack

- Frontend: React 18, TypeScript, Vite, Tailwind CSS, Leaflet
- Backend: Python 3.12, FastAPI, Uvicorn, Pydantic
- Cloud services: AWS Lambda, API Gateway, DynamoDB, S3, SES, Bedrock
- Infrastructure as code: AWS SAM

## Local development

### 1) Start the backend

```bash
cd /home/runner/work/FOMO/FOMO/backend
pip install -r requirements.txt
python -m uvicorn app.local_server:app --reload --port 8000
```

Notes:
- Local backend defaults to `USE_MOCK_AWS=true`, so it works without AWS credentials.
- API base URL is `http://localhost:8000`.

### 2) Start the frontend

```bash
cd /home/runner/work/FOMO/FOMO/frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` by default.

### 3) Seed demo data (optional)

```bash
cd /home/runner/work/FOMO/FOMO
python scripts/seed_demo_data.py --url http://localhost:8000
```

### 4) Verify core API flows (optional)

```bash
cd /home/runner/work/FOMO/FOMO
python scripts/verify_endpoints.py --url http://localhost:8000
```

## Frontend scripts

From `/home/runner/work/FOMO/FOMO/frontend`:

- `npm run dev` - start dev server
- `npm run build` - type-check and build production assets
- `npm run lint` - run ESLint
- `npm run preview` - preview production build

## Backend tests

From `/home/runner/work/FOMO/FOMO/backend`:

```bash
pytest
```

## API overview

Base URL: `http://localhost:8000`

### Auth
- `POST /api/auth/demo-login`
- `POST /api/auth/reset-demo-db`

### Vibe and upload
- `POST /api/vibe-check`
- `GET /api/upload-url`

### Events
- `POST /api/events`
- `GET /api/events/feed`
- `GET /api/feed` (alias of events feed)
- `GET /api/events/{eventId}`
- `POST /api/events/{eventId}/join`
- `POST /api/events/{eventId}/leave`
- `DELETE /api/events/{eventId}?hostId=...`
- `GET /api/events/{eventId}/messages`
- `POST /api/events/{eventId}/messages`

### Invitations
- `GET /api/invitations/pending?email=...`
- `GET /api/invitations/sent/recent`
- `GET /api/invitations/{inviteId}`
- `POST /api/invitations/{inviteId}/accept`
- `POST /api/invitations/{inviteId}/decline`
- `POST /api/invitations/send`

## AWS deployment

```bash
cd /home/runner/work/FOMO/FOMO
sam build -t infra/template.yaml
sam deploy --guided
```

The SAM template provisions:
- HTTP API + Lambda backend
- DynamoDB table (`FOMOEngine`)
- S3 media bucket
- Cognito user pool and client
- IAM permissions for DynamoDB, S3, SES, and Bedrock
