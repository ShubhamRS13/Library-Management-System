import BookList from "@/components/books/BookList";
import { mockBooks } from "@/lib/mockData";

// Once the backend is running, fetch real data instead, e.g.:
// const books = await apiFetch<Book[]>("/books");

export default function BooksPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-gray-900">Catalog</h1>
      <BookList books={mockBooks} />
    </div>
  );
}
