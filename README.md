# EduPath - AI-Powered Personalized Learning Path Recommender

> MERN Stack + OpenAI GPT-4o | Hackathon Project

## Quick Start

### Prerequisites
- Node.js 18+, MongoDB Atlas account, OpenAI API key

### 1. Install dependencies
```bash
cd server && npm install
cd ../client && npm install
```

### 2. Configure Environment
```bash
cd server
cp .env.example .env
# Edit .env with your MongoDB URI and OpenAI API key
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
- **AI**: OpenAI GPT-4o (roadmap), GPT-4o-mini (chat/extraction), text-embedding-3-small (RAG)

## AI Features
| Feature | Model | Description |
|---|---|---|
| Intent Extraction | GPT-4o-mini | Parses natural language goals |
| Roadmap Generation | GPT-4o | Personalized week-by-week plans |
| Streaming Chat | GPT-4o | Real-time AI tutor (SSE) |
| Skill Gap Analysis | GPT-4o-mini | Missing skills for target role |
| Concept Explainer | GPT-4o-mini | ELI5 for any technical term |
| Path Adaptation | GPT-4o | Adjusts difficulty from feedback |

## Deployment
- **Frontend**: [Vercel](https://vercel.com)
- **Backend**: [Render](https://render.com) (free tier)
- **Database**: MongoDB Atlas (already cloud-hosted)
