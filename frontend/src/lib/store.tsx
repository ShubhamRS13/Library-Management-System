"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import type { Book, Member, Loan } from "@/types";
import { mockBooks, mockMembers, mockLoans } from "@/lib/mockData";
import { useAuth } from "@/lib/auth";

// ---------------------------------------------------------------------------
// This is the ONE place that holds catalog data (books/members/loans) and the
// actions that mutate it. Every page reads/writes through useLibrary()
// instead of touching mockData.ts directly. That's deliberate: when the
// backend is ready, only the bodies of these functions need to change (local
// state update -> real apiFetch call) — every component that calls
// addBook(), checkoutCopy(), etc. stays exactly the same. See connect.md.
//
// TENANT SCOPING: internally this holds ALL libraries' data, then filters
// down to whichever LibraryAccount is currently logged in (via useAuth()).
// New records are automatically stamped with the current account's id. The
// real backend will need to do the equivalent filtering server-side once
// auth + a library_id foreign key exist there — see connect.md.
// ---------------------------------------------------------------------------

interface NewBookInput {
  title: string;
  author: string;
  isbn: string;
  summary?: string;
  tags?: string;
  initialCopies: number;
}

interface NewMemberInput {
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
  addBook: (input: NewBookInput) => void;
  deleteBook: (bookId: number) => void;
  addCopy: (bookId: number, condition: string) => void;
  checkoutCopy: (bookId: number, copyId: number, memberId: number) => void;
  returnLoan: (loanId: number) => void;
  addMember: (input: NewMemberInput) => void;
  updateMemberStatus: (memberId: number, status: Member["membership_status"]) => void;
}

const LibraryContext = createContext<LibraryContextValue | null>(null);

export function LibraryProvider({ children }: { children: ReactNode }) {
  const { account } = useAuth();
  const [allBooks, setAllBooks] = useState<Book[]>(mockBooks);
  const [allMembers, setAllMembers] = useState<Member[]>(mockMembers);
  const [allLoans, setAllLoans] = useState<Loan[]>(mockLoans);

  const libraryId = account?.id ?? -1;
  const books = allBooks.filter((b) => b.library_id === libraryId);
  const members = allMembers.filter((m) => m.library_id === libraryId);
  const loans = allLoans.filter((l) => l.library_id === libraryId);

  function addBook(input: NewBookInput) {
    const newBookId = Math.max(0, ...allBooks.map((b) => b.id)) + 1;
    const maxCopyId = Math.max(0, ...allBooks.flatMap((b) => b.copies.map((c) => c.id)));
    const copies = Array.from({ length: Math.max(1, input.initialCopies) }, (_, i) => ({
      id: maxCopyId + i + 1,
      book_id: newBookId,
      is_available: true,
      condition: "good",
    }));

    setAllBooks((prev) => [
      ...prev,
      {
        id: newBookId,
        title: input.title,
        author: input.author,
        isbn: input.isbn,
        summary: input.summary || null,
        tags: input.tags || null,
        library_id: libraryId,
        copies,
      },
    ]);
  }

  function deleteBook(bookId: number) {
    setAllBooks((prev) => prev.filter((b) => b.id !== bookId));
  }

  function addCopy(bookId: number, condition: string) {
    const maxCopyId = Math.max(0, ...allBooks.flatMap((b) => b.copies.map((c) => c.id)));
    setAllBooks((prev) =>
      prev.map((b) =>
        b.id === bookId
          ? {
              ...b,
              copies: [
                ...b.copies,
                { id: maxCopyId + 1, book_id: bookId, is_available: true, condition },
              ],
            }
          : b
      )
    );
  }

  function checkoutCopy(bookId: number, copyId: number, memberId: number) {
    setAllBooks((prev) =>
      prev.map((b) =>
        b.id === bookId
          ? {
              ...b,
              copies: b.copies.map((c) =>
                c.id === copyId ? { ...c, is_available: false } : c
              ),
            }
          : b
      )
    );

    const newLoanId = Math.max(0, ...allLoans.map((l) => l.id)) + 1;
    setAllLoans((prev) => [
      ...prev,
      {
        id: newLoanId,
        book_id: bookId,
        member_id: memberId,
        copy_id: copyId,
        load_date: new Date().toISOString().slice(0, 10),
        return_date: null,
        library_id: libraryId,
      },
    ]);

    setAllMembers((prev) =>
      prev.map((m) =>
        m.id === memberId
          ? {
              ...m,
              total_loan_count: m.total_loan_count + 1,
              last_activity_date: new Date().toISOString().slice(0, 10),
            }
          : m
      )
    );
  }

  function returnLoan(loanId: number) {
    const loan = allLoans.find((l) => l.id === loanId);
    if (!loan) return;

    setAllLoans((prev) =>
      prev.map((l) =>
        l.id === loanId ? { ...l, return_date: new Date().toISOString().slice(0, 10) } : l
      )
    );

    if (loan.copy_id) {
      setAllBooks((prev) =>
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

  function addMember(input: NewMemberInput) {
    const newId = Math.max(0, ...allMembers.map((m) => m.id)) + 1;
    setAllMembers((prev) => [
      ...prev,
      {
        id: newId,
        first_name: input.first_name,
        last_name: input.last_name,
        email: input.email,
        phone_number: input.phone_number,
        address: input.address || null,
        membership_status: "active",
        join_date: new Date().toISOString().slice(0, 10),
        last_activity_date: null,
        total_loan_count: 0,
        library_id: libraryId,
      },
    ]);
  }

  function updateMemberStatus(memberId: number, status: Member["membership_status"]) {
    setAllMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, membership_status: status } : m))
    );
  }

  return (
    <LibraryContext.Provider
      value={{
        books,
        members,
        loans,
        addBook,
        deleteBook,
        addCopy,
        checkoutCopy,
        returnLoan,
        addMember,
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
