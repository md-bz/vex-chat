"use client";
import ContactsList from "@/components/ContactsList";
import { BackIcon } from "@/components/ui/back-icon";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import CreateChannelDialog from "@/components/CreateChannelDialog";
import { Id } from "../../../../convex/_generated/dataModel";

export default function ContactsPage() {
    const [selectedContacts, setSelectedContacts] = useState<Id<"users">[]>([]);
    const [dialogType, setDialogType] = useState<"channel" | "group" | null>(
        null
    );

    const handleSelectionChange = (selectedIds: Id<"users">[]) => {
        setSelectedContacts(selectedIds);
    };

    return (
        <>
            <div className="flex items-center pb-4 gap-2">
                <Link
                    href={"/chat"}
                    className={buttonVariants({ variant: "ghost" })}
                >
                    <BackIcon />
                </Link>
                <p>Contacts</p>
            </div>

            <div className="flex gap-2 mb-4 flex-col">
                <Button
                    variant="outline"
                    onClick={() => setDialogType("channel")}
                    disabled={selectedContacts.length === 0}
                >
                    Create Channel
                </Button>
                <Button
                    variant="outline"
                    onClick={() => setDialogType("group")}
                    disabled={selectedContacts.length === 0}
                >
                    Create Group
                </Button>
            </div>

            <ContactsList
                isSelectable={true}
                onSelectionChange={handleSelectionChange}
            />

            {dialogType && (
                <CreateChannelDialog
                    type={dialogType}
                    memberIds={selectedContacts}
                    onClose={() => setDialogType(null)}
                />
            )}
        </>
    );
}
