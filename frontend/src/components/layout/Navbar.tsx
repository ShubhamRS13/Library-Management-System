import Link from "next/link";

const links = [
  { href: "/books", label: "Catalog" },
  { href: "/search", label: "Search" },
  { href: "/ai-assistant", label: "AI assistant" },
  { href: "/my-books", label: "My books" },
];

export default function Navbar() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold text-brand-700">
          Library Management System
        </Link>
        <nav className="flex gap-6 text-sm text-gray-600">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-brand-600">
              {link.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/login"
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Sign in
        </Link>
      </div>
    </header>
  );
}
