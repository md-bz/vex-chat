import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export function useMessages(channelId: string | null) {
    // Convert string ID to Convex ID if it exists
    const convexChannelId = channelId ? (channelId as Id<"channels">) : null;

    // Query messages from Convex
    const messages =
        useQuery(
            api.messages.list,
            convexChannelId ? { channelId: convexChannelId } : "skip"
        ) || [];

    // Get the send message mutation
    const sendMessageMutation = useMutation(api.messages.send);

    const sendMessage = async (message: {
        channelId: string;
        channelType: string;
        text: string;
        sender: string;
        timestamp: string;
    }) => {
        if (!message.channelId) return;

        await sendMessageMutation({
            channelId: message.channelId as Id<"channels">,
            text: message.text,
            sender: message.sender,
        });
    };

    return {
        messages: messages.map((msg: any) => ({
            id: msg._id,
            channelId: msg.channelId,
            channelType: "channel", // This would come from the channel in a full implementation
            text: msg.text,
            sender: msg.sender,
            timestamp: new Date(msg.timestamp).toISOString(),
        })),
        sendMessage,
    };
}

export function useChannels() {
    const allChannels = useQuery(api.channels.getAll) || [];
    const createChannelMutation = useMutation(api.channels.create);

    const channels = allChannels.filter(
        (channel: any) => channel.type === "channel"
    );
    const groups = allChannels.filter(
        (channel: any) => channel.type === "group"
    );
    const directMessages = allChannels.filter(
        (channel: any) => channel.type === "dm"
    );

    const createChannel = async (
        name: string,
        type: string,
        members?: string[]
    ) => {
        await createChannelMutation({
            name,
            type,
            members,
        });
    };

    return {
        channels: channels.map((channel: any) => ({
            id: channel._id,
            name: channel.name,
            type: channel.type,
        })),
        groups: groups.map((group: any) => ({
            id: group._id,
            name: group.name,
            type: group.type,
        })),
        directMessages: directMessages.map((dm: any) => ({
            id: dm._id,
            name: dm.name,
            type: dm.type,
        })),
        createChannel,
    };
}

export function useUsers() {
    const users = useQuery(api.users.getAll) || [];
    const createUserMutation = useMutation(api.users.create);
    const updateLastSeenMutation = useMutation(api.users.updateLastSeen);

    const createUser = async (name: string) => {
        return await createUserMutation({ name });
    };

    const updateLastSeen = async (name: string) => {
        await updateLastSeenMutation({ name });
    };

    return {
        users: users.map((user: any) => ({
            id: user._id,
            name: user.name,
            lastSeen: user.lastSeen,
        })),
        createUser,
        updateLastSeen,
    };
}
