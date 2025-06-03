"use client";

import { useState } from "react";
import { LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ChannelIcon } from "./ui/channel-icon";
import { User } from "@/lib/types";
import { UserCard } from "./UserCard";
import { useChannels } from "@/lib/hooks";
import { useAuth } from "@clerk/nextjs";
import { Id } from "../../convex/_generated/dataModel";
import Copyable from "./Copyable";

interface ChannelInfoPopupProps {
    id: Id<"channels"> | null;
    name: string;
    type: "channel" | "group" | "private";
    createdAt?: number;
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
    const [open, setOpen] = useState(false);
    const [generatingLink, setGeneratingLink] = useState(false);
    const domain = window.location.host;

    const [currentInviteLink, setCurrentInviteLink] = useState(
        `https://${domain}/join/${inviteLink}`
    );
    const { createChannelLink } = useChannels();
    const { userId } = useAuth();

    const generateInviteLink = async () => {
        if (!userId || !id) return;
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
        if (!createdAt) return <>Unknown creation time</>;
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
            <DialogContent className="max-w-md">
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
                                <div className="flex items-center space-x-2 justify-between not-sm:max-w-[95%]">
                                    <div className="bg-muted p-2 rounded-md text-xs flex-1 truncate">
                                        {currentInviteLink}
                                    </div>
                                    <Copyable
                                        value={currentInviteLink}
                                        tooltipCopy="Copy invite link"
                                        tooltipCopied="Copied!"
                                    />
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
