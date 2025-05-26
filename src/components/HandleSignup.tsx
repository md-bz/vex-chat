"use client";
import { useUsers } from "@/lib/hooks";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import { ConvexError } from "convex/values";
import { Authenticated } from "convex/react";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardTitle,
} from "./ui/card";

export default function HandleSignup() {
    return (
        <Authenticated>
            <HandleSignupMain />
        </Authenticated>
    );
}

function HandleSignupMain() {
    const { createUser, getMe } = useUsers();
    const router = useRouter();
    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const me = getMe(false);

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
                router.replace("/chat");
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
        <Card className="w-full max-w-md p-5">
            <CardTitle>Welcome to Vex Chat</CardTitle>
            <CardDescription>Enter name and username</CardDescription>
            <CardContent>
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
            </CardContent>
            <CardFooter>
                <Button
                    onClick={handleJoin}
                    className="w-full"
                    // disabled={!name.trim() || isLoading}
                >
                    {isLoading ? "Joining..." : "Join Chat"}
                </Button>
            </CardFooter>
        </Card>
    );
}
