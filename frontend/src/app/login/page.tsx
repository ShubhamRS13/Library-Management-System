"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = login(email, password);
    if (!result.success) {
      setError(result.error || "Could not sign in.");
      return;
    }
    router.push("/admin");
  }

  return (
    <div className="mx-auto max-w-sm rounded-lg border border-gray-200 bg-white p-8">
      <h1 className="text-lg font-semibold text-gray-900">Sign in to your library</h1>
      <p className="mt-1 text-sm text-gray-500">
        Demo account: demo@library.com / demo1234
      </p>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
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
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Sign in
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-500">
        New library?{" "}
        <Link href="/register" className="text-brand-600 hover:underline">
          Register here
        </Link>
      </p>
    </div>
  );
}
