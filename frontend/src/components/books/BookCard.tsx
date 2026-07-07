import Link from "next/link";
import type { Book } from "@/types";

export default function BookCard({ book }: { book: Book }) {
  const availableCount = book.copies.filter((c) => c.is_available).length;

  return (
    <Link
      href={`/books/${book.id}`}
      className="flex flex-col justify-between rounded-lg border border-gray-200 bg-white p-4 hover:border-brand-300 hover:shadow-sm"
    >
      <div>
        <p className="font-medium text-gray-900">{book.title}</p>
        <p className="mt-1 text-sm text-gray-500">{book.author}</p>
        {book.tags && (
          <p className="mt-2 text-xs text-gray-400">{book.tags}</p>
        )}
      </div>
      <p className="mt-4 text-xs text-gray-500">
        {availableCount} of {book.copies.length} copies available
      </p>
    </Link>
  );
}
