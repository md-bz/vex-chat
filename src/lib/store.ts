import { create } from "zustand";
import { Id } from "../../convex/_generated/dataModel";
import { channelLastSeen, User } from "./types";

interface Channel {
    _id: Id<"channels"> | null;
    name: string;
    type: "channel" | "group" | "private";
    userId: Id<"users"> | null;
    lastSeen?: channelLastSeen[];
}

interface ChatStore {
    currentChannel: Channel | null;
    selectChannel: (channel: Channel | null) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
    currentChannel: null,
    selectChannel: (channel) => set({ currentChannel: channel }),
}));
