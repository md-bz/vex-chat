"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useContacts } from "@/lib/hooks";
import { UserCard } from "./UserCard";
import { Checkbox } from "@/components/ui/checkbox";
import { Id } from "../../convex/_generated/dataModel";

interface ContactsListProps {
    isSelectable?: boolean;
    onSelectionChange?: (selectedIds: Id<"users">[]) => void;
}

export default function ContactsList({
    isSelectable = false,
    onSelectionChange,
}: ContactsListProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedIds, setSelectedIds] = useState<Id<"users">[]>([]);
    const { contacts } = useContacts();

    const filteredContacts = useMemo(() => {
        if (!searchQuery) return contacts;
        return contacts.filter((contact) =>
            contact?.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [contacts, searchQuery]);

    const handleSelect = (contactId: Id<"users">) => {
        const newSelectedIds = selectedIds.includes(contactId)
            ? selectedIds.filter((id) => id !== contactId)
            : [...selectedIds, contactId];

        setSelectedIds(newSelectedIds);
        onSelectionChange?.(newSelectedIds);
    };

    return (
        <div className="flex flex-col h-full">
            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search contacts..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
                {filteredContacts.length > 0 ? (
                    filteredContacts.map((contact) => {
                        if (!contact) return null;
                        return (
                            <div
                                key={contact._id}
                                className="flex items-center gap-2"
                            >
                                {isSelectable && (
                                    <Checkbox
                                        checked={selectedIds.includes(
                                            contact.user._id
                                        )}
                                        onCheckedChange={() =>
                                            handleSelect(contact.user._id)
                                        }
                                    />
                                )}
                                <div className="w-full">
                                    <UserCard user={contact.user} />
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center text-muted-foreground py-4">
                        {searchQuery
                            ? "No matching contacts found"
                            : "No contacts available"}
                    </div>
                )}
            </div>
        </div>
    );
}
