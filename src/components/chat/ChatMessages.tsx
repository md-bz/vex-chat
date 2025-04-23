import React, { useRef, useEffect, useCallback } from "react";

import { ScrollArea } from "@radix-ui/react-scroll-area";

import { useChatStore } from "@/lib/store";
import { formatTime } from "@/lib/utils";
import { useChannels, useMessages } from "@/lib/hooks";
import { useDebouncedCallback } from "use-debounce";
import { Id } from "../../../convex/_generated/dataModel";
import { Channel, User } from "@/lib/types";
import { Spinner } from "../ui/loading";
import { Skeleton } from "../ui/skeleton";
import ChatMessage from "./ChatMessage";

export function ChatMessages({
    me,
    channelInfo,
}: {
    me: User;
    channelInfo: Channel;
}) {
    const { currentChannel } = useChatStore();

    const { loadMoreMessages, messagesStatus, messages } = useMessages(
        currentChannel?._id || null
    );
    const { seenChannel } = useChannels();

    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
    const lastSeenMessageTimeRef = useRef<number>(0);
    const prevMessagesStatusRef = useRef<
        "LoadingFirstPage" | "CanLoadMore" | "LoadingMore" | "Exhausted" | null
    >(null);

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

    return (
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
            {currentChannel?._id && messagesStatus === "LoadingFirstPage" ? (
                <div className="flex flex-col gap-4">
                    {[...Array(6)].map((_, i) => {
                        const isOdd = i % 2 === 0;
                        return (
                            <div className="flex justify-between gap-1" key={i}>
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

                    if (!message || !me) return null;
                    return (
                        <ChatMessage
                            channelInfo={channelInfo}
                            message={message}
                            me={me}
                            showDateSeparator={showDateSeparator}
                            messageRefs={messageRefs}
                            key={message._id}
                        />
                    );
                })
            )}
        </ScrollArea>
    );
}
