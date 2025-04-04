"use client";

import type React from "react";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTrigger,
} from "@/components/ui/dialog";
import { DialogTitle } from "@radix-ui/react-dialog";
import { User } from "@/lib/types";
import UserProfile from "./UserProfile";
import { Button } from "./ui/button";
import { useChatStore } from "@/lib/store";

interface UserInfoProps {
    user: User;
    children?: React.ReactNode;
}

export default function UserInfoPopup({ user, children }: UserInfoProps) {
    const [open, setOpen] = useState(false);

    const { selectChannel } = useChatStore();

    const handleSendMessage = async () => {
        selectChannel({
            _id: null,
            name: user.name,
            type: "private",
            userId: user._id,
        });
        setOpen(false);
    };
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <div className="hover:cursor-pointer">{children}</div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        <UserProfile user={user} />
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
                <Button onClick={handleSendMessage}>send message</Button>
            </DialogContent>
        </Dialog>
    );
}
