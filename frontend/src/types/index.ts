export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  totalCopies: number;
  availableCopies: number;
  coverUrl?: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  role: "member" | "admin";
}

export interface BorrowRecord {
  id: string;
  bookId: string;
  bookTitle: string;
  borrowedAt: string;
  dueAt: string;
  returnedAt: string | null;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}
