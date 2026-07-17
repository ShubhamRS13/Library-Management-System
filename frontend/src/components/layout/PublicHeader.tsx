"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function PublicHeader() {
  const { account, logout, checking } = useAuth();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-semibold text-white">
            L
          </div>
          <span className="text-sm font-semibold text-gray-900">Library Manager</span>
        </Link>

        {!checking && (
          <div className="flex items-center gap-3 text-sm">
            {account ? (
              <>
                <Link
                  href="/admin"
                  className="rounded-md bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700"
                >
                  Go to dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="rounded-md border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link href="/portal" className="font-medium text-gray-600 hover:text-brand-600">
                  Browse a library
                </Link>
                <Link href="/login" className="font-medium text-gray-600 hover:text-brand-600">
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="rounded-md bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700"
                >
                  Register library
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
