import { useQuery, useMutation, usePaginatedQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { redirect } from "next/navigation";

export function useMessages(channelId: string | null) {
    // Convert string ID to Convex ID if it exists
    const convexChannelId = channelId ? (channelId as Id<"channels">) : null;

    // Query messages from Convex
    const { results, status, loadMore } =
        usePaginatedQuery(
            api.messages.list,
            convexChannelId ? { channelId: convexChannelId } : "skip",
            { initialNumItems: 50 }
        ) || [];

    // Get the send message mutation
    const sendMessageMutation = useMutation(api.messages.send);
    const editMessageMutation = useMutation(api.messages.edit);
    const deleteMessageMutation = useMutation(api.messages.deleteMessage);

    const sendMessage = async (message: {
        channelId: string;
        text: string;
        timestamp: string;
        replyTo?: Id<"messages">;
    }) => {
        if (!message.channelId) return;

        await sendMessageMutation({
            channelId: message.channelId as Id<"channels">,
            text: message.text,
            replyTo: message.replyTo,
        });
    };

    const editMessage = async (messageId: Id<"messages">, text: string) => {
        await editMessageMutation({
            messageId,
            text,
        });
    };

    const deleteMessage = async (messageId: Id<"messages">) => {
        await deleteMessageMutation({
            messageId,
        });
    };

    return {
        messages: results.toReversed(),
        messagesStatus: status,
        loadMoreMessages: loadMore,
        sendMessage,
        editMessage,
        deleteMessage,
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

    const getSharedPrivate = (userId: Id<"users">) =>
        useQuery(api.channels.getPrivateChannelIdByUserId, { userId });

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
        getSharedPrivate,
    };
}

export function useUsers() {
    const createUserMutation = useMutation(api.users.create);
    const updateLastSeenMutation = useMutation(
        api.users.updateLastSeenMutation
    );
    const getUserByUsername = (username: string) => {
        try {
            return useQuery(api.users.getByUsername, { username });
        } catch (error) {
            return null;
        }
    };

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
        getUserByUsername,
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
