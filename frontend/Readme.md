# Library Management System — Frontend

Next.js (App Router) + TypeScript + Tailwind CSS. Mirrors the real FastAPI
backend schema, plus a mock multi-tenant auth layer so multiple libraries
can register and log in separately. Runs entirely on mock data for now.

## Setup

```bash
npm install
npm run dev
```
Open http://localhost:3000

Demo login: `demo@library.com` / `demo1234` — or register a new library to
see a completely separate, empty account.

## How it works

- **`src/lib/auth.tsx`** — mock registration/login/logout + session
  persistence (localStorage). Wraps the whole app.
- **`src/lib/store.tsx`** — catalog data (books/members/loans), scoped to
  whichever library is currently logged in. Every page reads/writes through
  `useLibrary()`, never touching mock data directly.
- **`src/components/auth/RequireAuth.tsx`** — wraps every protected page,
  redirecting to `/login` if no library is signed in.

**See `connect.md`** for the full guide to wiring up the real backend,
including what the backend needs to add to support real auth and
multi-tenancy (it currently has neither).

## Pages

| Route | Purpose | Protected? |
|---|---|---|
| `/` | Public landing page | No |
| `/login`, `/register` | Library account auth | No |
| `/books` | Catalog with search | Yes |
| `/books/[id]` | Book detail — manage copies, check out, return, add copies | Yes |
| `/admin` | Dashboard stats | Yes |
| `/admin/books` | Add/delete book titles | Yes |
| `/admin/members` | Add members, update status | Yes |
| `/admin/loans` | All loans, return action | Yes |
| `/ai-assistant` | Placeholder chat UI (Phase 3 — not built on the backend yet) | Yes |

## Data model

`src/types/index.ts` mirrors `app/models.py` in the backend field-for-field:
`Book`, `BookCopy`, `BookRelation`, `Member`, `Loan`. Two additions beyond
the real backend schema, both clearly flagged in the file and in
`connect.md`:
- `Loan.copy_id` — the real `Loan` table only has `book_id`, not a specific copy.
- `LibraryAccount` + `library_id` on `Book`/`Member`/`Loan` — multi-tenancy,
  entirely mocked until the backend adds a `library` table and auth.
