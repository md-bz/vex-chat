import { create } from "zustand";

interface Channel {
    id: string;
    name: string;
    type: "channel" | "group" | "dm";
}

interface ChatStore {
    currentChannel: Channel | null;
    selectChannel: (channel: Channel) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
    currentChannel: null,
    selectChannel: (channel) => set({ currentChannel: channel }),
}));
