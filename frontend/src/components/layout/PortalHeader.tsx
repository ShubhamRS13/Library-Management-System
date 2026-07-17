"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/lib/auth";

const navItems = [
  { href: "/portal/books", label: "Catalog" },
  { href: "/portal/ai-assistant", label: "AI Assistant" },
  { href: "/portal/about", label: "Library Info" },
];

export default function PortalHeader() {
  const { account, publicLibrary, exitPublicPortal } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const libraryName = account?.name ?? publicLibrary?.name ?? "Library";

  function handleExit() {
    exitPublicPortal();
    router.push("/");
  }

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-semibold text-white">
            {libraryName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{libraryName}</p>
            <p className="text-[11px] text-gray-400">Public catalog</p>
          </div>
        </div>

        <nav className="flex gap-5 text-sm text-gray-600">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                pathname === item.href || pathname.startsWith(item.href + "/")
                  ? "font-medium text-brand-700"
                  : "hover:text-brand-600"
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {account ? (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              <LayoutDashboard size={14} />
              Back to dashboard
            </Link>
          ) : (
            <button
              onClick={handleExit}
              className="flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              <LogOut size={14} />
              Exit portal
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
