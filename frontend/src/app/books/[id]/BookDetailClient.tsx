"use client";

import { useState } from "react";
import { notFound } from "next/navigation";
import { useLibrary } from "@/lib/store";
import { mockBookRelations } from "@/lib/mockData";
import StatusBadge from "@/components/books/StatusBadge";
import RequireAuth from "@/components/auth/RequireAuth";

function BookDetailContent({ bookId }: { bookId: number }) {
  const { books, members, loans, checkoutCopy, returnLoan, addCopy } = useLibrary();
  const [selectedMember, setSelectedMember] = useState<Record<number, string>>({});
  const [newCondition, setNewCondition] = useState("good");

  const book = books.find((b) => b.id === bookId);
  if (!book) notFound();

  const relation = mockBookRelations.find((r) => r.book_id === bookId);
  const relatedBooks = (relation?.related_book_ids || [])
    .map((id) => books.find((b) => b.id === id))
    .filter((b): b is NonNullable<typeof b> => Boolean(b));

  function loanForCopy(copyId: number) {
    return loans.find((l) => l.copy_id === copyId && !l.return_date);
  }

  function memberName(memberId: number) {
    const m = members.find((mm) => mm.id === memberId);
    return m ? `${m.first_name} ${m.last_name}` : "Unknown member";
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-gray-200 bg-white p-8">
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
              {book.copies.filter((c) => c.is_available).length} / {book.copies.length}
            </dd>
          </div>
        </dl>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-gray-900">Physical copies</h2>
        <table className="mt-4 w-full text-left text-sm">
          <thead className="text-gray-500">
            <tr>
              <th className="pb-2 font-medium">Copy</th>
              <th className="pb-2 font-medium">Condition</th>
              <th className="pb-2 font-medium">Status</th>
              <th className="pb-2 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {book.copies.map((copy) => {
              const activeLoan = loanForCopy(copy.id);
              return (
                <tr key={copy.id} className="border-t border-gray-100">
                  <td className="py-2 text-gray-800">#{copy.id}</td>
                  <td className="py-2 text-gray-500 capitalize">{copy.condition}</td>
                  <td className="py-2">
                    <StatusBadge available={copy.is_available} />
                  </td>
                  <td className="py-2">
                    {copy.is_available ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={selectedMember[copy.id] || ""}
                          onChange={(e) =>
                            setSelectedMember((prev) => ({ ...prev, [copy.id]: e.target.value }))
                          }
                          className="rounded-md border border-gray-300 px-2 py-1 text-xs focus:border-brand-500 focus:outline-none"
                        >
                          <option value="">Select member...</option>
                          {members.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.first_name} {m.last_name}
                            </option>
                          ))}
                        </select>
                        <button
                          disabled={!selectedMember[copy.id]}
                          onClick={() =>
                            checkoutCopy(book.id, copy.id, Number(selectedMember[copy.id]))
                          }
                          className="rounded-md bg-brand-600 px-3 py-1 text-xs font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                        >
                          Check out
                        </button>
                      </div>
                    ) : activeLoan ? (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>
                          with {memberName(activeLoan.member_id)} since {activeLoan.load_date}
                        </span>
                        <button
                          onClick={() => returnLoan(activeLoan.id)}
                          className="rounded-md border border-gray-300 px-3 py-1 font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Return
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">No active loan on record</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-4">
          <select
            value={newCondition}
            onChange={(e) => setNewCondition(e.target.value)}
            className="rounded-md border border-gray-300 px-2 py-1 text-xs focus:border-brand-500 focus:outline-none"
          >
            <option value="good">good</option>
            <option value="worn">worn</option>
            <option value="damaged">damaged</option>
          </select>
          <button
            onClick={() => addCopy(book.id, newCondition)}
            className="rounded-md border border-brand-600 px-3 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50"
          >
            + Add another copy
          </button>
        </div>
      </div>

      {relatedBooks.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-gray-900">Related books</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {relatedBooks.map((rb) => (
              <li key={rb.id}>
                <a
                  href={`/books/${rb.id}`}
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

export default function BookDetailClient({ bookId }: { bookId: number }) {
  return (
    <RequireAuth>
      <BookDetailContent bookId={bookId} />
    </RequireAuth>
  );
}
