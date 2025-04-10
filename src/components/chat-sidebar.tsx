"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRouter } from "next/navigation";
import { useUsers } from "@/lib/hooks";
import { useClerk } from "@clerk/nextjs";
import { ChatList } from "./ChatList";
import { useChatStore } from "@/lib/store";
import { UserSearch } from "./UserSearch";
import { useState } from "react";
import ContactsList from "./ContactsList";
import { BackIcon } from "./ui/back-icon";

export default function ChatSidebar() {
    const router = useRouter();
    const { getMe } = useUsers();
    const { signOut } = useClerk();

    const me = getMe();
    const username = me?.name;

    const { currentChannel } = useChatStore();
    const [isContactsActive, setIsContactsActive] = useState(false);

    return (
        <div
            className={`h-full p-4 w-64 bg-primary-foreground flex flex-col not-md:w-full ${currentChannel ? "not-md:hidden" : ""}`}
        >
            <div className="pb-4 border-primary/10">
                <h1 className="text-xl font-bold">ConvexChat</h1>
                <div className="flex items-center mt-2">
                    <div className="h-3 w-3 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm">{username}</span>
                </div>
            </div>

            {isContactsActive ? (
                <>
                    <div className="flex items-center">
                        <Button
                            variant="ghost"
                            onClick={() => setIsContactsActive(false)}
                        >
                            <BackIcon />
                        </Button>
                        <p>Contacts</p>
                    </div>

                    <ContactsList />
                </>
            ) : (
                <>
                    <UserSearch />
                    <ScrollArea className="flex-1">
                        <div className="py-4">
                            <ChatList />
                        </div>
                    </ScrollArea>
                    <Button
                        onClick={() => setIsContactsActive(true)}
                        className="mt-4"
                    >
                        Contacts
                    </Button>
                </>
            )}

            <div className="border-t border-primary/10">
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
