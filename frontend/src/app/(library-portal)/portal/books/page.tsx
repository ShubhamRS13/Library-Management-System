"use client";

import { useState } from "react";
import { useLibrary } from "@/lib/store";
import BookList from "@/components/books/BookList";

export default function PortalBooksPage() {
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
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Catalog</h1>
          <p className="mt-1 text-sm text-gray-500">Browse available titles and check availability.</p>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, author, or tag..."
          className="w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        />
      </div>
      <BookList books={filtered} basePath="/portal/books" />
    </div>
  );
}
