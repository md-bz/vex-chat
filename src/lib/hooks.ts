import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { redirect } from "next/navigation";

export function useMessages(channelId: string | null) {
    // Convert string ID to Convex ID if it exists
    const convexChannelId = channelId ? (channelId as Id<"channels">) : null;

    // Query messages from Convex
    const messages = useQuery(
        api.messages.list,
        convexChannelId ? { channelId: convexChannelId } : "skip"
    );

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
    const allChannels = useQuery(api.channels.getAll);
    const createChannelMutation = useMutation(api.channels.create);
    const seenChannelMutation = useMutation(api.channels.seenChannel);
    const createChannelLinkMutation = useMutation(api.channels.createLink);
    const joinChannelMutation = useMutation(api.channels.joinChannel);

    const getChannelLastSeen = (channelId?: Id<"channels">) =>
        useQuery(
            api.channels.getChannelLastSeen,
            channelId ? { channelId } : "skip"
        );

    const seenChannel = async (
        lastSeenAt: number,
        channelId: Id<"channels">
    ) => {
        await seenChannelMutation({
            lastSeenAt,
            channelId,
        });
    };

    const getChannel = (id?: Id<"channels">) =>
        useQuery(api.channels.get, id ? { id } : "skip");
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

    const createChannelLink = async (channelId: Id<"channels">) => {
        return await createChannelLinkMutation({
            channelId,
        });
    };

    const joinChannel = async (link: string) => {
        return await joinChannelMutation({
            link,
        });
    };

    return {
        allChannels,
        createChannel,
        getChannel,
        seenChannel,
        getChannelLastSeen,
        joinChannel,
        createChannelLink,
    };
}

export function useUsers() {
    const createUserMutation = useMutation(api.users.create);
    const updateLastSeenMutation = useMutation(api.users.updateLastSeen);
    const getMe = (redirectOnError = true) => {
        try {
            return useQuery(api.users.getMe);
        } catch (error) {
            if (redirectOnError) {
                redirect("/");
            }
        }
    };
    const searchUsers = (query: string) =>
        useQuery(api.users.search, { query });

    const createUser = async (name: string, username?: string) => {
        return await createUserMutation({ name, username });
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

export function useContacts() {
    const contacts = useQuery(api.contacts.getContacts) || [];
    const addContactMutation = useMutation(api.contacts.addContact);
    const deleteContactMutation = useMutation(api.contacts.deleteContact);
    const updateContactMutation = useMutation(api.contacts.updateContact);
    const searchContactsQuery = (query: string) =>
        useQuery(api.contacts.searchContacts, { query });

    const addContact = async (contactId: Id<"users">, contactName: string) => {
        return await addContactMutation({ contactId, contactName });
    };

    const deleteContact = async (contactId: Id<"contacts">) => {
        return await deleteContactMutation({ contactId });
    };

    const updateContact = async (contactId: Id<"contacts">, name: string) => {
        return await updateContactMutation({ contactId, name });
    };

    const searchContacts = (query: string) => {
        return searchContactsQuery(query) || [];
    };

    return {
        contacts,
        addContact,
        deleteContact,
        updateContact,
        searchContacts,
    };
}
