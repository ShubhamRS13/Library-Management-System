import Link from "next/link";
import type { Book } from "@/types";
import BorrowButton from "@/components/borrow/BorrowButton";

export default function BookCard({ book }: { book: Book }) {
  return (
    <div className="flex flex-col justify-between rounded-lg border border-gray-200 bg-white p-4">
      <div>
        <Link href={`/books/${book.id}`} className="font-medium text-brand-700 hover:underline">
          {book.title}
        </Link>
        <p className="mt-1 text-sm text-gray-500">{book.author}</p>
        <p className="mt-2 text-xs text-gray-400">{book.category}</p>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {book.availableCopies} of {book.totalCopies} available
        </span>
        <BorrowButton bookId={book.id} disabled={book.availableCopies === 0} />
      </div>
    </div>
  );
}
