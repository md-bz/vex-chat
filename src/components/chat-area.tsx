"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { useChatStore } from "@/lib/store";
import { formatTime } from "@/lib/utils";
import { useChannels, useMessages } from "@/lib/hooks";
import { SendIcon, Check, CheckCheck, EyeIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useUsers } from "@/lib/hooks";
import ChannelInfoPopup from "./ChannelInfoPopup";
import { ChannelIcon } from "./ui/channel-icon";
import UserInfoPopup from "./UserInfoPopup";
import { User } from "@/lib/types";
import { useDebouncedCallback } from "use-debounce";
import UserProfile from "./UserProfile";
import parse, { DOMNode, domToReact } from "html-react-parser";
import { BackIcon } from "./ui/back-icon";
import { Id } from "../../convex/_generated/dataModel";
import JoinChannel from "./JoinChannel";

export default function ChatArea() {
    const [messageText, setMessageText] = useState("");
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
    const lastSeenMessageTimeRef = useRef<number>(0);

    const { selectChannel, currentChannel } = useChatStore();
    const { messages, sendMessage } = useMessages(currentChannel?._id || null);
    const { getChannel, createChannel, seenChannel, getChannelLastSeen } =
        useChannels();

    const { getMe } = useUsers();
    const me = getMe();
    let channelInfo = getChannel(currentChannel?._id || undefined);

    const lastSeenData = getChannelLastSeen(currentChannel?._id || undefined);

    useEffect(() => {
        if (scrollAreaRef.current) {
            const scrollContainer = scrollAreaRef.current;
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
    }, [messages]);

    const debouncedSeenChannel = useDebouncedCallback(
        (channelId: Id<"channels">, lastSeenAt: number) => {
            if (lastSeenAt > lastSeenMessageTimeRef.current) {
                lastSeenMessageTimeRef.current = lastSeenAt;
                seenChannel(lastSeenAt, channelId);
            }
        },
        300
    );
    useEffect(() => {
        if (!currentChannel?._id || !me?._id) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const messageId =
                            entry.target.getAttribute("data-message-id");
                        const message = messages.find(
                            (m) => m._id === messageId
                        );
                        if (
                            message &&
                            message.userId !== me._id &&
                            currentChannel?._id
                        ) {
                            debouncedSeenChannel(
                                currentChannel._id,
                                message._creationTime
                            );
                        }
                    }
                });
            },
            { root: scrollAreaRef.current, threshold: 0.5 }
        );

        const currentMap = messageRefs.current;
        currentMap.forEach((node) => observer.observe(node));

        return () => {
            currentMap.forEach((node) => observer.unobserve(node));
            debouncedSeenChannel.cancel(); // Cleanup debounce
        };
    }, [messages, currentChannel?._id]);

    if (!currentChannel) {
        return;
    }

    if (!channelInfo) {
        channelInfo = {
            type: currentChannel.type,
            name: currentChannel.name,
            members: [
                // @ts-ignore
                { name: currentChannel.name, _id: currentChannel.userId },
            ],
            canSendMessage: true,
        };
    }

    const handleSendMessage = async () => {
        if (!messageText.trim() || !currentChannel) return;
        if (currentChannel._id === null) {
            if (!currentChannel.userId) return;
            const id = await createChannel(currentChannel.name, "private", [
                currentChannel.userId,
            ]);
            currentChannel._id = id;
        }

        sendMessage({
            channelId: currentChannel._id,
            text: messageText,
            timestamp: new Date().toISOString(),
        });
        setMessageText("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const getMessageStatus = (message: {
        _id: Id<"messages">;
        _creationTime: number;
        userId: Id<"users">;
    }) => {
        if (!lastSeenData) return null;
        if (channelInfo?.type === "channel")
            return (
                <>
                    <span>
                        {
                            lastSeenData.filter(
                                (lastSeen) =>
                                    lastSeen.lastSeenAt >= message._creationTime
                            ).length
                        }
                    </span>
                    <EyeIcon className="h-4 w-4" />
                </>
            );

        if (message.userId !== me?._id) return null;

        const seenByOther = lastSeenData.find(
            (seen) =>
                seen?.userId !== me?._id &&
                seen?.lastSeenAt &&
                seen?.lastSeenAt >= message._creationTime
        );

        return seenByOther ? (
            <CheckCheck className="h-3 w-3 ml-1 text-blue-500" />
        ) : (
            <Check className="h-3 w-3 ml-1 text-muted-foreground" />
        );
    };

    const options = {
        replace: (domNode: DOMNode) => {
            if (domNode.type === "tag" && domNode.name === "a") {
                const domain = window.location.host;
                const href = domNode.attribs.href;
                const joinLinkMatch = href.match(`/${domain}\/join\/([^\/]+)`);
                if (joinLinkMatch) {
                    const inviteLink = joinLinkMatch[1];
                    return <JoinChannel inviteLink={inviteLink} text={href} />;
                }
                return (
                    <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 underline"
                    >
                        {domToReact(domNode.children as DOMNode[])}
                    </a>
                );
            }
        },
    };

    if (!currentChannel) {
        return (
            <div className="flex-1 flex items-center justify-center not-md:hidden">
                <p className="text-muted-foreground">
                    Select a channel to start chatting
                </p>
            </div>
        );
    }

    function ChannelTopInfo() {
        if (!channelInfo) {
            return null;
        }
        if (channelInfo.type !== "private") {
            return (
                <ChannelInfoPopup
                    id={channelInfo._id}
                    name={channelInfo.name}
                    type={channelInfo.type}
                    createdAt={channelInfo.createdAt}
                    members={channelInfo.members as User[]}
                    isAdmin={channelInfo.isAdmin}
                    inviteLink={channelInfo.link}
                >
                    <div className="flex items-center space-x-2">
                        <ChannelIcon type={channelInfo.type} />
                        <h2 className="ml-2 font-semibold">
                            {currentChannel?.name}
                        </h2>
                    </div>
                </ChannelInfoPopup>
            );
        }

        const otherUser = channelInfo.members?.find(
            (user) => user?._id !== me?._id
        ) as User;

        return (
            <UserInfoPopup user={otherUser}>
                <UserProfile user={otherUser} />
            </UserInfoPopup>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-background">
            <div className="px-3 py-4 border-b bg-card h-[70px] flex align-center">
                <div className="flex items-center">
                    <button
                        onClick={() => selectChannel(null)}
                        className="mr-3 md:hidden"
                    >
                        <BackIcon />
                    </button>
                    <ChannelTopInfo />
                </div>
            </div>

            <ScrollArea
                className="flex-1 p-4 overflow-y-scroll h-20"
                ref={scrollAreaRef}
            >
                {messages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        No messages yet. Be the first to send a message!
                    </div>
                ) : (
                    messages.map((message, index) => {
                        // Check if we need to show a date separator
                        const showDateSeparator =
                            index === 0 ||
                            formatTime(messages[index - 1].timestamp, true) !==
                                formatTime(message.timestamp, true);

                        return (
                            <React.Fragment key={message._id}>
                                {showDateSeparator && (
                                    <div className="sticky top-0.25 flex justify-center my-6">
                                        <div className="bg-muted text-muted-foreground text-xs px-3 py-1 rounded-full">
                                            {formatTime(
                                                message.timestamp,
                                                true
                                            )}
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <div
                                        ref={(node) => {
                                            if (node) {
                                                messageRefs.current.set(
                                                    message._id,
                                                    node
                                                );
                                            } else {
                                                messageRefs.current.delete(
                                                    message._id
                                                );
                                            }
                                        }}
                                        data-message-id={message._id}
                                        className={`flex ${message.userId === me?._id ? "justify-end" : "justify-start"}`}
                                    >
                                        <div
                                            className={`flex max-w-[70%] ${message.userId === me?._id ? "flex-row-reverse" : "flex-row"}`}
                                        >
                                            {channelInfo?.type !== "private" &&
                                                message.userId !== me?._id && (
                                                    <UserInfoPopup
                                                        user={
                                                            message.user as User
                                                        }
                                                    >
                                                        <Avatar
                                                            className={
                                                                message.userId ===
                                                                me?._id
                                                                    ? "ml-2"
                                                                    : "mr-2"
                                                            }
                                                        >
                                                            <AvatarFallback>
                                                                {message.userId
                                                                    .substring(
                                                                        0,
                                                                        2
                                                                    )
                                                                    .toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    </UserInfoPopup>
                                                )}

                                            <div>
                                                {channelInfo?.type !==
                                                    "private" &&
                                                    message.userId !==
                                                        me?._id && (
                                                        <div className="flex items-baseline gap-2 text-start justify-start">
                                                            <p
                                                                className={`text-sm font-medium`}
                                                            >
                                                                {
                                                                    message.user
                                                                        ?.name
                                                                }
                                                            </p>
                                                        </div>
                                                    )}
                                                <div
                                                    className={`mt-1 rounded-lg px-4 py-2 ${
                                                        message.userId ===
                                                        me?._id
                                                            ? "bg-primary text-primary-foreground"
                                                            : "bg-muted"
                                                    }`}
                                                >
                                                    <p className="text-sm">
                                                        {parse(
                                                            message.text,
                                                            options
                                                        )}
                                                    </p>
                                                </div>
                                                <div
                                                    className={`text-xs text-muted-foreground flex items-center gap-1 ${message.userId === me?._id ? "justify-end" : "justify-start"}`}
                                                >
                                                    {getMessageStatus(message)}
                                                    {new Date(
                                                        message.timestamp
                                                    ).toLocaleTimeString([], {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </React.Fragment>
                        );
                    })
                )}
            </ScrollArea>

            {channelInfo?.canSendMessage && (
                <div className="p-1">
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
            )}
        </div>
    );
}
