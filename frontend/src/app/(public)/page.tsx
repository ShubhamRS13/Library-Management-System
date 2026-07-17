"use client";

import Link from "next/link";
import { BookOpen, Users, ArrowLeftRight, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth";

const features = [
  { icon: BookOpen, title: "Full catalog", desc: "Track every title and physical copy, with live availability." },
  { icon: Users, title: "Member management", desc: "Register members and monitor their status and loan history." },
  { icon: ArrowLeftRight, title: "Loan tracking", desc: "Check copies in and out with a clear audit trail." },
  { icon: Sparkles, title: "AI assistant", desc: "Natural-language recommendations, powered by your catalog." },
];

export default function HomePage() {
  const { account } = useAuth();

  return (
    <div className="flex flex-col gap-12">
      <div className="rounded-2xl border border-gray-200 bg-white px-8 py-14 text-center shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
          Run your library from one dashboard
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-gray-500">
          One account per library. Manage your own catalog, members, and loans — completely
          separate from any other library on the platform.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {account ? (
            <>
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
            </>
          ) : (
            <>
              <Link
                href="/portal"
                className="rounded-md bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
              >
                Browse a library
              </Link>
              <Link
                href="/login"
                className="rounded-md border border-brand-600 px-5 py-2.5 text-sm font-medium text-brand-700 hover:bg-brand-50"
              >
                Library admin sign in
              </Link>
              <Link
                href="/register"
                className="rounded-md border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Register your library
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <Icon size={18} />
            </div>
            <p className="mt-3 text-sm font-semibold text-gray-900">{title}</p>
            <p className="mt-1 text-sm leading-relaxed text-gray-500">{desc}</p>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-gray-400">
        Running on mock data — see connect.md to wire up the real backend.
      </p>
    </div>
  );
}
