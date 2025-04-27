"use client";

import { useState } from "react";

import { useChatStore } from "@/lib/store";
import { useChannels } from "@/lib/hooks";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { ConvexError } from "convex/values";

export default function JoinChannel({
    inviteLink,
    text,
    children,
}: {
    inviteLink: string;
    text?: string;
    children?: React.ReactNode;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [status, setStatus] = useState<{
        type: "success" | "error" | null;
        message: string;
    }>({ type: null, message: "" });

    const { joinChannel } = useChannels();
    const { selectChannel } = useChatStore();

    const handleJoinChannel = async () => {
        const linkToUse = inviteLink.trim();
        if (!linkToUse) return;

        setStatus({ type: null, message: "" });

        try {
            const channel = await joinChannel(linkToUse);

            if (channel) {
                selectChannel({
                    _id: channel._id,
                    name: channel.name,
                    type: "channel",
                });
                setStatus({
                    type: "success",
                    message: `Successfully joined ${channel.name}`,
                });
                setTimeout(() => setIsOpen(false), 1500); // Auto-close on success
            }
        } catch (error: any) {
            const errorMessage =
                error instanceof ConvexError
                    ? (error.data as string)
                    : "Unexpected error occurred";
            setStatus({
                type: "error",
                message: errorMessage,
            });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children || (
                    <span
                        className="text-blue-500 underline cursor-pointer"
                        onClick={handleJoinChannel}
                    >
                        {text || inviteLink}
                    </span>
                )}
            </DialogTrigger>

            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Join Channel</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {status.type && (
                        <Alert
                            variant={
                                status.type === "success"
                                    ? "default"
                                    : "destructive"
                            }
                        >
                            {status.type === "success" ? (
                                <CheckCircle2 className="h-4 w-4" />
                            ) : (
                                <AlertCircle className="h-4 w-4" />
                            )}
                            <AlertTitle className="flex items-center gap-2">
                                {status.type === "success"
                                    ? "Success!"
                                    : "Error"}
                            </AlertTitle>
                            <AlertDescription>
                                {status.message}
                            </AlertDescription>
                        </Alert>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
