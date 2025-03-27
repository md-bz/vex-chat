"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { useUsers } from "@/lib/hooks";
import { SignedIn, SignedOut, SignIn, useUser } from "@clerk/nextjs";

export default function Home() {
    const [username, setUsername] = useState("");
    const router = useRouter();
    const { createUser, getMe } = useUsers();
    const { isSignedIn } = useUser();
    if (isSignedIn) {
        try {
            const me = getMe();
            if (me) router.push("/chat");
        } catch (e) {}
    }

    const handleJoin = async () => {
        if (username.trim()) {
            // Create or get the user in Convex
            const user = await createUser(username.trim());
            if (user) return router.push("/chat");
            //todo: handle error
        }
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Welcome to ConvexChat</CardTitle>
                    <CardDescription>
                        Sign in to start chatting.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                    <SignedOut>
                        <SignIn fallbackRedirectUrl="/" />
                    </SignedOut>
                    <SignedIn>
                        <div className="space-y-4">
                            <div>
                                <Input
                                    placeholder="Enter username"
                                    value={username}
                                    onChange={(e) =>
                                        setUsername(e.target.value)
                                    }
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
                    </SignedIn>
                </CardContent>
            </Card>
        </main>
    );
}
