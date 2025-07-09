"use client";

import { useState } from "react";
import { LinkIcon, Trash2Icon } from "lucide-react";
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "./ui/alert-dialog";

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

    const [isConfirmRevokeLinkOpen, setIsConfirmRevokeLinkOpen] =
        useState(false);

    const { createChannelLink, revokeChannelLink } = useChannels();
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

    const handleRevokeLink = async () => {
        try {
            if (!inviteLink) return;
            await revokeChannelLink(inviteLink);
        } catch (error) {
            console.error("Failed to revoke invite link:", error);
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
                                <div className="flex items-center space-x-2 justify-between not-sm:max-w-[85%]">
                                    <div className="bg-muted p-2 rounded-md text-xs flex-1 truncate">
                                        {currentInviteLink}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Copyable
                                            value={currentInviteLink}
                                            tooltipCopy="Copy invite link"
                                            tooltipCopied="Copied!"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            onClick={() =>
                                                setIsConfirmRevokeLinkOpen(true)
                                            }
                                        >
                                            <Trash2Icon className="h-4 w-4" />
                                        </Button>
                                    </div>
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
                {/* Revoke link Confirmation Dialog */}
                <AlertDialog
                    open={isConfirmRevokeLinkOpen}
                    onOpenChange={setIsConfirmRevokeLinkOpen}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will revoke the link.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleRevokeLink}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                Revoke
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </DialogContent>
        </Dialog>
    );
}
