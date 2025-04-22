import { create } from "zustand";
import { Channel } from "./types";

interface ChatStore {
    currentChannel: Channel | null;
    selectChannel: (channel: Channel | null) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
    currentChannel: null,
    selectChannel: (channel) => set({ currentChannel: channel }),
}));
