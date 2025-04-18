"use client";
import { useUsers } from "@/lib/hooks";
import { redirect, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import { ConvexError } from "convex/values";
import { Authenticated } from "convex/react";

export default function HandleUsername() {
    return (
        <Authenticated>
            <HandleUsernameMain />
        </Authenticated>
    );
}

function HandleUsernameMain() {
    const { createUser, getMe } = useUsers();
    const router = useRouter();
    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const me = getMe();

    useEffect(() => {
        if (me?._id) {
            router.replace("/chat");
        }
    }, [me]);

    const handleJoin = async () => {
        if (!name.trim()) {
            setError("name cannot be empty");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const user = await createUser(name, username.trim());
            if (user) {
                return redirect("/chat");
            }
        } catch (error: any) {
            const errorMessage =
                error instanceof ConvexError
                    ? (error.data as string)
                    : "Unexpected error occurred";
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleJoin();
        }
    };

    return (
        <div className="space-y-4 w-full max-w-sm">
            <div>
                <Input
                    placeholder="Enter name"
                    value={name}
                    onChange={(e) => {
                        setName(e.target.value);
                        setError("");
                    }}
                    onKeyDown={handleKeyDown}
                    className="mb-2"
                />
                <Input
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => {
                        setUsername(e.target.value);
                        setError("");
                    }}
                    onKeyDown={handleKeyDown}
                    className="mb-2"
                />
                {error && (
                    <Alert variant="destructive" className="mt-2">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
            </div>
            <Button
                onClick={handleJoin}
                className="w-full"
                // disabled={!name.trim() || isLoading}
            >
                {isLoading ? "Joining..." : "Join Chat"}
            </Button>
        </div>
    );
}
