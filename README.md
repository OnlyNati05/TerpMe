<div align="center">

<h1>TerpMe</h1>

### The AI News Assistant for UMD Students

TerpMe brings University of Maryland news, events, sports, and student-life updates into one conversational experience. Ask a question in plain language and get a concise, relevant answer grounded in content from UMD sources.

</div>

---

## What TerpMe Does

Keeping up with campus information should not mean searching across dozens of websites. TerpMe continuously collects and indexes UMD content, retrieves the sources most relevant to a student's question, and uses AI to turn them into a useful response.

- **Campus-focused answers** covering news, events, athletics, clubs, and student life
- **Source-aware retrieval** powered by OpenAI embeddings and Qdrant vector search
- **Streaming conversations** for responsive, real-time answers
- **Saved chat history** with generated titles, previews, and conversation management
- **Automated indexing** to keep the knowledge base current

## How It Works

```mermaid
flowchart LR
    A[UMD websites] --> B[Crawl and extract]
    B --> C[Create embeddings]
    C --> D[(Qdrant)]
    E[Student question] --> F[Retrieve relevant context]
    D --> F
    F --> G[OpenAI response]
    G --> H[Streaming chat UI]
    H --> I[(PostgreSQL history)]
```

## Tech Stack

| Area             | Technologies                                                   |
| ---------------- | -------------------------------------------------------------- |
| Frontend         | Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui, SWR |
| Backend          | Node.js, Express 5, TypeScript, Server-Sent Events             |
| AI and retrieval | OpenAI, Qdrant                                                 |
| Data             | PostgreSQL, Prisma ORM                                         |
| Deployment       | Vercel, AWS Lambda, Serverless Framework                       |

## Project Structure

```text
TerpMe/
├── frontend/          # Next.js chat experience
│   ├── app/           # Pages and layouts
│   ├── components/    # Shared UI and chat components
│   └── lib/           # API client and utilities
├── backend/           # Express API and retrieval pipeline
│   ├── src/api/       # Routes, controllers, and services
│   ├── prisma/        # PostgreSQL schema
│   ├── cron/          # Content refresh jobs
│   └── scripts/       # Qdrant setup utilities
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 20
- npm
- A PostgreSQL database
- A Qdrant instance
- An OpenAI API key

### 1. Clone and install

```bash
git clone <repository-url>
cd TerpMe

cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure the backend

Create `backend/.env.development.local`:

```dotenv
NODE_ENV=development
PORT=8000
FRONTEND_URL=http://localhost:3000

DATABASE_URL=postgresql://user:password@host:5432/database

OPENAI_API_KEY=your-openai-api-key
OPENAI_CHAT_MODEL=your-chat-model
OPENAI_EMBEDDING_MODEL=your-embedding-model

QDRANT_URL=https://your-qdrant-instance
QDRANT_API_KEY=your-qdrant-api-key
QDRANT_COLLECTION_NAME=umd_docs
QDRANT_VECTOR_SIZE=1536
QDRANT_DISTANCE=Cosine
```

The Qdrant vector size must match the output dimensions of the embedding model you choose.

Generate the Prisma client, apply the database migrations, and initialize the vector collection:

```bash
cd backend
npm run dev:generate
npm run dev:migrate
npm run qdrant:init
```

### 3. Configure the frontend

Create `frontend/.env.development.local`:

```dotenv
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

### 4. Start the app

Run each service in a separate terminal:

```bash
# Terminal 1
cd backend
npm run dev
```

```bash
# Terminal 2
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The API runs at `http://localhost:8000`.

## Useful Commands

| Command               | Location    | Purpose                                    |
| --------------------- | ----------- | ------------------------------------------ |
| `npm run dev`         | `frontend/` | Start the Next.js development server       |
| `npm run dev`         | `backend/`  | Start the API with automatic reloads       |
| `npm run build`       | Either app  | Create a production build                  |
| `npm run lint`        | Either app  | Run the configured linter                  |
| `npm run pipeline`    | `backend/`  | Run the content ingestion pipeline         |
| `npm run qdrant:init` | `backend/`  | Create and configure the Qdrant collection |

## Roadmap

- Expand coverage across more UMD departments and student organizations
- Add clearer source citations and freshness indicators to answers
- Improve personalization for topics, clubs, and teams students follow
- Add automated test coverage for the API and chat experience

## Contributing

Contributions are welcome. Create a branch for your change, keep commits focused, and open a pull request describing what changed and how you verified it.

---

<div align="center">
  Built for the University of Maryland community.
</div>
