"use client";

import { useAuth } from "@/lib/auth";

export default function PortalAboutPage() {
  const { account, publicLibrary } = useAuth();
  const library = account ?? publicLibrary;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Library information</h1>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-gray-400">Name</dt>
            <dd className="mt-1 text-sm text-gray-900">{library?.name || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-gray-400">Contact email</dt>
            <dd className="mt-1 text-sm text-gray-900">{library?.email || "—"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs uppercase tracking-wide text-gray-400">Address</dt>
            <dd className="mt-1 text-sm text-gray-900">{library?.address || "Not provided"}</dd>
          </div>
        </dl>
      </div>

      <p className="text-xs text-gray-400">
        For borrowing, renewals, or account questions, contact this library directly using the
        details above, or visit in person.
      </p>
    </div>
  );
}
