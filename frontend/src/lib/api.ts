const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ApiOptions extends RequestInit {
  token?: string;
}

/**
 * Thin wrapper around fetch for talking to the FastAPI backend.
 * Once real endpoints exist, calls look like:
 *   apiFetch<Book[]>("/books/")
 *   apiFetch<Book>("/books/", { method: "POST", body: JSON.stringify(newBook) })
 * See connect.md for the full endpoint list and how each one maps to
 * src/lib/store.tsx.
 */
export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { token, headers, ...rest } = options;

  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...rest,
  });

  if (!res.ok) {
    const message = await res.text().catch(() => res.statusText);
    throw new Error(`API error ${res.status}: ${message}`);
  }

  return res.json() as Promise<T>;
}
