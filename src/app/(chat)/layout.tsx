"use client";
import ChatArea from "@/components/chat-area";
import { SideMenu } from "@/components/SideMenu";
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
                    <div className="flex align-middle pb-5">
                        <SideMenu />
                        <h1 className="text-xl font-bold pt-1">VexChat</h1>
                    </div>
                    {children}
                </div>
                <ChatArea />
            </Authenticated>
        </div>
    );
}
