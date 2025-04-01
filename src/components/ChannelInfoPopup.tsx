"use client";

import type React from "react";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

type Member = {
    _id: string;
    _creationTime: number;
    imageUrl?: string;
    lastSeen?: number;
    tokenIdentifier: string;
    name: string;
} | null;

interface ChannelInfoPopupProps {
    id: string;
    name: string;
    type: "channel" | "group" | "private";
    createdAt: string | number;
    members: Member[] | undefined;
    inviteLink: string;
    children: React.ReactNode;
}

export default function ChannelInfoPopup({
    id,
    name,
    type,
    createdAt,
    members = [],
    inviteLink,
    children,
}: ChannelInfoPopupProps) {
    const [copied, setCopied] = useState(false);
    const [open, setOpen] = useState(false);

    const copyInviteLink = () => {
        navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
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

                <div className="space-y-4 h">
                    {type !== "private" && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-medium">Invite Link</h3>
                            <div className="flex items-center space-x-2">
                                <div className="bg-muted p-2 rounded-md text-xs flex-1 truncate">
                                    {inviteLink}
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
                        </div>
                    )}

                    <div className=" space-y-2">
                        <h3 className="text-sm font-medium">
                            Members ({members?.filter(Boolean).length || 0})
                        </h3>
                        <Separator />
                        <ScrollArea className="pr-4 h-5/6">
                            <div className="space-y-2">
                                {members?.filter(Boolean).map((member) => (
                                    <div
                                        key={member?._id}
                                        className="flex items-center space-x-3 py-2"
                                    >
                                        <Avatar>
                                            {member?.imageUrl && (
                                                <AvatarImage
                                                    src={member.imageUrl}
                                                    alt={member.name}
                                                />
                                            )}
                                            <AvatarFallback>
                                                {member?.name
                                                    .substring(0, 2)
                                                    .toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm font-medium">
                                                {member?.name}
                                            </p>
                                            {member?.lastSeen && (
                                                <p className="text-xs text-muted-foreground">
                                                    Last seen
                                                    {new Date(
                                                        member.lastSeen
                                                    ).toString()}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
