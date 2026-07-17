# Library Management System — Frontend

Next.js (App Router) + TypeScript + Tailwind CSS. Supports **two access
modes**:

1. **Public access (no login)** — enter a library's name to browse its
   catalog, check book availability, and use the AI assistant. No password,
   read-only, no member/loan/admin data ever exposed.
2. **Admin access (login required)** — library name + email + password.
   Full dashboard: catalog management, members, loans, AI assistant.

**Books, members, and loans are connected to a real FastAPI backend.** The
AI assistant is connected to `/ai/chat`. Login/registration, the public
portal's "enter library name" flow, and "related books" are still
mock-only. See `connect.md` for full details, including an important
caveat: the backend has no multi-tenancy yet, so all mock library accounts
currently share the same real data.

## Setup

```bash
npm install
npm run dev
```
Open http://localhost:3000

Set your backend's URL in `.env.local` (defaults to `http://localhost:8000`),
and make sure CORS is enabled on the backend for `http://localhost:3000`
(see `connect.md` section 0) — without it, every request will fail.

**Try the public portal:** go to `/portal`, enter `Demo Public Library`
(no password) — you'll see the catalog and AI assistant, but no way to
reach members, loans, or any admin page.

**Try admin access:** `demo@library.com` / `demo1234` at `/login`. Since
the backend has no tenant scoping yet, any account you log into or
register (or public library you enter) will show the same shared
book/member/loan data.

## Layout architecture

The app is split into three route groups (route groups don't affect the
URL, just how layouts/guards are organized):

```
src/app/
├── layout.tsx                 # Root: fonts, AuthProvider, LibraryProvider
├── (public)/                   # Marketing + auth — plain header, no guard
│   ├── layout.tsx
│   ├── page.tsx                   # Landing page (/)
│   ├── login/page.tsx              # Admin sign in
│   ├── register/page.tsx           # Admin registration
│   └── portal/page.tsx             # Public portal entry — enter library name
├── (library-portal)/            # Public portal pages — PortalHeader + RequirePortalAccess
│   ├── layout.tsx
│   └── portal/
│       ├── books/page.tsx            # Public catalog (/portal/books)
│       ├── books/[id]/                # Read-only book detail
│       ├── ai-assistant/page.tsx       # Public AI assistant
│       └── about/page.tsx              # Library contact info
└── (dashboard)/                 # Admin-only — Sidebar + Topbar + RequireAuth
    ├── layout.tsx
    ├── admin/
    │   ├── page.tsx                   # Dashboard home (/admin)
    │   ├── books/page.tsx
    │   ├── members/page.tsx
    │   └── loans/page.tsx
    ├── books/
    │   ├── page.tsx                   # Admin catalog (/books) — editable
    │   └── [id]/                       # Book detail — checkout/return/edit
    └── ai-assistant/page.tsx
```

## How the two access modes are enforced

This isn't just hidden UI — permissions are checked in two independent
places, so a bug in one doesn't compromise the other:

1. **Route guards** — `RequireAuth` (admin dashboard) checks for a real
   `account` specifically; `RequirePortalAccess` (public portal) accepts
   either an `account` (admin previewing) or a `publicLibrary` session.
   A public visitor can never pass `RequireAuth` — there's no session type
   that satisfies it except a real admin login.
2. **Data layer** — `src/lib/store.tsx` refuses to even *fetch* member/loan
   data unless an admin `account` is present (public sessions always get
   empty arrays for those), and every mutating function (`addBook`,
   `checkoutCopy`, `deleteMember`, etc.) calls a `requireAdmin()` guard that
   throws if there's no admin `account` — so even if a public page somehow
   rendered an admin control, the action would fail safely instead of
   silently succeeding.

Because `RequireAuth`/`RequirePortalAccess` each live once in their route
group's `layout.tsx`, no individual page needs to re-implement this — add a
new page under `(dashboard)/` and it's admin-only automatically; add one
under `(library-portal)/` and it's public-portal automatically.

## Key UI components

- **`components/layout/Sidebar.tsx`** — admin dashboard nav, fixed on
  desktop, slide-over drawer on mobile. Includes a "Preview public portal"
  link.
- **`components/layout/Topbar.tsx`** — mobile hamburger toggle + page title.
- **`components/layout/PublicHeader.tsx`** — header for `(public)` pages,
  auth-aware (Browse a library / Sign in / Register, or Dashboard / Logout).
- **`components/layout/PortalHeader.tsx`** — header for the public portal
  (`(library-portal)`), shows the library name and Catalog/AI/Info nav.
- **`components/auth/RequireAuth.tsx`** / **`RequirePortalAccess.tsx`** —
  the two route guards described above.
- **`components/admin/StatCard.tsx`** — dashboard metric tile, optional icon.
- **`components/admin/AddBookForm.tsx`** — single-book add form.
- **`components/admin/EditBookModal.tsx`** — edit a book's details.
- **`components/admin/BulkUploadCsv.tsx`** — CSV bulk upload: parses client-side,
  validates required columns, previews rows before committing.
- **`components/admin/EditMemberModal.tsx`** — edit a member's details.
- **`components/ui/Modal.tsx`** — generic centered modal used by both edit modals.
- **`components/books/BookCard.tsx`** / **`BookList.tsx`** — catalog tiles;
  accept a `basePath` prop so the same components serve both `/books/...`
  (admin) and `/portal/books/...` (public) links.
- **`components/ai/ChatWindow.tsx`** — accepts a `bookLinkBasePath` prop for
  the same reason; used by both the admin and public AI assistant pages.

## Data & state

- **`src/lib/auth.tsx`** — mock admin login/register/logout **and** the
  public portal's "enter library name" flow (`enterPublicPortal`/
  `exitPublicPortal`), both with session persistence via `localStorage`.
- **`src/lib/store.tsx`** — catalog data (books/members/loans), scoped to
  the active session (admin or public) and permission-checked as described
  above. Every page reads/writes through `useLibrary()`.
- **`src/types/index.ts`** — mirrors the real backend schema, with mock-only
  additions (`Loan.copy_id`, `LibraryAccount`, `PublicLibrarySession`,
  `library_id`) clearly flagged.

**See `connect.md`** for the full guide to wiring up the real backend.

## Pages

| Route | Purpose | Access |
|---|---|---|
| `/` | Public landing page | Anyone |
| `/login`, `/register` | Admin auth | Anyone |
| `/portal` | Enter a library name (no password) | Anyone |
| `/portal/books`, `/portal/books/[id]` | Read-only catalog + book detail | Public portal session (or admin) |
| `/portal/ai-assistant` | AI assistant (recommendations, general questions) | Public portal session (or admin) |
| `/portal/about` | Library contact info | Public portal session (or admin) |
| `/admin` | Dashboard home | Admin only |
| `/admin/books` | Add/delete book titles, bulk CSV upload | Admin only |
| `/admin/members` | Add/edit/delete members, update status | Admin only |
| `/admin/loans` | All loans, return action | Admin only |
| `/books`, `/books/[id]` | Editable catalog — checkout/return/edit copies | Admin only |
| `/ai-assistant` | AI assistant (admin view) | Admin only |
