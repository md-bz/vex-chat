"use client";
import { useUsers } from "@/lib/hooks";
import { redirect, useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

export default function HandleUsername() {
    const { createUser, getMe } = useUsers();
    const router = useRouter();

    try {
        const me = getMe();
        if (me?._id) {
            router.push("/chat");
        }
    } catch (e) {}

    const [username, setUsername] = useState("");

    const handleJoin = async () => {
        if (username.trim()) {
            // Create or get the user in Convex
            const user = await createUser(username.trim());
            if (user) return redirect("/chat");
            //todo: handle error
        }
    };
    return (
        <div className="space-y-4">
            <div>
                <Input
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="mb-2"
                />
            </div>
            <Button
                onClick={handleJoin}
                className="w-full"
                disabled={!username.trim()}
            >
                Join Chat
            </Button>
        </div>
    );
}
