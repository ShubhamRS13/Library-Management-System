# Library Management System — Frontend

Next.js (App Router) + TypeScript + Tailwind CSS. A dashboard-style library
app: libraries register/log in (mock auth), then manage a catalog, members,
and loans from a sidebar-driven interface.

**Books, members, and loans are connected to a real FastAPI backend.** The
AI assistant is connected to `/ai/chat`. Login/registration and "related
books" are still mock-only. See `connect.md` for full details, including an
important caveat: the backend has no multi-tenancy yet, so all mock
library accounts currently share the same real data.

## Setup

```bash
npm install
npm run dev
```
Open http://localhost:3000

Set your backend's URL in `.env.local` (defaults to `http://localhost:8000`),
and make sure CORS is enabled on the backend for `http://localhost:3000`
(see `connect.md` section 0) — without it, every request will fail.

Demo login: `demo@library.com` / `demo1234` — or register a new library.
Since the backend has no tenant scoping yet, any account you log into or
register will show the same shared book/member/loan data.

## Layout architecture

The app is split into two route groups (route groups don't affect the URL,
just how layouts are organized):

```
src/app/
├── layout.tsx              # Root: fonts, AuthProvider, LibraryProvider
├── (public)/                # Marketing + auth — plain header, no sidebar
│   ├── layout.tsx
│   ├── page.tsx               # Landing page (/)
│   ├── login/page.tsx
│   └── register/page.tsx
└── (dashboard)/              # Everything behind login — sidebar + topbar
    ├── layout.tsx              # Sidebar + Topbar + RequireAuth, wraps every page below
    ├── admin/
    │   ├── page.tsx              # Dashboard home (/admin)
    │   ├── books/page.tsx
    │   ├── members/page.tsx
    │   └── loans/page.tsx
    ├── books/
    │   ├── page.tsx              # Catalog (/books)
    │   └── [id]/                  # Book detail
    └── ai-assistant/page.tsx
```

Because `RequireAuth` now lives once in `(dashboard)/layout.tsx`, none of
the individual pages need to wrap themselves in it — add a new page under
`(dashboard)/` and it's automatically protected and gets the sidebar.

## Key UI components

- **`components/layout/Sidebar.tsx`** — fixed on desktop, slide-over drawer
  on mobile (with backdrop), highlights the active route, shows the signed-in
  library + logout at the bottom.
- **`components/layout/Topbar.tsx`** — mobile hamburger toggle + current
  page title.
- **`components/layout/PublicHeader.tsx`** — lightweight header for the
  public pages, auth-aware (shows Sign in/Register or Dashboard/Logout).
- **`components/admin/StatCard.tsx`** — dashboard metric tile, optional icon.
- **`components/admin/AddBookForm.tsx`** — single-book add form.
- **`components/admin/EditBookModal.tsx`** — edit a book's details.
- **`components/admin/BulkUploadCsv.tsx`** — CSV bulk upload: parses client-side,
  validates required columns, previews rows before committing.
- **`components/admin/EditMemberModal.tsx`** — edit a member's details.
- **`components/ui/Modal.tsx`** — generic centered modal used by both edit modals.
- **`components/books/BookCard.tsx`** — catalog tile with an availability badge.

## Data & state (unchanged from before)

- **`src/lib/auth.tsx`** — mock registration/login/logout + session persistence.
- **`src/lib/store.tsx`** — catalog data (books/members/loans), scoped to
  the logged-in library. Every page reads/writes through `useLibrary()`.
- **`src/types/index.ts`** — mirrors the real backend schema, with mock-only
  additions (`Loan.copy_id`, `LibraryAccount`, `library_id`) clearly flagged.

**See `connect.md`** for the full guide to wiring up the real backend.

## Pages

| Route | Purpose | Protected? |
|---|---|---|
| `/` | Public landing page | No |
| `/login`, `/register` | Library account auth | No |
| `/admin` | Dashboard home | Yes |
| `/admin/books` | Add/delete book titles | Yes |
| `/admin/members` | Add members, update status | Yes |
| `/admin/loans` | All loans, return action | Yes |
| `/books` | Catalog with search | Yes |
| `/books/[id]` | Book detail — manage copies, check out, return, add copies | Yes |
| `/ai-assistant` | Placeholder chat UI (Phase 3 — not built on the backend yet) | Yes |
