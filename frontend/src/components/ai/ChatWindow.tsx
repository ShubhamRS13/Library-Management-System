"use client";

import { useState } from "react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function ChatWindow() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        'Ask me for a book recommendation, e.g. "suggest a mystery novel". (Phase 3 — not yet connected to the backend, so this reply is a placeholder.)',
    },
  ]);
  const [input, setInput] = useState("");

  function handleSend() {
    if (!input.trim()) return;

    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // TODO (Phase 3): replace with apiFetch("/ai/chat", { method: "POST", body: JSON.stringify({ user_query: input }) })
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "The AI assistant will answer here once the backend /ai/chat endpoint (Phase 3) is built and connected.",
        },
      ]);
    }, 400);
  }

  return (
    <div className="flex h-[24rem] flex-col rounded-lg border border-gray-200 bg-white">
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
      </div>
      <div className="flex gap-2 border-t border-gray-200 p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask for a recommendation..."
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        />
        <button
          onClick={handleSend}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Send
        </button>
      </div>
    </div>
  );
}
