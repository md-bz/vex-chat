import ChatSidebar from "@/components/chat-sidebar";
import ChatArea from "@/components/chat-area";

export default function ChatPage() {
    return (
        <div className="flex h-screen">
            <ChatSidebar />
            <ChatArea />
        </div>
    );
}
