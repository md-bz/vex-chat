"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { useUsers } from "@/lib/hooks";

export default function Home() {
    const [username, setUsername] = useState("");
    const router = useRouter();
    const { users, createUser } = useUsers();

    const handleJoin = async () => {
        if (username.trim()) {
            // Create or get the user in Convex
            await createUser(username.trim());

            // Store username in localStorage for simplicity
            localStorage.setItem("username", username.trim());
            router.push("/chat");
        }
    };

    const handleSelectUser = (selectedUser: string) => {
        setUsername(selectedUser);
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Welcome to ConvexChat</CardTitle>
                    <CardDescription>
                        Enter a username to start chatting. No sign-up required!
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <Input
                                placeholder="Enter username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="mb-2"
                            />
                        </div>
                        <div>
                            <h3 className="text-sm font-medium mb-2">
                                Or select an existing user:
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {users.map((user) => (
                                    <Button
                                        key={user.id}
                                        variant={
                                            username === user.name
                                                ? "default"
                                                : "outline"
                                        }
                                        size="sm"
                                        onClick={() =>
                                            handleSelectUser(user.name)
                                        }
                                    >
                                        {user.name}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button
                        onClick={handleJoin}
                        className="w-full"
                        disabled={!username.trim()}
                    >
                        Join Chat
                    </Button>
                </CardFooter>
            </Card>
        </main>
    );
}
