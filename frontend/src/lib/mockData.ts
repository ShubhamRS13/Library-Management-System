import type { Book, BorrowRecord } from "@/types";

export const mockBooks: Book[] = [
  {
    id: "1",
    title: "Clean Code",
    author: "Robert C. Martin",
    isbn: "9780132350884",
    category: "Software engineering",
    totalCopies: 3,
    availableCopies: 1,
  },
  {
    id: "2",
    title: "The Pragmatic Programmer",
    author: "Andrew Hunt & David Thomas",
    isbn: "9780135957059",
    category: "Software engineering",
    totalCopies: 2,
    availableCopies: 2,
  },
  {
    id: "3",
    title: "Gone Girl",
    author: "Gillian Flynn",
    isbn: "9780307588364",
    category: "Thriller",
    totalCopies: 4,
    availableCopies: 0,
  },
];

export const mockBorrowRecords: BorrowRecord[] = [
  {
    id: "b1",
    bookId: "1",
    bookTitle: "Clean Code",
    borrowedAt: "2026-06-20",
    dueAt: "2026-07-04",
    returnedAt: null,
  },
];
