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

    const [firstMessageCreationTime, setFirstMessageCreationTime] = useState<
        number | null
    >(null);

    // the status is only used for load more messages
    const [status, setStatus] = useState<statusType>("CanLoadMore");

    // Query: latest messages (no pagination)
    const latestResults = useQuery(
        api.messages.list,
        channelId
            ? {
                  channelId: channelId,
                  paginationOpts: {
                      cursor: null,
                      numItems: 50,
                  },
              }
            : "skip"
    );

    // Query: load more (pagination)
    const loadMoreResults = useQuery(
        api.messages.list,
        channelId && firstMessageCreationTime
            ? {
                  channelId: channelId,
                  firstMessageCreationTime,
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

            // this doesn't have a default value since if there are no local
            // then the value from latestMessages should be set
            if (localMessages.length > 0)
                setFirstMessageCreationTime(localMessages[0]._creationTime);
        }
        if (channelId) getFromLocal();
    }, [channelId]);

    // Handle latest results (first load)
    useEffect(() => {
        if (!channelId || !latestResults || latestResults.page.length === 0)
            return;

        const reversedResults = latestResults.page.toReversed();
        const sourceMessages = [...messages, ...reversedResults];

        const map = new Map(sourceMessages.map((msg) => [msg._id, msg]));
        const newMessages = Array.from(map.values()) as Message[];
        setMessages(newMessages);
        const latestResultsFirstMessageCreationTime =
            latestResults.page[latestResults.page.length - 1]._creationTime;
        if (
            !firstMessageCreationTime ||
            latestResultsFirstMessageCreationTime < firstMessageCreationTime
        )
            setFirstMessageCreationTime(latestResultsFirstMessageCreationTime);
    }, [latestResults]);

    // Handle pagination results (load more)
    useEffect(() => {
        if (!channelId) return;

        if (!loadMoreResults || loadMoreResults.page.length === 0) {
            // if the loadMore returns empty it means there
            // is no message before the creation time
            // but the query is not exhausted since it hasn't loaded all of it
            // therefore status is set to Exhausted
            setStatus("Exhausted");
            return;
        }

        const reversedResults = loadMoreResults.page.toReversed();
        const sourceMessages = [...reversedResults, ...messages];

        const map = new Map(sourceMessages.map((msg) => [msg._id, msg]));
        const newMessages = Array.from(map.values()) as Message[];

        setMessages(newMessages);
        setCursor(loadMoreResults.continueCursor);
        setStatus(loadMoreResults.isDone ? "Exhausted" : "CanLoadMore");
        if (
            !firstMessageCreationTime ||
            loadMoreResults.page[0]._creationTime > firstMessageCreationTime
        )
            setFirstMessageCreationTime(loadMoreResults.page[0]._creationTime);
    }, [loadMoreResults]);

    // Save messages from both queries to local DB
    useEffect(() => {
        async function saveToLocal() {
            if (!latestResults || latestResults.page.length === 0) return;
            await db.messages.bulkPut(
                latestResults.page.toReversed() as Message[]
            );
        }

        if (latestResults) saveToLocal();
    }, [latestResults]);

    useEffect(() => {
        async function saveToLocal() {
            if (!loadMoreResults || loadMoreResults.page.length === 0) return;
            await db.messages.bulkPut(
                loadMoreResults.page.toReversed() as Message[]
            );
        }

        if (loadMoreResults) saveToLocal();
    }, [loadMoreResults]);

    function loadMoreMessages(numItems: number) {
        if (status === "Exhausted") return;
        setStatus("LoadingMore");
        if (numItems !== numOfMoreMessagesToLoad)
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
    const channelRevokeLinkMutation = useMutation(api.channels.revokeLink);
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

    const revokeChannelLink = async (link: string) => {
        return await channelRevokeLinkMutation({
            link,
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
        revokeChannelLink,
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
