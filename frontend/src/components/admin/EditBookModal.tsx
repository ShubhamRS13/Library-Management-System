"use client";

import { useState } from "react";
import { useLibrary } from "@/lib/store";
import type { Book } from "@/types";
import Modal from "@/components/ui/Modal";

export default function EditBookModal({
  book,
  onClose,
}: {
  book: Book;
  onClose: () => void;
}) {
  const { updateBook } = useLibrary();
  const [form, setForm] = useState({
    title: book.title,
    author: book.author,
    isbn: book.isbn,
    summary: book.summary || "",
    tags: book.tags || "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.author || !form.isbn) return;
    updateBook(book.id, form);
    onClose();
  }

  return (
    <Modal title="Edit book" onClose={onClose}>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
        <p className="col-span-full text-xs text-gray-400">
          To manage physical copies, use the copies table on the book&apos;s detail page.
        </p>
        <div className="col-span-full flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Save changes
          </button>
        </div>
      </form>
    </Modal>
  );
}
