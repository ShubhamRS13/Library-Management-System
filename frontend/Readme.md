# Library Management System — Frontend

Next.js (App Router) + TypeScript + Tailwind CSS frontend, scaffolded ahead of the backend.
All pages currently run on mock data in `src/lib/mockData.ts` so you can develop UI without
waiting on FastAPI.

## Setup

1. Unzip this folder and open it in VS Code.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the dev server:
   ```bash
   npm run dev
   ```
4. Open http://localhost:3000

## Connecting to the backend later

1. Update `.env.local` with your FastAPI URL (default is already `http://localhost:8000`).
2. Replace the mock data imports in each page (`src/lib/mockData.ts`) with real calls through
   `src/lib/api.ts` — every page already has a `// TODO: replace with apiFetch(...)` comment
   showing exactly what to swap in.
3. Wire up real auth by saving the JWT/token from `/auth/login` using `src/lib/auth.ts`.

## Structure

```
src/
├── app/              Routes (App Router) — one folder per page
├── components/       Reusable UI, grouped by feature (books, borrow, ai, layout)
├── lib/              api.ts (fetch wrapper), auth.ts (token helpers), mockData.ts
├── hooks/            useAuth.ts
└── types/            Shared TypeScript interfaces
```

## Pages included

| Route | Purpose |
|---|---|
| `/` | Home |
| `/login`, `/register` | Auth |
| `/books`, `/books/[id]` | Catalog + detail |
| `/search` | Keyword / semantic search |
| `/ai-assistant` | Pydantic AI chat UI |
| `/my-books` | Borrow history |
| `/admin`, `/admin/books`, `/admin/members` | Admin dashboard |
