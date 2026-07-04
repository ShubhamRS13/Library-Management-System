import { notFound } from "next/navigation";
import BorrowButton from "@/components/borrow/BorrowButton";
import { mockBooks } from "@/lib/mockData";

// Once the backend is running, fetch real data instead, e.g.:
// const book = await apiFetch<Book>(`/books/${id}`);

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const book = mockBooks.find((b) => b.id === id);

  if (!book) notFound();

  return (
    <div className="max-w-2xl rounded-lg border border-gray-200 bg-white p-8">
      <h1 className="text-xl font-semibold text-gray-900">{book.title}</h1>
      <p className="mt-1 text-sm text-gray-500">{book.author}</p>
      <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-gray-400">Category</dt>
          <dd className="text-gray-800">{book.category}</dd>
        </div>
        <div>
          <dt className="text-gray-400">ISBN</dt>
          <dd className="text-gray-800">{book.isbn}</dd>
        </div>
        <div>
          <dt className="text-gray-400">Available copies</dt>
          <dd className="text-gray-800">
            {book.availableCopies} / {book.totalCopies}
          </dd>
        </div>
      </dl>
      <div className="mt-6">
        <BorrowButton bookId={book.id} disabled={book.availableCopies === 0} />
      </div>
    </div>
  );
}
