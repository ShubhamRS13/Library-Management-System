"use client";

import Link from "next/link";
import { BookOpen, Layers, CheckCircle2, Users, ArrowLeftRight } from "lucide-react";
import { useLibrary } from "@/lib/store";
import StatCard from "@/components/admin/StatCard";

export default function AdminDashboardPage() {
  const { books, members, loans } = useLibrary();

  const totalCopies = books.reduce((sum, b) => sum + (b.copies ?? []).length, 0);
  const availableCopies = books.reduce(
    (sum, b) => sum + (b.copies ?? []).filter((c) => c.is_available).length,
    0
  );
  const activeLoans = loans.filter((l) => !l.return_date).length;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          An overview of your library&apos;s catalog, members, and active loans.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Titles" value={books.length} icon={BookOpen} />
        <StatCard label="Total copies" value={totalCopies} icon={Layers} />
        <StatCard label="Available now" value={availableCopies} icon={CheckCircle2} />
        <StatCard label="Members" value={members.length} icon={Users} />
        <StatCard label="Active loans" value={activeLoans} icon={ArrowLeftRight} />
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-900">Quick actions</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link
            href="/admin/books"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Manage books
          </Link>
          <Link
            href="/admin/members"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Manage members
          </Link>
          <Link
            href="/admin/loans"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Manage loans
          </Link>
        </div>
      </div>
    </div>
  );
}
