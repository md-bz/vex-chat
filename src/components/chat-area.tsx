"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatStore } from "@/lib/store";
import { useMessages } from "@/lib/hooks";
import { HashIcon, MessageCircleIcon, UsersIcon, SendIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useUsers } from "@/lib/hooks";

export default function ChatArea() {
    const [messageText, setMessageText] = useState("");
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const { currentChannel } = useChatStore();
    const { messages, sendMessage } = useMessages(currentChannel?._id || null);
    const { getMe } = useUsers();
    const me = getMe();

    useEffect(() => {
        if (scrollAreaRef.current) {
            const scrollContainer = scrollAreaRef.current;
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = () => {
        if (messageText.trim() && currentChannel) {
            sendMessage({
                channelId: currentChannel._id,
                text: messageText,
                timestamp: new Date().toISOString(),
            });
            setMessageText("");
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    if (!currentChannel) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <p className="text-muted-foreground">
                    Select a channel to start chatting
                </p>
            </div>
        );
    }

    const getChannelIcon = () => {
        switch (currentChannel.type) {
            case "channel":
                return <HashIcon className="h-5 w-5" />;
            case "group":
                return <UsersIcon className="h-5 w-5" />;
            case "private":
                return <MessageCircleIcon className="h-5 w-5" />;
            default:
                return null;
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full overflow-scroll bg-background">
            <div className="px-6 py-4 border-b bg-card">
                <div className="flex items-center">
                    {getChannelIcon()}
                    <h2 className="ml-2 font-semibold">
                        {currentChannel.name}
                    </h2>
                </div>
            </div>

            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                <div className="space-y-4">
                    {messages.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No messages yet. Be the first to send a message!
                        </div>
                    ) : (
                        messages.map((message) => (
                            <div
                                key={message._id}
                                className={`flex ${message.userId === me?._id ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`flex max-w-[70%] ${message.userId === me?._id ? "flex-row-reverse" : "flex-row"}`}
                                >
                                    <Avatar
                                        className={
                                            message.userId === me?._id
                                                ? "ml-2"
                                                : "mr-2"
                                        }
                                    >
                                        <AvatarFallback>
                                            {message.userId
                                                .substring(0, 2)
                                                .toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="flex items-baseline gap-2">
                                            <p
                                                className={`text-sm font-medium ${message.userId === me?._id ? "text-right" : ""}`}
                                            >
                                                {message.user?.name}
                                            </p>
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(
                                                    message.timestamp
                                                ).toLocaleTimeString([], {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </span>
                                        </div>
                                        <div
                                            className={`mt-1 rounded-lg px-4 py-2 ${
                                                message.userId === me?._id
                                                    ? "bg-primary text-primary-foreground"
                                                    : "bg-muted"
                                            }`}
                                        >
                                            <p className="text-sm">
                                                {message.text}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>

            <div className="p-4 border-t">
                <div className="flex gap-2">
                    <Input
                        placeholder={`Message ${currentChannel.name}...`}
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-1"
                    />
                    <Button
                        onClick={handleSendMessage}
                        disabled={!messageText.trim()}
                    >
                        <SendIcon className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
