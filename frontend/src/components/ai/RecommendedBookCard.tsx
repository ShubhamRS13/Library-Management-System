import Link from "next/link";
import { BookOpen } from "lucide-react";

interface RecommendedBook {
  book_id: number;
  title: string;
  author: string;
  is_available: boolean;
}

export default function RecommendedBookCard({
  book,
  basePath = "/books",
}: {
  book: RecommendedBook;
  basePath?: string;
}) {
  return (
    <Link
      href={`${basePath}/${book.book_id}`}
      className="flex w-44 shrink-0 flex-col justify-between rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
        <BookOpen size={16} />
      </div>
      <div className="mt-2">
        <p className="line-clamp-2 text-xs font-medium leading-snug text-gray-900">
          {book.title}
        </p>
        <p className="mt-1 truncate text-[11px] text-gray-500">{book.author}</p>
      </div>
      <span
        className={`mt-2 inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
          book.is_available ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
        }`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            book.is_available ? "bg-green-500" : "bg-amber-500"
          }`}
        />
        {book.is_available ? "Available" : "Borrowed"}
      </span>
    </Link>
  );
}
