"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRouter } from "next/navigation";
import { HashIcon, MessageCircleIcon, UsersIcon } from "lucide-react";
import { useChannels, useUsers } from "@/lib/hooks";

import { useClerk } from "@clerk/nextjs";
import { Id } from "../../convex/_generated/dataModel";
import { ChatList } from "./ChatList";
import { useChatStore } from "@/lib/store";
import { UserSearch } from "./UserSearch";

export default function ChatSidebar() {
    const router = useRouter();
    const { channels, groups, privates, createChannel } = useChannels();
    const { getMe } = useUsers();
    const { signOut } = useClerk();

    // Use getMe() to get the current user
    const me = getMe();
    const username = me?.name;

    const handleCreateChannel = async (name: string) => {
        await createChannel(name, "channel");
    };

    const handleCreateGroup = async (name: string) => {
        await createChannel(name, "group");
    };

    const handleCreateDm = async (userId: string) => {
        await createChannel("name", "private", [userId as Id<"users">]);
    };

    const { currentChannel } = useChatStore();

    return (
        <div
            className={`h-full w-64 bg-primary-foreground flex flex-col not-md:w-full ${currentChannel ? "not-md:hidden" : ""}`}
        >
            <div className="p-4 border-b border-primary/10">
                <h1 className="text-xl font-bold">ConvexChat</h1>
                <div className="flex items-center mt-2">
                    <div className="h-3 w-3 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm">{username}</span>
                </div>
                <div className="py-4">
                    <UserSearch />
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-4">
                    <ChatList
                        type="channel"
                        items={channels}
                        icon={HashIcon}
                        onCreateItem={handleCreateChannel}
                    />

                    <ChatList
                        type="group"
                        items={groups}
                        icon={UsersIcon}
                        onCreateItem={handleCreateGroup}
                    />

                    <ChatList
                        type="private"
                        items={privates}
                        icon={MessageCircleIcon}
                        onCreateItem={handleCreateDm}
                    />
                </div>
            </ScrollArea>

            <div className="p-4 border-t border-primary/10">
                <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => signOut(() => router.push("/"))}
                >
                    Log out
                </Button>
            </div>
        </div>
    );
}
