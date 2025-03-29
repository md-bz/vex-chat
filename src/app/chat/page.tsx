"use client";
import ChatSidebar from "@/components/chat-sidebar";
import ChatArea from "@/components/chat-area";
import { Authenticated } from "convex/react";

export default function ChatPage() {
    return (
        <div className="flex h-screen">
            <Authenticated>
                <ChatSidebar />
                <ChatArea />
            </Authenticated>
        </div>
    );
}
