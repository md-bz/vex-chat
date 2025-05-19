"use client";
import * as React from "react";
import {
    Sheet,
    SheetContent,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { Button, LinkButton } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { useUsers } from "@/lib/hooks";
import { useState } from "react";
import CreateChannelDialog from "./CreateChannelDialog";

export function SideMenu() {
    const [open, setOpen] = useState(false);
    const router = useRouter();
    const { signOut } = useClerk();
    const { getMe } = useUsers();
    const me = getMe();

    const [dialogType, setDialogType] = useState<"channel" | "group" | null>(
        null
    );
    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost">
                    <Menu />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 flex flex-col p-4">
                <SheetTitle className="pb-20">{me?.name}</SheetTitle>
                <div className="flex flex-col h-full justify-between">
                    <div className="flex flex-col gap-4">
                        <LinkButton
                            href="/contacts"
                            variant="ghost"
                            onClick={() => setOpen(false)}
                        >
                            Contacts
                        </LinkButton>
                        <Button
                            variant="ghost"
                            onClick={() => setDialogType("channel")}
                        >
                            Create Channel
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => setDialogType("group")}
                        >
                            Create Group
                        </Button>
                    </div>
                    <div className="flex flex-col">
                        <Button
                            variant="ghost"
                            className="w-full"
                            onClick={() => signOut(() => router.push("/"))}
                        >
                            Log out
                        </Button>
                    </div>
                    {dialogType && (
                        <CreateChannelDialog
                            type={dialogType}
                            memberIds={[]}
                            onClose={() => setDialogType(null)}
                        />
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
