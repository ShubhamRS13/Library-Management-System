import ChatWindow from "@/components/ai/ChatWindow";

export default function AiAssistantPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">AI assistant</h1>
        <p className="mt-1 text-sm text-gray-500">
          Powered by the Pydantic AI agent on the backend, once connected.
        </p>
      </div>
      <ChatWindow />
    </div>
  );
}
