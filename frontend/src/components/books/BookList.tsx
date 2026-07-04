import type { Book } from "@/types";
import BookCard from "@/components/books/BookCard";

export default function BookList({ books }: { books: Book[] }) {
  if (books.length === 0) {
    return <p className="text-sm text-gray-500">No books found.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
      {books.map((book) => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  );
}
