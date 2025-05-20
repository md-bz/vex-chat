import { create } from "zustand";
import { Channel, Message } from "./types";

interface ChatStore {
    currentChannel: Channel | null;
    selectChannel: (channel: Channel | null) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
    currentChannel: null,
    selectChannel: (channel) => set({ currentChannel: channel }),
}));

interface ReplyMessageStore {
    replyMessage: Message | null;
    setReplyMessage: (message: Message) => void;
    clearReplyMessage: () => void;
}

export const useReplyMessageStore = create<ReplyMessageStore>((set) => ({
    replyMessage: null,
    setReplyMessage: (message) => set({ replyMessage: message }),
    clearReplyMessage: () => set({ replyMessage: null }),
}));

interface EditMessageStore {
    editingMessage: Message | null;
    setEditingMessage: (message: Message | null) => void;
}

export const useEditMessageStore = create<EditMessageStore>((set) => ({
    editingMessage: null,
    setEditingMessage: (message) => set({ editingMessage: message }),
}));
