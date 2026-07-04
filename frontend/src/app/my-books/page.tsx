import { mockBorrowRecords } from "@/lib/mockData";

// Once the backend is running, fetch real data instead, e.g.:
// const records = await apiFetch<BorrowRecord[]>(`/members/${memberId}/history`);

export default function MyBooksPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-gray-900">My books</h1>
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Borrowed</th>
              <th className="px-4 py-3 font-medium">Due</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {mockBorrowRecords.map((record) => (
              <tr key={record.id} className="border-t border-gray-100">
                <td className="px-4 py-3 text-gray-800">{record.bookTitle}</td>
                <td className="px-4 py-3 text-gray-500">{record.borrowedAt}</td>
                <td className="px-4 py-3 text-gray-500">{record.dueAt}</td>
                <td className="px-4 py-3">
                  {record.returnedAt ? (
                    <span className="text-green-600">Returned</span>
                  ) : (
                    <span className="text-amber-600">Borrowed</span>
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
