import ChatWindow from "@/components/ai/ChatWindow";

export default function AiAssistantPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">AI assistant</h1>
        <p className="mt-1 text-sm text-gray-500">
          Phase 3 of the backend plan — natural-language recommendations powered by Pydantic AI.
          Not connected yet, so replies below are placeholders.
        </p>
      </div>
      <ChatWindow />
    </div>
  );
}
