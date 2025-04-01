"use client";

import type React from "react";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Clock } from "lucide-react";
import { DialogTitle } from "@radix-ui/react-dialog";
import { User } from "@/lib/types";

// Define the Id type to match Convex's Id type
type Id<T extends string> = { id: string; tableName: T };

interface UserInfoProps {
    user: User;
    children?: React.ReactNode;
}

export default function UserInfoPopup({ user, children }: UserInfoProps) {
    const [open, setOpen] = useState(false);

    if (!user) {
        return null;
    }
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <div className="hover:cursor-pointer">{children}</div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        <div className="flex flex-row items-center gap-4 pb-2">
                            <div className="relative">
                                <Avatar className="h-16 w-16">
                                    <AvatarImage
                                        src={user.imageUrl}
                                        alt={user.name}
                                    />
                                    <AvatarFallback>
                                        {user.name
                                            .substring(0, 2)
                                            .toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                            <div className="flex flex-col">
                                <h3 className="text-xl font-semibold">
                                    {user.name}
                                </h3>
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <Clock className="mr-1 h-3 w-3" />
                                    <span>Last seen {user.lastSeen}</span>
                                </div>
                            </div>
                        </div>
                    </DialogTitle>
                </DialogHeader>
                <div className="w-full border-0 shadow-none">
                    <div className="space-y-2 pt-0">
                        <div className="flex items-center gap-2">
                            <Badge
                                variant="outline"
                                className="px-2 py-1 text-xs"
                            >
                                ID: {String(user._id)}
                            </Badge>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
