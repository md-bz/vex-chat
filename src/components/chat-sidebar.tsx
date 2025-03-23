"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRouter } from "next/navigation";
import { HashIcon, MessageCircleIcon, UsersIcon, PlusIcon } from "lucide-react";
import { useChatStore } from "@/lib/store";
import { useChannels, useUsers } from "@/lib/hooks";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface ChatSidebarProps {
    username: string;
}

export default function ChatSidebar({ username }: ChatSidebarProps) {
    const router = useRouter();
    const { currentChannel, selectChannel } = useChatStore();
    const { channels, groups, directMessages, createChannel } = useChannels();
    const { updateLastSeen } = useUsers();

    const [newChannelName, setNewChannelName] = useState("");
    const [newGroupName, setNewGroupName] = useState("");
    const [newDmUser, setNewDmUser] = useState("");
    const [isChannelDialogOpen, setIsChannelDialogOpen] = useState(false);
    const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
    const [isDmDialogOpen, setIsDmDialogOpen] = useState(false);

    // Update user's last seen timestamp
    useEffect(() => {
        if (username) {
            updateLastSeen(username);
            const interval = setInterval(() => updateLastSeen(username), 60000); // Update every minute
            return () => clearInterval(interval);
        }
    }, [username, updateLastSeen]);

    const handleLogout = () => {
        localStorage.removeItem("username");
        router.push("/");
    };

    const handleCreateChannel = async () => {
        if (newChannelName.trim()) {
            await createChannel(newChannelName.trim(), "channel");
            setNewChannelName("");
            setIsChannelDialogOpen(false);
        }
    };

    const handleCreateGroup = async () => {
        if (newGroupName.trim()) {
            await createChannel(newGroupName.trim(), "group", [username]);
            setNewGroupName("");
            setIsGroupDialogOpen(false);
        }
    };

    const handleCreateDm = async () => {
        if (newDmUser.trim()) {
            await createChannel(newDmUser.trim(), "dm", [
                username,
                newDmUser.trim(),
            ]);
            setNewDmUser("");
            setIsDmDialogOpen(false);
        }
    };

    return (
        <div className="w-64 h-full bg-primary-foreground flex flex-col">
            <div className="p-4 border-b border-primary/10">
                <h1 className="text-xl font-bold">ConvexChat</h1>
                <div className="flex items-center mt-2">
                    <div className="h-3 w-3 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm">{username}</span>
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-4">
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-sm font-semibold uppercase tracking-wider">
                                Channels
                            </h2>
                            <Dialog
                                open={isChannelDialogOpen}
                                onOpenChange={setIsChannelDialogOpen}
                            >
                                <DialogTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 rounded-sm"
                                    >
                                        <PlusIcon className="h-4 w-4" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>
                                            Create a new channel
                                        </DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 pt-4">
                                        <Input
                                            placeholder="Channel name"
                                            value={newChannelName}
                                            onChange={(e) =>
                                                setNewChannelName(
                                                    e.target.value
                                                )
                                            }
                                        />
                                        <Button onClick={handleCreateChannel}>
                                            Create Channel
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                        <div className="space-y-1">
                            {channels.map((channel) => (
                                <Button
                                    key={channel.id}
                                    variant="ghost"
                                    className={`w-full justify-start pl-2 ${currentChannel?.id === channel.id ? "bg-primary/20" : ""}`}
                                    onClick={() => selectChannel(channel)}
                                >
                                    <HashIcon className="h-4 w-4 mr-2" />
                                    {channel.name}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-sm font-semibold uppercase tracking-wider">
                                Groups
                            </h2>
                            <Dialog
                                open={isGroupDialogOpen}
                                onOpenChange={setIsGroupDialogOpen}
                            >
                                <DialogTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 rounded-sm"
                                    >
                                        <PlusIcon className="h-4 w-4" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>
                                            Create a new group
                                        </DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 pt-4">
                                        <Input
                                            placeholder="Group name"
                                            value={newGroupName}
                                            onChange={(e) =>
                                                setNewGroupName(e.target.value)
                                            }
                                        />
                                        <Button onClick={handleCreateGroup}>
                                            Create Group
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                        <div className="space-y-1">
                            {groups.map((group) => (
                                <Button
                                    key={group.id}
                                    variant="ghost"
                                    className={`w-full justify-start pl-2 ${currentChannel?.id === group.id ? "bg-primary/20" : ""}`}
                                    onClick={() => selectChannel(group)}
                                >
                                    <UsersIcon className="h-4 w-4 mr-2" />
                                    {group.name}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-sm font-semibold uppercase tracking-wider">
                                Direct Messages
                            </h2>
                            <Dialog
                                open={isDmDialogOpen}
                                onOpenChange={setIsDmDialogOpen}
                            >
                                <DialogTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 rounded-sm"
                                    >
                                        <PlusIcon className="h-4 w-4" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>
                                            Start a new conversation
                                        </DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 pt-4">
                                        <Input
                                            placeholder="Username"
                                            value={newDmUser}
                                            onChange={(e) =>
                                                setNewDmUser(e.target.value)
                                            }
                                        />
                                        <Button onClick={handleCreateDm}>
                                            Start Conversation
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                        <div className="space-y-1">
                            {directMessages.map((dm) => (
                                <Button
                                    key={dm.id}
                                    variant="ghost"
                                    className={`w-full justify-start pl-2 ${currentChannel?.id === dm.id ? "bg-primary/20" : ""}`}
                                    onClick={() => selectChannel(dm)}
                                >
                                    <MessageCircleIcon className="h-4 w-4 mr-2" />
                                    {dm.name}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>
            </ScrollArea>

            <div className="p-4 border-t border-primary/10">
                <Button
                    variant="secondary"
                    className="w-full"
                    onClick={handleLogout}
                >
                    Log out
                </Button>
            </div>
        </div>
    );
}
