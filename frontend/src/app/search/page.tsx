"use client";

import { useState } from "react";
import BookList from "@/components/books/BookList";
import { mockBooks } from "@/lib/mockData";
import type { Book } from "@/types";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Book[]>(mockBooks);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    // TODO: replace with apiFetch(`/ai/search?q=${encodeURIComponent(query)}`)
    const filtered = mockBooks.filter((b) =>
      b.title.toLowerCase().includes(query.toLowerCase())
    );
    setResults(filtered);
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-gray-900">Search</h1>
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, topic, or describe what you want to read..."
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Search
        </button>
      </form>
      <BookList books={results} />
    </div>
  );
}
