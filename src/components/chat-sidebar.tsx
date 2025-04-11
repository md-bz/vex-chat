"use client";

import { Button, LinkButton } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { ChatList } from "./ChatList";
import { UserSearch } from "./UserSearch";

export default function ChatSidebar() {
    const router = useRouter();
    const { signOut } = useClerk();

    return (
        <div className="h-full flex flex-col">
            <UserSearch />
            <div className="flex-1 py-4">
                <ChatList />
            </div>

            <div className="border-t border-primary/10 flex justify-center flex-col pt-4 gap-2">
                <LinkButton href="/contacts">Contacts</LinkButton>
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
