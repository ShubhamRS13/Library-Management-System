import { mockBooks } from "@/lib/mockData";

export default function AdminBooksPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Manage books</h1>
        <button className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
          Add book
        </button>
      </div>
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Author</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Copies</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {mockBooks.map((book) => (
              <tr key={book.id} className="border-t border-gray-100">
                <td className="px-4 py-3 text-gray-800">{book.title}</td>
                <td className="px-4 py-3 text-gray-500">{book.author}</td>
                <td className="px-4 py-3 text-gray-500">{book.category}</td>
                <td className="px-4 py-3 text-gray-500">
                  {book.availableCopies}/{book.totalCopies}
                </td>
                <td className="px-4 py-3 text-right">
                  <button className="text-brand-600 hover:underline">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
