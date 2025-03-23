"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ChatSidebar from "@/components/chat-sidebar";
import ChatArea from "@/components/chat-area";
import { useChatStore } from "@/lib/store";
import { useChannels } from "@/lib/hooks";

export default function ChatPage() {
    const router = useRouter();
    const [username, setUsername] = useState<string | null>(null);
    const { channels } = useChannels();
    const { selectChannel } = useChatStore();

    useEffect(() => {
        // Check if user has a username, if not redirect to home
        const storedUsername = localStorage.getItem("username");
        if (!storedUsername) {
            router.push("/");
        } else {
            setUsername(storedUsername);

            // Select the first channel when available
            if (
                channels.length > 0 &&
                !useChatStore.getState().currentChannel
            ) {
                selectChannel(channels[0]);
            }
        }
    }, [router, selectChannel, channels]);

    if (!username) {
        return (
            <div className="flex justify-center items-center h-screen">
                Loading...
            </div>
        );
    }

    return (
        <div className="flex h-screen">
            <ChatSidebar username={username} />
            <ChatArea username={username} />
        </div>
    );
}
