"use client";

import { useState } from "react";
import { Copy, Check, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ChannelIcon } from "./ui/channel-icon";
import { User } from "@/lib/types";
import { UserCard } from "./UserCard";
import { useChannels } from "@/lib/hooks";
import { useAuth } from "@clerk/nextjs";
import { Id } from "../../convex/_generated/dataModel";

interface ChannelInfoPopupProps {
    id: Id<"channels">;
    name: string;
    type: "channel" | "group" | "private";
    createdAt: string | number;
    members: User[] | undefined;
    inviteLink?: string;
    children: React.ReactNode;
    isAdmin?: boolean;
}

export default function ChannelInfoPopup({
    id,
    name,
    type,
    createdAt,
    members = [],
    inviteLink,
    children,
    isAdmin = false,
}: ChannelInfoPopupProps) {
    const [copied, setCopied] = useState(false);
    const [open, setOpen] = useState(false);
    const [generatingLink, setGeneratingLink] = useState(false);
    const domain = window.location.host;

    const [currentInviteLink, setCurrentInviteLink] = useState(
        `https://${domain}/join/${inviteLink}`
    );
    const { createChannelLink } = useChannels();
    const { userId } = useAuth();

    const copyInviteLink = () => {
        if (!currentInviteLink) return;
        navigator.clipboard.writeText(currentInviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const generateInviteLink = async () => {
        if (!userId) return;
        setGeneratingLink(true);
        try {
            const newLink = await createChannelLink(id);
            setCurrentInviteLink(newLink);
        } catch (error) {
            console.error("Failed to create invite link:", error);
        } finally {
            setGeneratingLink(false);
        }
    };

    const getChannelTypeLabel = () => {
        switch (type) {
            case "channel":
                return "Public Channel";
            case "group":
                return "Group Chat";
            case "private":
                return "Private Message";
            default:
                return "Unknown";
        }
    };

    const formatCreationTime = () => {
        const date = new Date(createdAt).toDateString();

        return <>{date.toString()}</>;
    };

    const showInviteSection = type !== "private" && isAdmin;
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button className="hover:bg-accent hover:text-accent-foreground p-2 rounded-md transition-colors">
                    {children}
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ChannelIcon type={type} />
                        <span>{name}</span>
                        <Badge variant="outline" className="ml-2">
                            {getChannelTypeLabel()}
                        </Badge>
                    </DialogTitle>
                    <DialogDescription>
                        Created {formatCreationTime()}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {showInviteSection && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-medium">Invite Link</h3>
                            {inviteLink ? (
                                <div className="flex items-center space-x-2">
                                    <div className="bg-muted p-2 rounded-md text-xs flex-1 truncate">
                                        {currentInviteLink}
                                    </div>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    size="icon"
                                                    variant="outline"
                                                    onClick={copyInviteLink}
                                                >
                                                    {copied ? (
                                                        <Check className="h-4 w-4" />
                                                    ) : (
                                                        <Copy className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>
                                                    {copied
                                                        ? "Copied!"
                                                        : "Copy invite link"}
                                                </p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            ) : (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={generateInviteLink}
                                    disabled={generatingLink}
                                    className="w-full"
                                >
                                    {generatingLink ? (
                                        "Generating..."
                                    ) : (
                                        <>
                                            <LinkIcon className="h-4 w-4 mr-2" />
                                            Create Invite Link
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    )}

                    <div className="space-y-2">
                        <h3 className="text-sm font-medium">
                            Members ({members?.filter(Boolean).length || 0})
                        </h3>
                        <Separator />
                        <ScrollArea className="pr-4 h-5/6">
                            <div className="space-y-2">
                                {members
                                    ?.filter(Boolean)
                                    .map((member) => (
                                        <UserCard
                                            user={member}
                                            key={member._id}
                                        />
                                    ))}
                            </div>
                        </ScrollArea>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
