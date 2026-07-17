"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { apiStreamNDJSON } from "@/lib/api";
import RecommendedBookCard from "@/components/ai/RecommendedBookCard";

interface RecommendedBook {
  book_id: number;
  title: string;
  author: string;
  is_available: boolean;
}

// Matches the real /ai/chat NDJSON response shape: {"message": "...", "recommended_books": [...]}
interface AiChatChunk {
  message: string;
  recommended_books?: RecommendedBook[];
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  recommendedBooks?: RecommendedBook[];
}

function newSessionId() {
  return crypto.randomUUID();
}

export default function ChatWindow({ bookLinkBasePath = "/books" }: { bookLinkBasePath?: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: 'Ask me for a book recommendation, e.g. "do you have Harry Potter books?"',
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  // Kept for the lifetime of this conversation, per the backend's session-based
  // memory — regenerated only when "New conversation" is clicked.
  const [sessionId, setSessionId] = useState(newSessionId);

  async function handleSend() {
    if (!input.trim() || sending) return;

    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", content: input };
    const assistantId = crypto.randomUUID();
    setMessages((prev) => [...prev, userMessage, { id: assistantId, role: "assistant", content: "" }]);
    setInput("");
    setSending(true);

    try {
      const params = new URLSearchParams({
        message: userMessage.content,
        session_id: sessionId,
      });

      await apiStreamNDJSON<AiChatChunk>(`/ai/chat?${params.toString()}`, (chunk) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: chunk.message, recommendedBooks: chunk.recommended_books }
              : m
          )
        );
      }, { method: "POST" });
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content:
                  err instanceof Error
                    ? `Sorry, the assistant couldn't respond: ${err.message}`
                    : "Sorry, the assistant couldn't respond right now.",
              }
            : m
        )
      );
    } finally {
      setSending(false);
    }
  }

  function handleNewConversation() {
    setSessionId(newSessionId());
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: 'Ask me for a book recommendation, e.g. "do you have Harry Potter books?"',
      },
    ]);
  }

  return (
    <div className="flex h-[32rem] flex-col rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
        <span className="text-xs text-gray-400">Session: {sessionId.slice(0, 8)}</span>
        <button
          onClick={handleNewConversation}
          className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-brand-700"
        >
          <RefreshCw size={12} />
          New conversation
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((m) => (
          <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex flex-col gap-2"}>
            <div
              className={`max-w-[80%] whitespace-pre-line rounded-lg px-3 py-2 text-sm ${
                m.role === "user" ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-800"
              }`}
            >
              {m.content || (sending && m.role === "assistant" ? "Thinking..." : m.content)}
            </div>

            {m.recommendedBooks && m.recommendedBooks.length > 0 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {m.recommendedBooks.map((rb) => (
                  <RecommendedBookCard key={rb.book_id} book={rb} basePath={bookLinkBasePath} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2 border-t border-gray-200 p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask for a recommendation..."
          disabled={sending}
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none disabled:bg-gray-50"
        />
        <button
          onClick={handleSend}
          disabled={sending}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {sending ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}
