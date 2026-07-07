"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

const links = [
  { href: "/books", label: "Catalog" },
  { href: "/admin", label: "Admin" },
  { href: "/ai-assistant", label: "AI Assistant" },
];

export default function Navbar() {
  const { account, logout, checking } = useAuth();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold text-brand-700">
          Library Management System
        </Link>

        {account && (
          <nav className="flex gap-6 text-sm text-gray-600">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-brand-600">
                {link.label}
              </Link>
            ))}
          </nav>
        )}

        {!checking && (
          <div className="flex items-center gap-3">
            {account ? (
              <>
                <span className="text-sm text-gray-500">{account.name}</span>
                <button
                  onClick={handleLogout}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-700 hover:text-brand-600"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
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
