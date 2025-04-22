"use client";

import React from "react";

import { useChatStore } from "@/lib/store";
import { useChannels } from "@/lib/hooks";
import { useUsers } from "@/lib/hooks";
import { ChatInput } from "./chat/ChatInput";
import ChatTopBar from "./chat/ChatTopBar";
import { ChatMessages } from "./chat/ChatMessages";

export default function ChatArea() {
    const { currentChannel } = useChatStore();
    const { getChannel } = useChannels();

    const { getMe } = useUsers();
    const me = getMe();

    let channelInfo = getChannel(currentChannel?._id || undefined);

    if (!currentChannel) {
        return (
            <div className="flex-1 flex items-center justify-center not-md:hidden">
                <p className="text-muted-foreground">
                    Select a channel to start chatting
                </p>
            </div>
        );
    }
    channelInfo = {
        //@ts-ignore
        _id: null,
        type: currentChannel.type,
        name: currentChannel.name,
        members: [],
        canSendMessage: true,
    };

    if (!me || !channelInfo) return null;
    return (
        <div className="flex-1 flex flex-col h-full bg-background">
            <ChatTopBar channelInfo={channelInfo} />

            <ChatMessages me={me} channelInfo={channelInfo} />

            {channelInfo.canSendMessage && <ChatInput />}
        </div>
    );
}
