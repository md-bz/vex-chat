import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import { db } from "./db";
import { Message } from "./types";

type statusType =
    | "LoadingFirstPage"
    | "CanLoadMore"
    | "LoadingMore"
    | "Exhausted"
    | null;
export function useGetMessages(channelId: Id<"channels"> | null) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [cursor, setCursor] = useState<string | null>(null);
    const [cursorDebounced, setCursorDebounced] = useState<string | null>(null);
    const [numOfMoreMessagesToLoad, setNumOfMoreMessagesToLoad] =
        useState<number>(50);

    const [status, setStatus] = useState<statusType>(null);

    // Query messages from Convex
    const results = useQuery(
        api.messages.list,
        channelId && status !== "Exhausted"
            ? {
                  channelId: channelId,
                  paginationOpts: {
                      cursor: cursorDebounced,
                      numItems: numOfMoreMessagesToLoad,
                  },
              }
            : "skip"
    );

    useEffect(() => {
        async function getFromLocal() {
            const localMessages = await db.messages
                .where("[channelId+_creationTime]")
                .between([channelId, 0], [channelId, Infinity])
                .toArray();

            setMessages(localMessages);
        }
        getFromLocal();
    }, [channelId]);

    useEffect(() => {
        if (!channelId) return;

        if (!results || results.page.length === 0) return;

        const reversedResults = results.page.toReversed();
        let sourceMessages;
        //this means the loadMoreMessages function was called
        if (cursorDebounced === cursor && cursor !== null) {
            sourceMessages = [...reversedResults, ...messages];
        } else {
            sourceMessages = [...messages, ...reversedResults];
        }

        const map = new Map(sourceMessages.map((msg) => [msg._id, msg]));
        const newMessages = Array.from(map.values()) as Message[];
        setMessages(newMessages);

        setCursor(results.continueCursor);
        setStatus(results.isDone ? "Exhausted" : "CanLoadMore");
    }, [results]);

    useEffect(() => {
        async function saveToLocal() {
            if (!results || results.page.length === 0) return;
            await db.messages.bulkPut(results?.page.reverse() as Message[]);
        }

        saveToLocal();
    }, [results]);

    function loadMoreMessages(numItems: number) {
        setStatus("LoadingMore");
        if (numItems != numOfMoreMessagesToLoad)
            setNumOfMoreMessagesToLoad(numItems);
        setCursorDebounced(cursor);
    }

    return { messages, messagesStatus: status, loadMoreMessages };
}

export function useMessages() {
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
        // messages: results.toReversed(),
        // messagesStatus: status,
        // loadMoreMessages: loadMore,
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
    const updateUserPreferencesMutation = useMutation(
        api.users.updateUserPreferences
    );

    const updateUserPreferences = (
        name?: string,
        username?: string,
        showLastSeen?: boolean
    ) => {
        return updateUserPreferencesMutation({ name, username, showLastSeen });
    };

    const getUserByUsername = (username?: string) => {
        try {
            return useQuery(api.users.getByUsername, {
                username: username || "skip",
            });
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
        updateUserPreferences,
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
