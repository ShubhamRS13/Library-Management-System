"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import type { Book, Member, Loan } from "@/types";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";

// ---------------------------------------------------------------------------
// CONNECTED TO THE REAL BACKEND (books, members, loans).
//
// IMPORTANT — READ THIS: the real backend has no concept of separate
// libraries yet (no auth, no `library_id`). That means once connected here,
// every registered mock library account sees the SAME shared data — there
// is no real tenant isolation anymore. The mock login/register flow in
// `auth.tsx` still gates access to the app, but it no longer partitions
// data. This will be true until the backend adds a `library` table + auth
// + a `library_id` foreign key on book/member/loan. See connect.md.
//
// LOAN <-> COPY GAP: as of the last confirmed schema, `Loan` only stores
// `book_id`, not a specific `BookCopy`. So checkout/return below only tells
// the backend "a copy of this book" — the frontend still lets you pick
// *which* copy for a good UI experience, and flips that specific copy's
// availability locally, but that copy-level detail is NOT sent to or
// confirmed by the backend. If the backend has since added a
// `bookcopy_id` field to `Loan`, search for "ADJUST IF bookcopy_id EXISTS"
// below and include it in the request bodies.
// ---------------------------------------------------------------------------

export interface NewBookInput {
  title: string;
  author: string;
  isbn: string;
  summary?: string;
  tags?: string;
  initialCopies: number;
}

export interface NewMemberInput {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  address?: string;
}

interface LibraryContextValue {
  books: Book[];
  members: Member[];
  loans: Loan[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  refreshBook: (bookId: number) => Promise<void>;
  addBook: (input: NewBookInput) => Promise<void>;
  bulkAddBooks: (inputs: NewBookInput[]) => Promise<void>;
  updateBook: (bookId: number, input: Omit<NewBookInput, "initialCopies">) => Promise<void>;
  deleteBook: (bookId: number) => Promise<void>;
  bulkDeleteBooks: (bookIds: number[]) => Promise<void>;
  addCopy: (bookId: number, condition: string) => void;
  checkoutCopy: (bookId: number, copyId: number, memberId: number) => Promise<void>;
  returnLoan: (loanId: number) => Promise<void>;
  addMember: (input: NewMemberInput) => Promise<void>;
  updateMember: (memberId: number, input: NewMemberInput) => Promise<void>;
  deleteMember: (memberId: number) => Promise<void>;
  updateMemberStatus: (memberId: number, status: Member["membership_status"]) => Promise<void>;
}

const LibraryContext = createContext<LibraryContextValue | null>(null);

// The real backend's GET /books/ (list endpoint) may not include a nested
// `copies` array the same way a single-book response does — some APIs omit
// nested relations on list views for performance. This guards against that
// (and against `copies` being `null` instead of an array) so the rest of
// the app can always safely assume `book.copies` is an array.
function normalizeBook(raw: Book): Book {
  return { ...raw, copies: raw.copies ?? [] };
}

export function LibraryProvider({ children }: { children: ReactNode }) {
  const { account, publicLibrary } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Permission enforcement, at the data layer (not just hidden UI): every
  // mutating action and the member/loan fetches below require a real admin
  // `account` — a public portal session (`publicLibrary`) is never enough,
  // even if a bug somewhere rendered an admin control on a public page.
  function requireAdmin() {
    if (!account) {
      throw new Error("Admin login is required for this action.");
    }
  }

  const currentLibraryId = account?.id ?? publicLibrary?.id ?? null;

  const fetchAll = useCallback(async () => {
    if (!currentLibraryId) {
      setBooks([]);
      setMembers([]);
      setLoans([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Public portal sessions only ever fetch the catalog — member and
      // loan data is never requested, let alone rendered, for that role.
      const [booksRes, membersRes, loansRes] = await Promise.all([
        apiFetch<Book[]>("/books/"),
        account ? apiFetch<Member[]>("/members/") : Promise.resolve<Member[]>([]),
        account ? apiFetch<Loan[]>("/loans/") : Promise.resolve<Loan[]>([]),
      ]);
      setBooks((prevBooks) => {
        const prevById = new Map(prevBooks.map((b) => [b.id, b]));
        return booksRes.map((raw) => {
          const normalized = normalizeBook(raw);
          const existing = prevById.get(raw.id);
          // If we'd already fetched full detail (with copies) for this book
          // via refreshBook, don't let this list refresh wipe it back to [].
          if (existing && existing.copies.length > 0 && normalized.copies.length === 0) {
            return { ...normalized, copies: existing.copies };
          }
          return normalized;
        });
      });
      setMembers(membersRes);
      setLoans(loansRes);
    } catch (err) {
      setError(
        err instanceof Error
          ? `Could not load data from the backend: ${err.message}`
          : "Could not load data from the backend."
      );
    } finally {
      setLoading(false);
    }
  }, [currentLibraryId, account]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // The list endpoint may not return copies (see normalizeBook above) — this
  // fetches a single book's full detail (including copies) and merges it
  // into state. Used by the book detail page on mount, so copy-level
  // actions (checkout/return/add copy) always have real data to work with.
  async function refreshBook(bookId: number) {
    try {
      const fresh = await apiFetch<Book>(`/books/${bookId}`);
      setBooks((prev) => {
        const normalized = normalizeBook(fresh);
        const exists = prev.some((b) => b.id === bookId);
        return exists
          ? prev.map((b) => (b.id === bookId ? normalized : b))
          : [...prev, normalized];
      });
    } catch {
      // If this single-book fetch fails, silently keep whatever the list
      // endpoint already provided rather than breaking the page.
    }
  }

  async function addBook(input: NewBookInput) {
    requireAdmin();
    const created = await apiFetch<Book>("/books/", {
      method: "POST",
      body: JSON.stringify({
        title: input.title,
        author: input.author,
        isbn: input.isbn,
        summary: input.summary || null,
        tags: input.tags || null,
        copies: Array.from({ length: Math.max(1, input.initialCopies) }, () => ({
          is_available: true,
          condition: "good",
        })),
      }),
    });
    setBooks((prev) => [...prev, normalizeBook(created)]);
  }

  async function bulkAddBooks(inputs: NewBookInput[]) {
    requireAdmin();
    const created = await apiFetch<Book[]>("/books/bulk", {
      method: "POST",
      body: JSON.stringify(
        inputs.map((input) => ({
          title: input.title,
          author: input.author,
          isbn: input.isbn,
          summary: input.summary || null,
          tags: input.tags || null,
          copies: Array.from({ length: Math.max(1, input.initialCopies) }, () => ({
            is_available: true,
            condition: "good",
          })),
        }))
      ),
    });
    setBooks((prev) => [...prev, ...created.map(normalizeBook)]);
  }

  async function updateBook(bookId: number, input: Omit<NewBookInput, "initialCopies">) {
    requireAdmin();
    const updated = await apiFetch<Book>(`/books/${bookId}`, {
      method: "PUT",
      body: JSON.stringify({
        title: input.title,
        author: input.author,
        isbn: input.isbn,
        summary: input.summary || null,
        tags: input.tags || null,
      }),
    });
    // Some PUT endpoints return the updated record without its relations
    // (copies) — preserve the existing copies for this book rather than
    // trusting the response to include them.
    setBooks((prev) =>
      prev.map((b) => (b.id === bookId ? { ...normalizeBook(updated), copies: b.copies } : b))
    );
  }

  async function deleteBook(bookId: number) {
    requireAdmin();
    await apiFetch<void>(`/books/${bookId}`, { method: "DELETE" });
    setBooks((prev) => prev.filter((b) => b.id !== bookId));
  }

  async function bulkDeleteBooks(bookIds: number[]) {
    requireAdmin();
    // ADJUST IF NEEDED: confirm the exact expected body shape in Swagger for
    // DELETE /books/bulk (e.g. it may expect { ids: [...] } or a raw array).
    await apiFetch<void>("/books/bulk", {
      method: "DELETE",
      body: JSON.stringify({ ids: bookIds }),
    });
    const idSet = new Set(bookIds);
    setBooks((prev) => prev.filter((b) => !idSet.has(b.id)));
  }

  // No backend endpoint exists yet for adding a single copy to an existing
  // book — this still updates local state only. Once a route like
  // POST /books/{book_id}/copies exists, replace this with a real call.
  function addCopy(bookId: number, condition: string) {
    requireAdmin();
    setBooks((prev) => {
      const maxCopyId = Math.max(0, ...prev.flatMap((b) => b.copies.map((c) => c.id)));
      return prev.map((b) =>
        b.id === bookId
          ? {
              ...b,
              copies: [
                ...b.copies,
                { id: maxCopyId + 1, book_id: bookId, is_available: true, condition },
              ],
            }
          : b
      );
    });
  }

  async function checkoutCopy(bookId: number, copyId: number, memberId: number) {
    requireAdmin();
    const created = await apiFetch<Loan>("/loans/", {
      method: "POST",
      body: JSON.stringify({
        book_id: bookId,
        member_id: memberId,
        // ADJUST IF bookcopy_id EXISTS: add `bookcopy_id: copyId` here once
        // the backend's Loan model supports it.
      }),
    });

    setLoans((prev) => [...prev, { ...created, copy_id: copyId }]);

    // Optimistic local update so the UI reflects the checkout immediately.
    setBooks((prev) =>
      prev.map((b) =>
        b.id === bookId
          ? {
              ...b,
              copies: b.copies.map((c) => (c.id === copyId ? { ...c, is_available: false } : c)),
            }
          : b
      )
    );
  }

  async function returnLoan(loanId: number) {
    requireAdmin();
    const loan = loans.find((l) => l.id === loanId);
    const updated = await apiFetch<Loan>(`/loans/${loanId}/return`, { method: "PATCH" });
    setLoans((prev) => prev.map((l) => (l.id === loanId ? { ...updated, copy_id: loan?.copy_id } : l)));

    if (loan?.copy_id) {
      setBooks((prev) =>
        prev.map((b) =>
          b.id === loan.book_id
            ? {
                ...b,
                copies: b.copies.map((c) =>
                  c.id === loan.copy_id ? { ...c, is_available: true } : c
                ),
              }
            : b
        )
      );
    }
  }

  async function addMember(input: NewMemberInput) {
    requireAdmin();
    const created = await apiFetch<Member>("/members/", {
      method: "POST",
      body: JSON.stringify({
        first_name: input.first_name,
        last_name: input.last_name,
        email: input.email,
        phone_number: input.phone_number,
        address: input.address || null,
      }),
    });
    setMembers((prev) => [...prev, created]);
  }

  async function updateMember(memberId: number, input: NewMemberInput) {
    requireAdmin();
    const updated = await apiFetch<Member>(`/members/${memberId}`, {
      method: "PUT",
      body: JSON.stringify({
        first_name: input.first_name,
        last_name: input.last_name,
        email: input.email,
        phone_number: input.phone_number,
        address: input.address || null,
      }),
    });
    setMembers((prev) => prev.map((m) => (m.id === memberId ? updated : m)));
  }

  async function deleteMember(memberId: number) {
    requireAdmin();
    await apiFetch<void>(`/members/${memberId}`, { method: "DELETE" });
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
  }

  async function updateMemberStatus(memberId: number, status: Member["membership_status"]) {
    requireAdmin();
    const updated = await apiFetch<Member>(`/members/${memberId}/status`, {
      method: "PUT",
      body: JSON.stringify({ membership_status: status }),
    });
    setMembers((prev) => prev.map((m) => (m.id === memberId ? updated : m)));
  }

  return (
    <LibraryContext.Provider
      value={{
        books,
        members,
        loans,
        loading,
        error,
        refresh: fetchAll,
        refreshBook,
        addBook,
        bulkAddBooks,
        updateBook,
        deleteBook,
        bulkDeleteBooks,
        addCopy,
        checkoutCopy,
        returnLoan,
        addMember,
        updateMember,
        deleteMember,
        updateMemberStatus,
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
}

export function useLibrary() {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error("useLibrary must be used within a LibraryProvider");
  return ctx;
}
