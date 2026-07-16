"use client";

import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { useLibrary } from "@/lib/store";

export default function BackendStatusBanner() {
  const { loading, error, refresh } = useLibrary();

  if (!loading && !error) return null;

  if (error) {
    return (
      <div className="flex items-center justify-between gap-3 border-b border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 sm:px-6">
        <span className="flex items-center gap-2">
          <AlertTriangle size={16} />
          {error}
        </span>
        <button
          onClick={refresh}
          className="flex items-center gap-1 rounded-md border border-red-300 px-2.5 py-1 text-xs font-medium hover:bg-red-100"
        >
          <RefreshCw size={12} />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-2 text-sm text-gray-500 sm:px-6">
      <Loader2 size={14} className="animate-spin" />
      Loading data from the backend...
    </div>
  );
}
