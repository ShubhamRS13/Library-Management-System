"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";

export default function HomePage() {
  const { account } = useAuth();

  return (
    <div className="flex flex-col gap-8">
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <h1 className="text-2xl font-semibold text-gray-900">
          Library Management System
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          One account per library. Manage your own catalog, members, and loans — completely
          separate from any other library on the platform.
        </p>

        {account ? (
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/admin"
              className="rounded-md bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
            >
              Go to your dashboard
            </Link>
            <Link
              href="/books"
              className="rounded-md border border-brand-600 px-5 py-2.5 text-sm font-medium text-brand-700 hover:bg-brand-50"
            >
              Browse your catalog
            </Link>
          </div>
        ) : (
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/register"
              className="rounded-md bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
            >
              Register your library
            </Link>
            <Link
              href="/login"
              className="rounded-md border border-brand-600 px-5 py-2.5 text-sm font-medium text-brand-700 hover:bg-brand-50"
            >
              Sign in
            </Link>
          </div>
        )}
      </div>

      <p className="text-center text-xs text-gray-400">
        Running on mock data — see connect.md to wire up the real backend.
      </p>
    </div>
  );
}
