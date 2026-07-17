import ChatWindow from "@/components/ai/ChatWindow";

export default function PortalAiAssistantPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">AI assistant</h1>
        <p className="mt-1 text-sm text-gray-500">
          Ask for a book recommendation or a general question about the library.
        </p>
      </div>
      <ChatWindow bookLinkBasePath="/portal/books" />
    </div>
  );
}
