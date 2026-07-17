"use client";

import { useState, useEffect } from "react";
import { notFound } from "next/navigation";
import { useLibrary } from "@/lib/store";
// Related books has no backend endpoint yet — this stays mock-only.
import { mockBookRelations } from "@/lib/mockData";
import StatusBadge from "@/components/books/StatusBadge";

export default function PortalBookDetailClient({ bookId }: { bookId: number }) {
  const { books, refreshBook } = useLibrary();
  const [checkedDetail, setCheckedDetail] = useState(false);

  useEffect(() => {
    setCheckedDetail(false);
    refreshBook(bookId).finally(() => setCheckedDetail(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId]);

  const book = books.find((b) => b.id === bookId);

  if (!checkedDetail) {
    return <p className="text-sm text-gray-400">Loading book...</p>;
  }
  if (!book) notFound();

  const relation = mockBookRelations.find((r) => r.book_id === bookId);
  const relatedBooks = (relation?.related_book_ids || [])
    .map((id) => books.find((b) => b.id === id))
    .filter((b): b is NonNullable<typeof b> => Boolean(b));

  const copies = book.copies ?? [];
  const availableCount = copies.filter((c) => c.is_available).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">{book.title}</h1>
        <p className="mt-1 text-sm text-gray-500">{book.author}</p>
        {book.summary && <p className="mt-4 text-sm text-gray-700">{book.summary}</p>}
        <dl className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-gray-400">ISBN</dt>
            <dd className="text-gray-800">{book.isbn}</dd>
          </div>
          <div>
            <dt className="text-gray-400">Tags</dt>
            <dd className="text-gray-800">{book.tags || "—"}</dd>
          </div>
          <div>
            <dt className="text-gray-400">Copies available</dt>
            <dd className="text-gray-800">
              {availableCount} / {copies.length}
            </dd>
          </div>
        </dl>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900">Availability</h2>
        <p className="mt-1 text-xs text-gray-400">
          Visit the library or contact them directly to borrow a copy.
        </p>
        <table className="mt-4 w-full text-left text-sm">
          <thead className="text-gray-500">
            <tr>
              <th className="pb-2 font-medium">Copy</th>
              <th className="pb-2 font-medium">Condition</th>
              <th className="pb-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {copies.map((copy) => (
              <tr key={copy.id} className="border-t border-gray-100">
                <td className="py-2 text-gray-800">#{copy.id}</td>
                <td className="py-2 capitalize text-gray-500">{copy.condition}</td>
                <td className="py-2">
                  <StatusBadge available={copy.is_available} />
                </td>
              </tr>
            ))}
            {copies.length === 0 && (
              <tr>
                <td colSpan={3} className="py-4 text-center text-sm text-gray-400">
                  No copy information available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {relatedBooks.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">Related books</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {relatedBooks.map((rb) => (
              <li key={rb.id}>
                <a
                  href={`/portal/books/${rb.id}`}
                  className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:border-brand-300 hover:text-brand-700"
                >
                  {rb.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
