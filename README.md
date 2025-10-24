# TerpMe - The AI News Assistant for UMD Students

**TerpMe** is an AI-powered chatbot designed to keep University of Maryland students informed about campus life.  
From breaking sports stories to student events and official announcements, TerpMe makes staying updated effortless through natural, conversational answers.

---

## Features

### Real-Time Campus News

- Retrieves and summarizes the latest stories from trusted UMD sources.
- Covers **sports highlights**, **university events**, **club updates**, and **student life**.

### Conversational AI Interface

- Sleek Next.js chat interface built with **TailwindCSS** and **shadcn/ui**.
- Supports **live streaming responses** (SSE) for real-time AI replies.
- **Conversation history** with titles and previews for easy navigation.

### Smart Knowledge Base

- Automatically **scrapes and indexes UMD websites** and subdomains.
- Extracted text is embedded with **OpenAI embeddings** and stored in **Qdrant** for vector search.
- Provides **contextually relevant answers** to student questions.

### Reliable Backend

- **Express.js (TypeScript)** backend managing embeddings, chat streaming, and scraping logic.
- **Prisma + Neon Postgres** store messages, conversations, and user data.
- Optimized for scalability and fast retrieval.

### Automated Updates

- **Scheduled crawlers** refresh campus content regularly.
- Outdated embeddings are replaced seamlessly with new indexed data.

---

## Tech Stack

| Layer            | Technologies                                            |
| ---------------- | ------------------------------------------------------- |
| **Frontend**     | Next.js 15 • TypeScript • SWR • TailwindCSS • shadcn/ui |
| **Backend**      | Express • TypeScript • Node.js • SSE                    |
| **Database**     | Prisma ORM • Neon Postgres                              |
| **Vector Store** | Qdrant (OpenAI 1536-dim embeddings)                     |
| **Infra**        | AWS Lambda / Serverless • Vercel                        |
| **Other**        | UUID v5 • dotenv • Axios • cron jobs                    |

---

## Environment Variables

Create an `.env` file in both frontend and backend roots.

**Backend**

```bash
OPENAI_API_KEY=sk-...
DATABASE_URL=postgresql://user:pass@host/db
QDRANT_URL=https://your-instance.qdrant.io
QDRANT_API_KEY=your-qdrant-key
QDRANT_COLLECTION_NAME=umd_docs
QDRANT_VECTOR_SIZE=1536
PORT=8000
```

**Frontend**

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Running Locally

### 1. Install dependencies

```bash
# In both frontend and backend
npm install
```

### 2. Run the backend

```bash
cd backend
npm run dev
```

### 3. Run the frontend

```bash
cd frontend
npm run dev
```

Frontend → http://localhost:3000

Backend → http://localhost:8000
