"use client";

import { useState } from "react";
import { useLibrary } from "@/lib/store";
import BookList from "@/components/books/BookList";
import RequireAuth from "@/components/auth/RequireAuth";

function BooksPageContent() {
  const { books } = useLibrary();
  const [query, setQuery] = useState("");

  const filtered = books.filter((b) => {
    const q = query.toLowerCase();
    return (
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      (b.tags || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-gray-900">Catalog</h1>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, author, or tag..."
          className="w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        />
      </div>
      <BookList books={filtered} />
    </div>
  );
}

export default function BooksPage() {
  return (
    <RequireAuth>
      <BooksPageContent />
    </RequireAuth>
  );
}
