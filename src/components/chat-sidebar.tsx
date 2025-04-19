"use client";

import { ChatList } from "./ChatList";
import { UserSearch } from "./UserSearch";

export default function ChatSidebar() {
    return (
        <div className="h-full flex flex-col gap-4">
            <UserSearch />
            <ChatList />
        </div>
    );
}
