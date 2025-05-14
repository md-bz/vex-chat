"use client";

import ChatSidebar from "@/components/chat-sidebar";
import { useUsers } from "@/lib/hooks";
import { useEffect } from "react";

export default function ChatPage() {
    const { updateLastSeen } = useUsers();
    useEffect(() => {
        const interval = setInterval(
            async () => {
                await updateLastSeen();
            },
            5 * 60 * 1000 // 5 minutes
        );

        return () => clearInterval(interval); // Cleanup on unmount
    }, []);

    return <ChatSidebar />;
}
