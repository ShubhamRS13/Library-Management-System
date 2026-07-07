"use client";

import RequireAuth from "@/components/auth/RequireAuth";
import Link from "next/link";
import { useLibrary } from "@/lib/store";
import StatCard from "@/components/admin/StatCard";

function AdminDashboardPageContent() {
  const { books, members, loans } = useLibrary();

  const totalCopies = books.reduce((sum, b) => sum + b.copies.length, 0);
  const availableCopies = books.reduce(
    (sum, b) => sum + b.copies.filter((c) => c.is_available).length,
    0
  );
  const activeLoans = loans.filter((l) => !l.return_date).length;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-gray-900">Admin dashboard</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Titles" value={books.length} />
        <StatCard label="Total copies" value={totalCopies} />
        <StatCard label="Available now" value={availableCopies} />
        <StatCard label="Members" value={members.length} />
        <StatCard label="Active loans" value={activeLoans} />
      </div>

      <div className="flex flex-wrap gap-4">
        <Link
          href="/admin/books"
          className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Manage books
        </Link>
        <Link
          href="/admin/members"
          className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Manage members
        </Link>
        <Link
          href="/admin/loans"
          className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Manage loans
        </Link>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <RequireAuth>
      <AdminDashboardPageContent />
    </RequireAuth>
  );
}
