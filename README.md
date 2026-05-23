# VedaAI Assessment Creator

> AI-powered assessment and question paper generator for teachers — built as a full-stack engineering assignment.

## Architecture

```
assessment-creator/
├── backend/                 # Node.js + Express + TypeScript API
│   ├── src/
│   │   ├── app.ts           # Entry point, Express + HTTP + WebSocket
│   │   ├── config/
│   │   │   ├── database.ts  # MongoDB connection manager
│   │   │   └── redis.ts     # Redis/ioredis client factory
│   │   ├── controllers/
│   │   │   └── assessment.controller.ts
│   │   ├── middleware/
│   │   │   ├── errorHandler.ts  # Global error handler + asyncHandler
│   │   │   └── validate.ts      # Zod validation middleware
│   │   ├── models/
│   │   │   └── Assessment.ts    # Mongoose schema + model
│   │   ├── routes/
│   │   │   └── assessment.routes.ts
│   │   ├── services/
│   │   │   ├── ai.service.ts    # Google Gemini AI integration
│   │   │   └── queue.service.ts # BullMQ job queue + worker
│   │   ├── types/
│   │   │   └── assessment.types.ts
│   │   ├── utils/
│   │   │   └── logger.ts        # Winston logger
│   │   └── websocket/
│   │       └── ws.handler.ts    # WebSocket server + broadcast
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/                # Next.js 14 + TypeScript
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx
    │   │   ├── page.tsx             # Redirects to /create
    │   │   ├── globals.css          # Design system CSS
    │   │   ├── create/
    │   │   │   └── page.tsx         # Multi-step assessment creation form
    │   │   ├── assessment/[id]/
    │   │   │   └── page.tsx         # AI generation + output viewer
    │   │   └── assessments/
    │   │       └── page.tsx         # Assessments list
    │   ├── components/
    │   │   ├── Navbar.tsx
    │   │   └── OutputPaper.tsx      # Generated paper with PDF export
    │   ├── hooks/
    │   │   └── useWebSocket.ts      # WebSocket hook with auto-reconnect
    │   ├── lib/
    │   │   ├── api.ts               # Axios API client
    │   │   └── pdf.ts               # jsPDF export
    │   ├── store/
    │   │   └── assessmentStore.ts   # Zustand store (with persist)
    │   └── types/
    │       └── index.ts
    ├── .env.local.example
    ├── next.config.ts
    ├── tailwind.config.ts
    └── package.json
```

## Tech Stack

| Layer      | Technology                                         |
|------------|---------------------------------------------------|
| Frontend   | Next.js 14 (App Router), TypeScript, Zustand       |
| Styling    | Tailwind CSS + custom CSS design system            |
| Forms      | React Hook Form + Zod                             |
| PDF Export | jsPDF                                             |
| Backend    | Node.js, Express, TypeScript                      |
| Database   | MongoDB + Mongoose                                |
| Queue      | BullMQ + Redis (graceful fallback without Redis)  |
| AI         | Google Gemini 2.0 Flash                           |
| Real-time  | WebSocket (ws) — server push for progress         |

## Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Redis (optional — app gracefully falls back to inline processing)
- Google Gemini API key

## Setup

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env and set GEMINI_API_KEY, MONGODB_URI, REDIS_URL
npm install
npm run dev
```

### 2. Frontend

```bash
cd frontend
cp .env.local.example .env.local
# Edit .env.local if your backend runs on a different port
npm install
npm run dev
```

Open http://localhost:3000

## API Reference

| Method | Endpoint                          | Description                    |
|--------|-----------------------------------|-------------------------------|
| POST   | `/api/assessments`                | Create & queue assessment      |
| GET    | `/api/assessments`                | List all (paginated)           |
| GET    | `/api/assessments/:id`            | Get one with generated paper   |
| GET    | `/api/assessments/:id/status`     | Poll generation status         |
| POST   | `/api/assessments/:id/regenerate` | Regenerate paper               |
| DELETE | `/api/assessments/:id`            | Delete assessment              |
| GET    | `/health`                         | Health check                   |

### WebSocket

Connect to `ws://localhost:5000/ws?assessmentId=<id>` to receive real-time events:

```json
{ "type": "progress", "assessmentId": "...", "progress": 45, "message": "Generating questions..." }
{ "type": "completed", "assessmentId": "...", "data": { ...generatedPaper } }
{ "type": "failed", "assessmentId": "...", "message": "Error details" }
```

## Features

- **Multi-step form** with validation, draft persistence, and live mark calculation
- **5 question types**: MCQ, Short Answer, Long Answer, True/False, Fill-in-the-Blank
- **File upload**: Teachers can upload PDF/TXT as source material for AI
- **Real-time generation**: WebSocket progress with animated progress ring
- **PDF export**: Branded, professionally formatted A4 paper via jsPDF
- **Answer key**: Toggle visibility of correct answers per question
- **Regeneration**: One-click regeneration of the entire paper
- **Dark mode**: Premium dark UI with glassmorphism and gradient animations
- **Redis fallback**: Works without Redis using inline async processing
- **Rate limiting**: 100 requests per 15 min per IP

## Environment Variables

### Backend (`.env`)
```env
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/vedaai-assessment
REDIS_URL=redis://localhost:6379
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.0-flash
```

### Frontend (`.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=ws://localhost:5000
```
