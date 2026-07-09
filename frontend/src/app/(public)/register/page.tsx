"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = register({ name, email, password, address });
    if (!result.success) {
      setError(result.error || "Could not register.");
      return;
    }
    router.push("/admin");
  }

  return (
    <div className="mx-auto max-w-sm rounded-xl border border-gray-200 bg-white shadow-sm p-8">
      <h1 className="text-lg font-semibold text-gray-900">Register your library</h1>
      <p className="mt-1 text-sm text-gray-500">
        Creates a new, separate library account — your catalog, members, and loans stay
        isolated from other libraries.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <input
          required
          placeholder="Library name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        />
        <input
          type="email"
          required
          placeholder="Library email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        />
        <input
          type="password"
          required
          minLength={6}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        />
        <input
          placeholder="Address (optional)"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Create library account
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-500">
        Already registered?{" "}
        <Link href="/login" className="text-brand-600 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
