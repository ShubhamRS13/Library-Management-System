# Connecting This Frontend to the Real Backend

## Status: books, members, and loans are now connected

As of this update, `src/lib/store.tsx` calls the real backend for books,
members, and loans (fetching on load, and for every add/edit/delete/
checkout/return action), and `ChatWindow.tsx` calls the real `/ai/chat`
endpoint. Nothing here uses `mockData.ts` anymore except the "related
books" feature, which still has no backend endpoint.

**⚠️ Important — multi-tenancy is now effectively disabled.** The mock
login/register system (`src/lib/auth.tsx`, `LibraryAccount`) still gates
access to the app, but the real backend has no `library` table, no auth,
and no `library_id` column. That means **every registered mock library
account now sees the exact same shared data** — there is no real isolation
between "libraries" anymore. This was true the moment real API calls
replaced the local mock filtering. Fixing this requires the backend
additions described in the "Multi-tenancy & authentication" section further
down this file — nothing has changed there, it's just now the visible,
practical consequence of connecting the rest.

**Also new: a public portal access mode** (no login, just a library name)
alongside the existing admin login — see section 5 below. Like
multi-tenancy, the public/admin *distinction* is currently frontend-only;
the real backend doesn't yet reject unauthenticated requests to
member/loan endpoints the way it should.

## 0. One-time setup

**Set the API URL.** In `.env.local`, point this at wherever your FastAPI
server actually runs:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Enable CORS on the backend.** FastAPI blocks cross-origin requests by
default, so `http://localhost:3000` (this app) can't call
`http://localhost:8000` (the backend) until you add this to `app/main.py`
— **this is almost certainly the first thing to check** if requests fail
with a network error in the browser console but work fine in Swagger UI:

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

## 1. The pattern used to connect everything (reference)

This is the exact pattern already applied throughout `store.tsx` for books,
members, and loans — and the same pattern to follow for the two things
still unconnected (`addCopy`, related books). Every function does:
call `apiFetch`, then update state from the *response*. Example — `addBook`:

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


## 2. Endpoint map — status as of this update

| `store.tsx` function | Real endpoint | Status |
|---|---|---|
| Initial `books`/`members`/`loans` load | `GET /books/`, `GET /members/`, `GET /loans/` | ✅ Connected — fetched together in `fetchAll()` on login |
| `addBook` | `POST /books/` | ✅ Connected |
| `bulkAddBooks` | `POST /books/bulk` | ✅ Connected |
| `updateBook` | `PUT /books/{book_id}` | ✅ Connected |
| `deleteBook` | `DELETE /books/{book_id}` | ✅ Connected |
| `bulkDeleteBooks` | `DELETE /books/bulk` | ✅ Connected — **body shape assumed** as `{ ids: [...] }`; if the backend expects something else, update the one `body: JSON.stringify(...)` line in `bulkDeleteBooks` |
| `addMember` | `POST /members/` | ✅ Connected |
| `updateMember` | `PUT /members/{member_id}` | ✅ Connected |
| `deleteMember` | `DELETE /members/{member_id}` | ✅ Connected |
| `updateMemberStatus` | `PUT /members/{member_id}/status` | ✅ Connected — **body shape assumed** as `{ membership_status: status }` |
| `checkoutCopy` | `POST /loans/` | ✅ Connected — only sends `book_id` + `member_id`, see the copy_id note below |
| `returnLoan` | `PATCH /loans/{loan_id}/return` | ✅ Connected |
| AI chat (`ChatWindow.tsx`) | `POST /ai/chat` | ✅ Connected — **confirmed contract**: `message` and `session_id` as query params (not a JSON body!), response streamed as NDJSON with `{ message, recommended_books }` per line |
| `addCopy` | No dedicated endpoint yet | ❌ Still local-only. Likely needs `POST /books/{book_id}/copies`, or extend `PUT /books/{book_id}` to accept a copies list |
| Related books | No dedicated endpoint yet | ❌ Still reads `mockBookRelations` |

### Fields marked "assumed" — verify against Swagger

A few request/response shapes above were written based on the last
confirmed schema, not a live look at the current backend. **Before
trusting these in production**, open each endpoint in Swagger UI
(`/docs` on your backend), expand it, and check the "Request body" /
"Responses" schema against what the frontend sends:
- `DELETE /books/bulk` — confirm the request body shape in `bulkDeleteBooks` (`src/lib/store.tsx`)
- `PUT /members/{member_id}/status` — confirm the body shape in `updateMemberStatus`

If any of these don't match, the fix is a one-line change to the relevant
`JSON.stringify({...})` call or response field access — the surrounding
logic doesn't need to change.

### `POST /ai/chat` — confirmed contract (via Swagger)

Unlike the other endpoints, this one was verified directly against Swagger
UI rather than guessed:

- **Request**: `message` and `session_id` are **query parameters**, not a
  JSON body — e.g. `POST /ai/chat?message=hello&session_id=abc123`.
- **`session_id`** should stay the same for an entire conversation (it's
  how the backend keeps context between messages), and change when the
  user starts a new conversation. `ChatWindow.tsx` generates one with
  `crypto.randomUUID()` on mount and keeps it until "New conversation" is
  clicked.
- **Response**: streamed as `content-type: application/x-ndjson` — one
  JSON object per line, not a single JSON body. Each line looks like:
  ```json
  {"message": "Here are the \"Harry Potter\" books available:...", "recommended_books": [{"book_id": 61, "title": "Harry Potter and the Sorcerer's Stone", "author": "J.K. Rowling", "is_available": true}]}
  ```
- `src/lib/api.ts` has a dedicated `apiStreamNDJSON()` helper for this (separate
  from `apiFetch`, since it needs to read a stream rather than parse one JSON
  body) — used only by `ChatWindow.tsx` today, but reusable for any other
  streaming endpoint later.
- The frontend renders `recommended_books` as clickable chips (linking to
  `/books/{book_id}`, with a green/amber dot for availability) underneath
  the assistant's text reply.

## 3. The `copy_id` gap on `Loan` — still open

The real backend's `Loan` table is still assumed to only store `book_id`,
not which specific `BookCopy` was borrowed (this wasn't visible in the
latest API screenshots, so it may or may not have changed). The frontend
still lets you pick a specific copy for a good UI experience, and updates
that copy's availability **locally**, but only sends `book_id` + `member_id`
to `POST /loans/` — the copy-level detail isn't confirmed by the backend.

**If the backend has since added a `bookcopy_id` field to `Loan`**, search
`store.tsx` for `ADJUST IF bookcopy_id EXISTS` and add it to the request
body in `checkoutCopy` — then copy tracking becomes fully server-confirmed
instead of a client-side approximation.

## 4. What's left

1. Confirm the "assumed" request/response shapes above against Swagger.
2. Add a real endpoint for `addCopy` (adding a copy to an existing book).
3. Add a real endpoint for related books, or drop that feature.
4. Resolve the `copy_id` gap (see above) if precise per-copy tracking matters.
5. The big one: add auth + a `library` table + `library_id` scoping so
   multiple libraries can actually use this without seeing each other's
   data — see the next section.

## 5. Public portal access (new)

The app now has two access modes: admin (full login) and public portal
(just a library name, no password) — see the README's "Layout
architecture" section for the route structure. Like multi-tenancy below,
**this whole distinction is currently enforced only on the frontend**,
because the real backend doesn't yet distinguish "public" and "admin"
requests at all — every endpoint is equally open to anyone who can reach
the API directly (e.g. via Swagger or curl), regardless of what the
frontend UI hides.

### What the backend needs to add for this to be real

1. Once the auth system described in section 6 exists, **member and loan
   endpoints should require a valid admin token** — `GET /members/`,
   `GET /loans/`, and all their mutating counterparts should reject
   unauthenticated requests entirely (401/403), not just rely on the
   frontend not calling them.
2. **Book endpoints should stay split by verb**: `GET /books/` and
   `GET /books/{id}` should remain open (public portal needs these), but
   `POST`/`PUT`/`DELETE /books/...` should require an admin token.
3. **`POST /ai/chat` can likely stay fully open** — it's read-only in
   effect (recommendations), though consider rate-limiting it separately
   from admin traffic since it's reachable by anyone.
4. Once `library_id` scoping (section 6) exists, `GET /books/` for the
   public portal will need a way to specify *which* library's catalog to
   return without requiring login — e.g. `GET /books/?library_id=3`, or a
   library "slug" in the URL, resolved from the name entered on `/portal`.

### How the frontend swap works

`src/lib/auth.tsx`'s `enterPublicPortal(libraryName)` currently just looks
up the name in the local mock `accounts` array. Once the backend has a
library directory endpoint, replace its body with a real lookup:

```typescript
// Before (mock):
function enterPublicPortal(libraryName: string) {
  const found = accounts.find((a) => a.name.trim().toLowerCase() === query);
  // ...
}

// After (real):
async function enterPublicPortal(libraryName: string) {
  try {
    const found = await apiFetch<PublicLibrarySession>(
      `/libraries/lookup?name=${encodeURIComponent(libraryName)}`
    );
    setPublicLibrary(found);
    localStorage.setItem(PUBLIC_SESSION_KEY, String(found.id));
    return { success: true };
  } catch {
    return { success: false, error: "No library found with that name." };
  }
}
```
No frontend route guards or UI need to change — `RequirePortalAccess`,
`PortalHeader`, and every `(library-portal)` page already work purely off
the `publicLibrary` object in context, however it gets populated.

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
