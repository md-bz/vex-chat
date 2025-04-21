"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { useChatStore } from "@/lib/store";
import { formatTime } from "@/lib/utils";
import { useChannels, useMessages } from "@/lib/hooks";
import { Skeleton } from "./ui/skeleton";
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
import { Spinner } from "./ui/loading";

export default function ChatArea() {
    const [messageText, setMessageText] = useState("");
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
    const lastSeenMessageTimeRef = useRef<number>(0);
    const prevMessagesStatusRef = useRef<
        "LoadingFirstPage" | "CanLoadMore" | "LoadingMore" | "Exhausted" | null
    >(null);

    const { selectChannel, currentChannel } = useChatStore();
    const { loadMoreMessages, messagesStatus, messages, sendMessage } =
        useMessages(currentChannel?._id || null);

    const { getChannel, createChannel, seenChannel, getChannelLastSeen } =
        useChannels();

    const { getMe } = useUsers();
    const me = getMe();
    let channelInfo = getChannel(currentChannel?._id || undefined);

    const lastSeenData = getChannelLastSeen(currentChannel?._id || undefined);

    const debouncedSeenChannel = useDebouncedCallback(
        (channelId: Id<"channels">, lastSeenAt: number) => {
            if (lastSeenAt > lastSeenMessageTimeRef.current) {
                lastSeenMessageTimeRef.current = lastSeenAt;
                seenChannel(lastSeenAt, channelId);
            }
        },
        300
    );

    // Handle scroll to load more messages
    const handleScroll = useCallback(
        (event: React.UIEvent<HTMLDivElement>) => {
            const scrollTop = event.currentTarget.scrollTop;
            // If we're near the top of the scroll area and can load more messages
            if (scrollTop < 50 && messagesStatus === "CanLoadMore") {
                loadMoreMessages(100);
            }
        },
        [loadMoreMessages, messagesStatus]
    );

    // Scroll to bottom when initial messages are loaded or new message is received
    useEffect(() => {
        // Case 1: Initial load completed - scroll to bottom
        if (
            prevMessagesStatusRef.current === "LoadingFirstPage" &&
            messagesStatus !== "LoadingFirstPage" &&
            scrollAreaRef.current
        ) {
            scrollAreaRef.current.scrollTop =
                scrollAreaRef.current.scrollHeight;
        }

        // Case 2: New message received (not during LoadingMore) - scroll to bottom
        if (
            prevMessagesStatusRef.current !== "LoadingMore" &&
            messagesStatus !== "LoadingMore" &&
            scrollAreaRef.current
        ) {
            scrollAreaRef.current.scrollTop =
                scrollAreaRef.current.scrollHeight;
        }

        prevMessagesStatusRef.current = messagesStatus;
    }, [messagesStatus, messages]);

    useEffect(() => {
        if (
            !currentChannel?._id ||
            !me?._id ||
            !messages ||
            messages.length === 0
        )
            return;

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
                onScroll={handleScroll}
            >
                {messagesStatus === "LoadingMore" && (
                    <div className="flex justify-center py-2">
                        <Spinner size="small" />
                    </div>
                )}
                {messagesStatus === "LoadingFirstPage" ? (
                    <div className="flex flex-col gap-4">
                        {[...Array(6)].map((_, i) => {
                            const isOdd = i % 2 === 0;
                            return (
                                <div
                                    className="flex justify-between gap-1"
                                    key={i}
                                >
                                    {!isOdd && (
                                        <Skeleton className="h-8 w-8 rounded-2xl" />
                                    )}
                                    <div
                                        className={`flex flex-1 gap-3 ${isOdd ? "justify-end" : "justify-start"} `}
                                    >
                                        <div className="flex flex-col gap-2 w-3/7">
                                            <Skeleton className="h-8" />
                                            <Skeleton
                                                className={`h-2 w-1/2 ${isOdd ? "self-end" : ""}`}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                        <span>No messages yet</span>
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
