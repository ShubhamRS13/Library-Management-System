import Link from "next/link";
import { mockBooks, mockBorrowRecords } from "@/lib/mockData";

const stats = [
  { label: "Total books", value: mockBooks.length },
  { label: "Copies borrowed", value: mockBorrowRecords.filter((r) => !r.returnedAt).length },
  {
    label: "Copies available",
    value: mockBooks.reduce((sum, b) => sum + b.availableCopies, 0),
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-gray-900">Admin dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border border-gray-200 bg-white p-5">
            <p className="text-2xl font-semibold text-brand-700">{stat.value}</p>
            <p className="mt-1 text-sm text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-4">
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
      </div>
    </div>
  );
}
