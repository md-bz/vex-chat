import { create } from "zustand";
import { Id } from "../../convex/_generated/dataModel";

interface Channel {
    _id: Id<"channels">;
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
