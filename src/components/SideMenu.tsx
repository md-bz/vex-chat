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

export function SideMenu() {
    const [open, setOpen] = useState(false);
    const router = useRouter();
    const { signOut } = useClerk();
    const { getMe } = useUsers();
    const me = getMe();
    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost">
                    <Menu />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-4 flex flex-col gap-4">
                <SheetTitle className="pb-10">{me?.name}</SheetTitle>
                <LinkButton
                    href="/contacts"
                    variant="ghost"
                    onClick={() => setOpen(false)}
                >
                    Contacts
                </LinkButton>
                <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => signOut(() => router.push("/"))}
                >
                    Log out
                </Button>
            </SheetContent>
        </Sheet>
    );
}
