"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

const titleMap: { href: string; label: string }[] = [
  { href: "/admin/books", label: "Manage Books" },
  { href: "/admin/members", label: "Members" },
  { href: "/admin/loans", label: "Loans" },
  { href: "/admin", label: "Dashboard" },
  { href: "/books", label: "Catalog" },
  { href: "/ai-assistant", label: "AI Assistant" },
];

function pageTitle(pathname: string) {
  const match = titleMap.find(
    (t) => pathname === t.href || pathname.startsWith(t.href + "/")
  );
  return match?.label || "Library Manager";
}

export default function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 flex items-center gap-4 border-b border-gray-200 bg-white/80 px-4 py-3 backdrop-blur sm:px-6">
      <button
        onClick={onMenuClick}
        className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 md:hidden"
        aria-label="Open sidebar"
      >
        <Menu size={20} />
      </button>
      <h2 className="text-sm font-semibold text-gray-800">{pageTitle(pathname)}</h2>
    </header>
  );
}
