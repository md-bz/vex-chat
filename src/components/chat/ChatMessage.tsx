import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Channel, Message, User } from "@/lib/types";
import UserInfoPopup, { UserInfoPopupFromUsername } from "../UserInfoPopup";
import parse, { DOMNode, domToReact } from "html-react-parser";
import { useChannels, useMessages } from "@/lib/hooks";
import { useChatStore } from "@/lib/store";
import { Check, CheckCheck, EyeIcon, Reply } from "lucide-react";
import JoinChannel from "../JoinChannel";
import { formatTime } from "@/lib/utils";

export default function ChatMessage({
    channelInfo,
    message,
    me,
    showDateSeparator,
    messageRefs,
}: {
    channelInfo?: Channel;
    message: Message;
    me: User;
    showDateSeparator: boolean;
    messageRefs: React.RefObject<Map<string, HTMLDivElement>>;
}) {
    const { getChannelLastSeen } = useChannels();
    const { currentChannel } = useChatStore();

    const lastSeenData = getChannelLastSeen(currentChannel?._id || undefined);

    const getMessageStatus = (message: Message) => {
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
            if (domNode.type === "text") {
                const text = domNode.data;
                const mentionMatch = text.match(/@(\w+)/);
                if (mentionMatch) {
                    const username = mentionMatch[1];
                    return (
                        <UserInfoPopupFromUsername username={username}>
                            <p className="text-blue-500">{text}</p>
                        </UserInfoPopupFromUsername>
                    );
                }
            }
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

    return (
        <>
            {showDateSeparator && (
                <div className="sticky top-0.25 flex justify-center my-6">
                    <div className="bg-muted text-muted-foreground text-xs px-3 py-1 rounded-full">
                        {formatTime(message.timestamp, true)}
                    </div>
                </div>
            )}
            <div>
                <div
                    ref={(node) => {
                        if (node) {
                            messageRefs.current.set(message._id, node);
                        } else {
                            messageRefs.current.delete(message._id);
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
                                <UserInfoPopup user={message.user as User}>
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
                                </UserInfoPopup>
                            )}

                        <div>
                            {channelInfo?.type !== "private" &&
                                message.userId !== me?._id && (
                                    <div className="flex items-baseline gap-2 text-start justify-start">
                                        <p className={`text-sm font-medium`}>
                                            {message.user?.name}
                                        </p>
                                    </div>
                                )}
                            <div
                                className={`mt-1 rounded-lg px-4 py-2 ${
                                    message.userId === me?._id
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted"
                                }`}
                            >
                                {message.repliedMessage && (
                                    <div className="mb-2 text-xs border-l-2 pl-2 cursor-pointer hover:opacity-80">
                                        <>
                                            <div className="flex items-center gap-1 text-muted-foreground">
                                                <Reply className="h-3 w-3" />
                                                <span>Reply to</span>
                                            </div>
                                            <div className="line-clamp-1">
                                                {parse(
                                                    message.repliedMessage
                                                        .text || "",
                                                    options
                                                )}
                                            </div>
                                        </>
                                    </div>
                                )}
                                <div className="text-sm">
                                    {parse(message.text, options)}
                                </div>
                            </div>
                            <div
                                className={`text-xs text-muted-foreground flex items-center gap-1 ${message.userId === me?._id ? "justify-end" : "justify-start"}`}
                            >
                                {getMessageStatus(message)}
                                {new Date(message.timestamp).toLocaleTimeString(
                                    [],
                                    {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    }
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
