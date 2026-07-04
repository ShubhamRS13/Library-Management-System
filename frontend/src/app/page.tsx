import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <h1 className="text-2xl font-semibold text-gray-900">
          Welcome to the Library Management System
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Browse the catalog, search by topic, or ask the AI assistant for a recommendation.
        </p>
        <div className="mt-6 flex justify-center gap-4">
          <Link
            href="/books"
            className="rounded-md bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            Browse catalog
          </Link>
          <Link
            href="/ai-assistant"
            className="rounded-md border border-brand-600 px-5 py-2.5 text-sm font-medium text-brand-700 hover:bg-brand-50"
          >
            Ask the AI assistant
          </Link>
        </div>
      </div>

      <p className="text-center text-xs text-gray-400">
        Backend not connected yet — pages are running on mock data from src/lib/mockData.ts
      </p>
    </div>
  );
}
