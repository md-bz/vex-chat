import { create } from "zustand";

interface Channel {
    _id: string;
    name: string;
    type: "channel" | "group" | "private";
}

interface ChatStore {
    currentChannel: Channel | null;
    selectChannel: (channel: Channel | null) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
    currentChannel: null,
    selectChannel: (channel) => set({ currentChannel: channel }),
}));
