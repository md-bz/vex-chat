import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { getById } from "../../convex/users";

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
        text: string;
        timestamp: string;
    }) => {
        if (!message.channelId) return;

        await sendMessageMutation({
            channelId: message.channelId as Id<"channels">,
            text: message.text,
        });
    };

    return {
        messages,
        sendMessage,
    };
}

export function useChannels() {
    const allChannels = useQuery(api.channels.getAll) || [];
    const createChannelMutation = useMutation(api.channels.create);

    const getChannel = (id?: Id<"channels">) =>
        useQuery(api.channels.get, id ? { id } : "skip");

    const channels = allChannels.filter(
        (channel: any) => channel.type === "channel"
    );
    const groups = allChannels.filter(
        (channel: any) => channel.type === "group"
    );
    const privates = allChannels.filter(
        (channel: any) => channel.type === "private"
    );

    const createChannel = async (
        name: string,
        type: "channel" | "group" | "private",
        members?: Id<"users">[]
    ) => {
        return await createChannelMutation({
            name,
            type,
            members,
        });
    };

    return {
        channels,
        groups,
        privates,
        createChannel,
        getChannel,
    };
}

export function useUsers() {
    const createUserMutation = useMutation(api.users.create);
    const updateLastSeenMutation = useMutation(api.users.updateLastSeen);
    const getMe = () => useQuery(api.users.getMe);
    const searchUsers = (query: string) =>
        useQuery(api.users.search, { query });

    const createUser = async (name: string) => {
        return await createUserMutation({ name });
    };

    const updateLastSeen = async () => {
        await updateLastSeenMutation();
    };

    const getUserById = (id?: Id<"users">) =>
        useQuery(api.users.getById, id ? { id } : "skip");

    return {
        createUser,
        updateLastSeen,
        getMe,
        searchUsers,
        getUserById,
    };
}
