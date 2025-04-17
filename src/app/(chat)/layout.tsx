"use client";
import ChatArea from "@/components/chat-area";
import { useChatStore } from "@/lib/store";
import { Authenticated } from "convex/react";

export default function ChatLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const { currentChannel } = useChatStore();

    return (
        <div className="flex h-screen">
            <Authenticated>
                <div
                    className={`h-full p-4 w-64 bg-primary-foreground flex flex-col not-md:w-full ${currentChannel ? "not-md:hidden" : ""}`}
                >
                    <h1 className="text-xl font-bold pb-5">VexChat</h1>
                    {children}
                </div>
                <ChatArea />
            </Authenticated>
        </div>
    );
}
