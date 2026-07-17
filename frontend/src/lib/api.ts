const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ApiOptions extends RequestInit {
  token?: string;
}

/**
 * Thin wrapper around fetch for talking to the FastAPI backend.
 * Usage:
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
    throw new Error(`API error ${res.status}: ${message || res.statusText}`);
  }

  // DELETE endpoints (and some others) often return 204 No Content or an
  // empty body — calling res.json() on an empty body throws, so handle
  // that case explicitly instead of assuming every response has JSON.
  if (res.status === 204) {
    return undefined as T;
  }
  const text = await res.text();
  if (!text) {
    return undefined as T;
  }
  return JSON.parse(text) as T;
}

/**
 * For endpoints that stream a response as NDJSON (newline-delimited JSON) —
 * e.g. POST /ai/chat, which returns `content-type: application/x-ndjson`
 * with one JSON object per line rather than one single JSON body.
 * Calls `onData` once per complete line as it arrives, so the UI can render
 * the response progressively instead of waiting for the whole stream.
 */
export async function apiStreamNDJSON<T>(
  path: string,
  onData: (data: T) => void,
  options: RequestInit = {}
): Promise<void> {
  const res = await fetch(`${API_URL}${path}`, options);

  if (!res.ok) {
    const message = await res.text().catch(() => res.statusText);
    throw new Error(`API error ${res.status}: ${message || res.statusText}`);
  }
  if (!res.body) {
    throw new Error("No response body to stream.");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newlineIndex;
    while ((newlineIndex = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, newlineIndex).trim();
      buffer = buffer.slice(newlineIndex + 1);
      if (line) {
        try {
          onData(JSON.parse(line) as T);
        } catch {
          // Skip lines that aren't valid JSON (e.g. a partial chunk boundary)
        }
      }
    }
  }

  // Flush anything left in the buffer with no trailing newline.
  const trailing = buffer.trim();
  if (trailing) {
    try {
      onData(JSON.parse(trailing) as T);
    } catch {
      // ignore
    }
  }
}
