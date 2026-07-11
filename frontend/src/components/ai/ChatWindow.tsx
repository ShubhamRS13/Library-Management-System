"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

// ADJUST IF NEEDED: the exact request/response field names below are a
// best guess (`message` in, `response` out). Expand POST /ai/chat in
// Swagger UI and check the "Request body" / "Responses" schema — if the
// field names differ, update AiChatRequest / AiChatResponse to match.
interface AiChatRequest {
  message: string;
}

interface AiChatResponse {
  response: string;
}

export default function ChatWindow() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: 'Ask me for a book recommendation, e.g. "suggest a mystery novel".',
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSend() {
    if (!input.trim() || sending) return;

    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSending(true);

    try {
      const result = await apiFetch<AiChatResponse>("/ai/chat", {
        method: "POST",
        body: JSON.stringify({ message: userMessage.content } satisfies AiChatRequest),
      });
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: result.response },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            err instanceof Error
              ? `Sorry, the assistant couldn't respond: ${err.message}`
              : "Sorry, the assistant couldn't respond right now.",
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-[24rem] flex-col rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
              m.role === "user" ? "ml-auto bg-brand-600 text-white" : "bg-gray-100 text-gray-800"
            }`}
          >
            {m.content}
          </div>
        ))}
        {sending && <div className="text-xs text-gray-400">Thinking...</div>}
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
