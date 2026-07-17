import Link from "next/link";
import type { Book } from "@/types";

export default function BookCard({
  book,
  basePath = "/books",
}: {
  book: Book;
  basePath?: string;
}) {
  const availableCount = (book.copies ?? []).filter((c) => c.is_available).length;
  const fullyOut = availableCount === 0;

  return (
    <Link
      href={`${basePath}/${book.id}`}
      className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
    >
      <div>
        <p className="font-medium text-gray-900">{book.title}</p>
        <p className="mt-1 text-sm text-gray-500">{book.author}</p>
        {book.tags && <p className="mt-2 text-xs text-gray-400">{book.tags}</p>}
      </div>
      <span
        className={`mt-4 inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-medium ${
          fullyOut ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
        }`}
      >
        {availableCount} of {(book.copies ?? []).length} available
      </span>
    </Link>
  );
}
