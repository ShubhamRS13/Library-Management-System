"use client";

import { useState } from "react";
import Link from "next/link";
import { FilePlus2, UploadCloud } from "lucide-react";
import { useLibrary } from "@/lib/store";
import AddBookForm from "@/components/admin/AddBookForm";
import BulkUploadCsv from "@/components/admin/BulkUploadCsv";

type Panel = "none" | "single" | "bulk";

export default function AdminBooksPage() {
  const { books, deleteBook } = useLibrary();
  const [panel, setPanel] = useState<Panel>("none");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Manage books</h1>
          <p className="mt-1 text-sm text-gray-500">{books.length} titles in your catalog</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPanel(panel === "single" ? "none" : "single")}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium ${
              panel === "single"
                ? "bg-brand-700 text-white"
                : "bg-brand-600 text-white hover:bg-brand-700"
            }`}
          >
            <FilePlus2 size={16} />
            Add book
          </button>
          <button
            onClick={() => setPanel(panel === "bulk" ? "none" : "bulk")}
            className={`flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium ${
              panel === "bulk"
                ? "border-brand-600 bg-brand-50 text-brand-700"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            <UploadCloud size={16} />
            Bulk upload (CSV)
          </button>
        </div>
      </div>

      {panel !== "none" && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setPanel("single")}
              className={`px-5 py-3 text-sm font-medium ${
                panel === "single"
                  ? "border-b-2 border-brand-600 text-brand-700"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Single book
            </button>
            <button
              onClick={() => setPanel("bulk")}
              className={`px-5 py-3 text-sm font-medium ${
                panel === "bulk"
                  ? "border-b-2 border-brand-600 text-brand-700"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Bulk upload (CSV)
            </button>
          </div>

          {panel === "single" && <AddBookForm onDone={() => setPanel("none")} />}
          {panel === "bulk" && <BulkUploadCsv />}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50/80 text-xs font-medium uppercase tracking-wide text-gray-500">
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
              <tr key={book.id} className="border-t border-gray-100 hover:bg-gray-50/60">
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
            {books.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">
                  No books yet — add one or upload a CSV to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
