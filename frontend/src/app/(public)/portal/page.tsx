"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";

export default function PortalEntryPage() {
  const { enterPublicPortal } = useAuth();
  const router = useRouter();
  const [libraryName, setLibraryName] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = enterPublicPortal(libraryName);
    if (!result.success) {
      setError(result.error || "Could not open that library's portal.");
      return;
    }
    router.push("/portal/books");
  }

  return (
    <div className="mx-auto max-w-sm rounded-lg border border-gray-200 bg-white p-8">
      <h1 className="text-lg font-semibold text-gray-900">Browse a library</h1>
      <p className="mt-1 text-sm text-gray-500">
        No account needed — just enter the library&apos;s name to browse its catalog, check
        availability, and ask the AI assistant for recommendations.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <input
          required
          placeholder="Library name (try: Demo Public Library)"
          value={libraryName}
          onChange={(e) => setLibraryName(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Enter library
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-500">
        Are you a library administrator?{" "}
        <Link href="/login" className="text-brand-600 hover:underline">
          Sign in instead
        </Link>
      </p>
    </div>
  );
}
