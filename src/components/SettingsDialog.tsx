"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useUsers } from "@/lib/hooks";
import { ConvexError } from "convex/values";
import { Alert, AlertDescription } from "./ui/alert";
import { Spinner } from "./ui/loading";

export function SettingsDialog({ children }: { children: React.ReactNode }) {
    const { getMe, updateUserPreferences } = useUsers();
    const user = getMe();

    const [name, setName] = useState(user?.name || "");
    const [username, setUsername] = useState(user?.username || "");
    const [showLastSeen, setShowLastSeen] = useState(
        user?.showLastSeen ?? true
    );
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const [open, setOpen] = useState(false);

    const handleSave = async () => {
        setIsLoading(true);
        try {
            await updateUserPreferences(name, username, showLastSeen);
            setOpen(false);
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

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="space-y-4 py-4">
                <DialogHeader>
                    <DialogTitle>Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                        id="name"
                        value={name}
                        onChange={(e) => {
                            setName(e.target.value);
                            setError("");
                        }}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                        id="username"
                        value={username}
                        onChange={(e) => {
                            setUsername(e.target.value);
                            setError("");
                        }}
                    />
                </div>
                <div className="flex items-center justify-between">
                    <Label htmlFor="showLastSeen">Show Last Seen</Label>
                    <Switch
                        id="showLastSeen"
                        checked={showLastSeen}
                        onCheckedChange={setShowLastSeen}
                    />
                </div>
                {error && (
                    <Alert variant="destructive" className="mt-2">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                <Button onClick={handleSave} className="w-full">
                    {isLoading ? (
                        <Spinner className="text-primary-foreground h-6 w-6" />
                    ) : (
                        "Save settings"
                    )}
                </Button>
            </DialogContent>
        </Dialog>
    );
}
