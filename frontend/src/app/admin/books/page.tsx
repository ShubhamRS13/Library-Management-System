"use client";

import RequireAuth from "@/components/auth/RequireAuth";
import { useState } from "react";
import Link from "next/link";
import { useLibrary } from "@/lib/store";

function AdminBooksPageContent() {
  const { books, addBook, deleteBook } = useLibrary();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    author: "",
    isbn: "",
    summary: "",
    tags: "",
    initialCopies: 1,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.author || !form.isbn) return;
    addBook(form);
    setForm({ title: "", author: "", isbn: "", summary: "", tags: "", initialCopies: 1 });
    setShowForm(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Manage books</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          {showForm ? "Cancel" : "Add book"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 bg-white p-6 sm:grid-cols-2"
        >
          <input
            required
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
          <input
            required
            placeholder="Author"
            value={form.author}
            onChange={(e) => setForm({ ...form, author: e.target.value })}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
          <input
            required
            placeholder="ISBN"
            value={form.isbn}
            onChange={(e) => setForm({ ...form, isbn: e.target.value })}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
          <input
            placeholder="Tags (comma separated)"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
          <textarea
            placeholder="Summary (optional)"
            value={form.summary}
            onChange={(e) => setForm({ ...form, summary: e.target.value })}
            className="col-span-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            rows={2}
          />
          <label className="flex items-center gap-2 text-sm text-gray-600">
            Initial copies
            <input
              type="number"
              min={1}
              value={form.initialCopies}
              onChange={(e) =>
                setForm({ ...form, initialCopies: Number(e.target.value) })
              }
              className="w-20 rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-brand-500 focus:outline-none"
            />
          </label>
          <button
            type="submit"
            className="col-span-full rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Save book
          </button>
        </form>
      )}

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Author</th>
              <th className="px-4 py-3 font-medium">ISBN</th>
              <th className="px-4 py-3 font-medium">Copies</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {books.map((book) => (
              <tr key={book.id} className="border-t border-gray-100">
                <td className="px-4 py-3">
                  <Link href={`/books/${book.id}`} className="text-brand-700 hover:underline">
                    {book.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-500">{book.author}</td>
                <td className="px-4 py-3 text-gray-500">{book.isbn}</td>
                <td className="px-4 py-3 text-gray-500">
                  {book.copies.filter((c) => c.is_available).length}/{book.copies.length}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => deleteBook(book.id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AdminBooksPage() {
  return (
    <RequireAuth>
      <AdminBooksPageContent />
    </RequireAuth>
  );
}
