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

interface SelectMessageStore {
    selectedMessage: Message | null;
    selectType: "reply" | "edit" | null;
    setSelectedMessage: (
        message: Message | null,
        type: "reply" | "edit"
    ) => void;
    clearSelectedMessage: () => void;
}

export const useSelectMessageStore = create<SelectMessageStore>((set) => ({
    selectedMessage: null,
    selectType: null,
    setSelectedMessage: (message, type) =>
        set({ selectedMessage: message, selectType: type }),
    clearSelectedMessage: () =>
        set({ selectedMessage: null, selectType: null }),
}));
