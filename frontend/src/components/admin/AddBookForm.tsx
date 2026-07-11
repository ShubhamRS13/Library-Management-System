"use client";

import { useState } from "react";
import { useLibrary, type NewBookInput } from "@/lib/store";

const emptyForm: NewBookInput = {
  title: "",
  author: "",
  isbn: "",
  summary: "",
  tags: "",
  initialCopies: 1,
};

export default function AddBookForm({ onDone }: { onDone?: () => void }) {
  const { addBook } = useLibrary();
  const [form, setForm] = useState<NewBookInput>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.author || !form.isbn) return;
    setSubmitting(true);
    setError("");
    try {
      await addBook(form);
      setForm(emptyForm);
      onDone?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the book.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-3 p-6 sm:grid-cols-2"
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
          onChange={(e) => setForm({ ...form, initialCopies: Number(e.target.value) })}
          className="w-20 rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-brand-500 focus:outline-none"
        />
      </label>
      {error && <p className="col-span-full text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="col-span-full rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        {submitting ? "Saving..." : "Save book"}
      </button>
    </form>
  );
}
