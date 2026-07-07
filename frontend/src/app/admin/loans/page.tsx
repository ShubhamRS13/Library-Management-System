"use client";

import RequireAuth from "@/components/auth/RequireAuth";
import { useLibrary } from "@/lib/store";

function AdminLoansPageContent() {
  const { books, members, loans, returnLoan } = useLibrary();

  function bookTitle(bookId: number) {
    return books.find((b) => b.id === bookId)?.title || "Unknown title";
  }

  function memberName(memberId: number) {
    const m = members.find((mm) => mm.id === memberId);
    return m ? `${m.first_name} ${m.last_name}` : "Unknown member";
  }

  const sorted = [...loans].sort((a, b) => (a.return_date ? 1 : 0) - (b.return_date ? 1 : 0));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-gray-900">Manage loans</h1>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Book</th>
              <th className="px-4 py-3 font-medium">Member</th>
              <th className="px-4 py-3 font-medium">Loaned</th>
              <th className="px-4 py-3 font-medium">Returned</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((loan) => (
              <tr key={loan.id} className="border-t border-gray-100">
                <td className="px-4 py-3 text-gray-800">{bookTitle(loan.book_id)}</td>
                <td className="px-4 py-3 text-gray-500">{memberName(loan.member_id)}</td>
                <td className="px-4 py-3 text-gray-500">{loan.load_date}</td>
                <td className="px-4 py-3">
                  {loan.return_date ? (
                    <span className="text-gray-500">{loan.return_date}</span>
                  ) : (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                      Active
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {!loan.return_date && (
                    <button
                      onClick={() => returnLoan(loan.id)}
                      className="text-brand-700 hover:underline"
                    >
                      Return
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AdminLoansPage() {
  return (
    <RequireAuth>
      <AdminLoansPageContent />
    </RequireAuth>
  );
}
