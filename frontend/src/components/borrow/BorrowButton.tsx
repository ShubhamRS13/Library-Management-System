"use client";

import { useState } from "react";

export default function BorrowButton({
  bookId,
  disabled,
}: {
  bookId: string;
  disabled?: boolean;
}) {
  const [loading, setLoading] = useState(false);

  async function handleBorrow() {
    setLoading(true);
    // TODO: replace with apiFetch("/borrow", { method: "POST", body: JSON.stringify({ bookId }) })
    console.log("Borrow requested for book:", bookId);
    setTimeout(() => setLoading(false), 500);
  }

  return (
    <button
      onClick={handleBorrow}
      disabled={disabled || loading}
      className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-gray-300"
    >
      {loading ? "Borrowing..." : disabled ? "Unavailable" : "Borrow"}
    </button>
  );
}
