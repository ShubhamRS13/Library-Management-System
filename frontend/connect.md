# Connecting This Frontend to the Real Backend

This app currently runs entirely on mock data (`src/lib/mockData.ts`),
served through `src/lib/store.tsx`. Every page calls functions like
`addBook()`, `checkoutCopy()`, `returnLoan()` from `useLibrary()` — none of
them touch mock data directly. That means connecting the real backend is a
matter of rewriting the **inside** of `store.tsx`'s functions, one at a
time, without touching any page or component.

## 0. One-time setup

**Set the API URL.** In `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Enable CORS on the backend.** FastAPI blocks cross-origin requests by
default, so `http://localhost:3000` (this app) can't call
`http://localhost:8000` (the backend) until you add this to `app/main.py`:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```
Without this, every real request from the frontend will fail silently or
with a CORS error in the browser console — this is almost always the first
thing to check if "it worked in Postman/Swagger but not from the app."

## 1. General pattern for each swap

Every function in `store.tsx` currently does a local `setState`. The swap is
always: call `apiFetch`, then update state from the *response* instead of
computing it locally. Example — `addBook`:

**Before (mock):**
```typescript
function addBook(input: NewBookInput) {
  const newBookId = Math.max(0, ...books.map((b) => b.id)) + 1;
  // ...builds the object locally and pushes to state
}
```

**After (real):**
```typescript
async function addBook(input: NewBookInput) {
  const created = await apiFetch<Book>("/books/", {
    method: "POST",
    body: JSON.stringify({
      title: input.title,
      author: input.author,
      isbn: input.isbn,
      summary: input.summary || null,
      tags: input.tags || null,
      copies: Array.from({ length: input.initialCopies }, () => ({
        is_available: true,
        condition: "good",
      })),
    }),
  });
  setBooks((prev) => [...prev, created]);
}
```
Note the function becomes `async`, and the interface (`LibraryContextValue`)
should mark it as returning `Promise<void>` instead of `void` — the calling
pages don't need to change (they already just call `addBook(form)` without
awaiting), though awaiting it in the form's `handleSubmit` would let you
show a loading state if desired.

## 1a. Bulk CSV upload specifics

`BulkUploadCsv.tsx` parses the CSV entirely in the browser (via `papaparse`)
and only calls `bulkAddBooks()` with the validated rows — the backend never
sees a raw file, just a JSON array. Once `POST /books/bulk` is implemented,
`bulkAddBooks` in `store.tsx` should send that same array as the request
body:

```typescript
async function bulkAddBooks(inputs: NewBookInput[]) {
  const created = await apiFetch<Book[]>("/books/bulk", {
    method: "POST",
    body: JSON.stringify(
      inputs.map((i) => ({
        title: i.title,
        author: i.author,
        isbn: i.isbn,
        summary: i.summary || null,
        tags: i.tags || null,
        copies: Array.from({ length: i.initialCopies }, () => ({
          is_available: true,
          condition: "good",
        })),
      }))
    ),
  });
  setBooks((prev) => [...prev, ...created]);
}
```
No changes needed to `BulkUploadCsv.tsx` itself — it already does client-side
parsing/validation and just hands off a clean array, regardless of what
`bulkAddBooks` does with it.


## 2. Endpoint map — what to change per function

| `store.tsx` function | Real endpoint (once implemented) | Notes |
|---|---|---|
| Initial `books` load | `GET /books/` | Currently seeded from `mockBooks`. Fetch this in a `useEffect` on mount instead, or convert `page.tsx` layout usage to fetch server-side. |
| Initial `members` load | `GET /members/` | Same pattern |
| Initial `loans` load | `GET /loans/` | Same pattern — **not registered in `main.py` yet**, see below |
| `addBook` | `POST /books/` | **Already works today** — this is the one real endpoint |
| `bulkAddBooks` | `POST /books/bulk` | Backend stub — the endpoint is already scaffolded in `books.py` per the routers doc, just needs the loop-and-insert logic filled in |
| `deleteBook` | `DELETE /books/{book_id}` | Backend stub — implement there first |
| `addCopy` | No dedicated endpoint yet | Likely needs a new `POST /books/{book_id}/copies` route, or extend `PUT /books/{book_id}` to accept a copies list |
| `checkoutCopy` | `POST /loans/` | Backend stub, and `loans.router` isn't registered in `main.py` — uncomment that line first |
| `returnLoan` | `PATCH /loans/{loan_id}/return` | Same as above |
| `addMember` | `POST /members/` | Backend stub |
| `updateMemberStatus` | `PUT /members/{member_id}/status` | Backend stub |

## 3. The `copy_id` gap on `Loan`

The real backend's `Loan` table only stores `book_id`, not which specific
`BookCopy` was borrowed. This mock frontend added a `copy_id` field to make
checkout/return work per physical copy — that field **does not exist in the
real API response**.

Two ways to resolve this when the backend is ready, in order of preference:

1. **Best:** ask the backend team to add `bookcopy_id` to the `loan` table
   (this is already flagged in `04-roadmap.md` from the docs set). Then
   `checkoutCopy`/`returnLoan` map cleanly to `POST /loans/` and
   `PATCH /loans/{id}/return` with a `bookcopy_id` in the body, and the
   `copy_id` field in `types/index.ts` becomes a real field instead of a
   mock-only one.
2. **Workaround if the schema can't change soon:** on checkout, call
   `POST /loans/` with just `book_id` + `member_id` (matching today's real
   schema), then separately call an endpoint to mark *some* available copy
   of that book as unavailable — but there's no way to guarantee which copy
   was "the one" on return without extra bookkeeping. This is workable for a
   demo but not a long-term fix.

## 4. Suggested order

Matches the priority list already in `04-roadmap.md`:

1. Wire `addBook` today — the endpoint already works.
2. Once `GET /books/`, `GET /books/{id}`, `PUT`, `DELETE` are implemented,
   swap the books side of `store.tsx` fully.
3. Once `members.py` is implemented, swap `addMember` / `updateMemberStatus`
   and the initial members load.
4. Once `loans.router` is registered and implemented (and the `copy_id`
   question above is resolved), swap `checkoutCopy` / `returnLoan`.
5. `ai-assistant` stays a placeholder until Phase 3 (the Pydantic AI agent)
   is built — then point `ChatWindow.tsx`'s `handleSend` at `POST /ai/chat`.

## 6. Multi-tenancy & authentication (new)

This app now supports multiple libraries registering and logging in
separately, with each library only seeing its own books/members/loans. This
entire layer — `src/lib/auth.tsx`, `LibraryAccount`, and every `library_id`
field — **is mock-only**. The real backend currently has none of this: no
`library` table, no auth, no tenant scoping on `book`/`member`/`loan`. Here's
what needs to happen on the backend, and how the frontend swap works.

### What the backend needs to add

1. A `library` table: `id`, `name`, `email` (unique), `hashed_password`,
   `address`, `created_at`.
2. Auth endpoints: `POST /auth/register`, `POST /auth/login` (returns a JWT
   or session token), and ideally `GET /auth/me` to fetch the current
   account from a token.
3. A `library_id` foreign key added to `book`, `member`, and `loan`.
4. Every existing endpoint (`GET /books/`, `POST /members/`, etc.) needs to
   filter by the authenticated library's `library_id` — a library should
   never be able to see or modify another library's data via the API, not
   just have it hidden in the UI.
5. Password hashing (bcrypt or argon2) — never store or compare plaintext
   passwords, unlike this mock.

### How the frontend swap works

**`src/lib/auth.tsx`** — replace the body of `login`/`register`/`logout`:

```typescript
// Before (mock):
function login(email: string, password: string) {
  const found = accounts.find((a) => a.email === email && a.password === password);
  // ...
}

// After (real):
async function login(email: string, password: string) {
  const result = await apiFetch<{ token: string; account: LibraryAccount }>(
    "/auth/login",
    { method: "POST", body: JSON.stringify({ email, password }) }
  );
  saveToken(result.token); // store the JWT, e.g. in localStorage or an httpOnly cookie
  setAccount(result.account);
  return { success: true };
}
```
Every subsequent `apiFetch` call should then pass `{ token: getToken() }` so
the backend knows which library is making the request — see the `token`
option already built into `apiFetch` in `src/lib/api.ts`.

**`src/lib/store.tsx`** — once the backend filters by `library_id`
server-side (based on the token), the frontend no longer needs to filter
`books`/`members`/`loans` locally at all — just remove the
`.filter((x) => x.library_id === libraryId)` lines and trust whatever the
API returns, since it will already be scoped to the logged-in library.

**Session persistence** — swap `localStorage` for the real token from step
1 above. A JWT typically has an expiry, so also handle a 401 response from
`apiFetch` by logging the user out and redirecting to `/login`.


## 7. Removing mock data once everything is live

Once every function in `store.tsx` talks to the real API, `mockData.ts`
becomes unnecessary — delete the imports from `store.tsx`'s initial
`useState` calls (replace with `useState([])` + a `useEffect` that fetches
on mount), and the file itself can be deleted. The same applies to
`mockLibraryAccounts` in `auth.tsx` once `/auth/login` and `/auth/register`
are real.
