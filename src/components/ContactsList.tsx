"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useContacts } from "@/lib/hooks";
import { UserCard } from "./UserCard";

export default function ContactsList() {
    const [searchQuery, setSearchQuery] = useState("");
    const { contacts } = useContacts();

    const filteredContacts = useMemo(() => {
        if (!searchQuery) return contacts;

        return contacts.filter((contact) =>
            contact?.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [contacts, searchQuery]);

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
                        if (!contact) return;
                        return (
                            <UserCard user={contact.user} key={contact?._id} />
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
