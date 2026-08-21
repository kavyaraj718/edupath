# EduPath - AI-Powered Personalized Learning Path Recommender

> MERN Stack + Google Gemini Flash | Hackathon Project

## Quick Start

### Prerequisites
- Node.js 18+, MongoDB Atlas account, Google Gemini API key

### 1. Install dependencies
```bash
cd server && npm install
cd ../client && npm install
```

### 2. Configure Environment
```bash
cd server
cp .env.example .env
# Edit .env with your MongoDB URI and Gemini API key
```

### 3. Set up MongoDB Atlas Vector Search
Create a Search Index named `course_vector_index` on the `courses` collection:
```json
{
  "fields": [{ "type": "vector", "path": "embedding", "numDimensions": 1536, "similarity": "cosine" }]
}
```

### 4. Seed the database (creates 30 courses with AI embeddings)
```bash
cd server && npm run seed
```

### 5. Run development servers
```bash
# Terminal 1 - Backend (port 5000)
cd server && npm run dev
# Terminal 2 - Frontend (port 5173)
cd client && npm run dev
```

## Tech Stack
- **Frontend**: React 18, Vite, TailwindCSS, Zustand, Recharts, Framer Motion
- **Backend**: Node.js, Express, Mongoose, JWT, bcryptjs
- **Database**: MongoDB Atlas + Vector Search
- **AI**: Gemini 2.5 Flash (roadmap, chat, and extraction), gemini-embedding-001 (RAG)

## AI Features
| Feature | Model | Description |
|---|---|---|
| Intent Extraction | Gemini 2.5 Flash | Parses natural language goals |
| Roadmap Generation | Gemini 2.5 Flash | Personalized week-by-week plans |
| Streaming Chat | Gemini 2.5 Flash | Real-time AI tutor (SSE) |
| Skill Gap Analysis | Gemini 2.5 Flash | Missing skills for target role |
| Concept Explainer | Gemini 2.5 Flash | ELI5 for any technical term |
| Path Adaptation | Gemini 2.5 Flash | Adjusts difficulty from feedback |

## Deployment
- **Frontend**: [Vercel](https://vercel.com)
- **Backend**: [Render](https://render.com) (free tier)
- **Database**: MongoDB Atlas (already cloud-hosted)
