"use client";

import { Input } from "@/components/ui/input";
import { SearchIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useUsers } from "@/lib/hooks";
import { Skeleton } from "./ui/skeleton";
import { UserCard } from "./UserCard";

export function UserSearch() {
    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const { searchUsers } = useUsers();
    const results = searchUsers(debouncedQuery);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query);
        }, 300); // 300ms debounce delay

        return () => clearTimeout(timer);
    }, [query]);

    return (
        <div className="flex flex-col gap-2 w-full z-10">
            <div className="flex items-center relative w-full">
                <SearchIcon className="absolute left-3 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search users..."
                    className="pl-10 pr-10 w-full"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                {query && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-3 h-5 w-5 p-0"
                        onClick={() => setQuery("")}
                    >
                        <XIcon className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {query && (
                <div className="flex flex-col bg-background rounded-md shadow-lg border w-full max-h-60 overflow-auto">
                    {!results ? (
                        <div className="flex flex-col gap-2 p-2">
                            {[...Array(3)].map((_, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-2 p-2"
                                >
                                    <Skeleton className="h-8 w-8 rounded-full" />
                                    <Skeleton className="h-4 flex-1" />
                                </div>
                            ))}
                        </div>
                    ) : results.length > 0 ? (
                        <div className="flex flex-col p-1">
                            {results.map((user) => (
                                <UserCard user={user} key={user._id} />
                            ))}
                        </div>
                    ) : (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            No results found
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
