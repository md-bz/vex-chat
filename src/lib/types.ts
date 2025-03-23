import type { Id } from "../../convex/_generated/dataModel";

export interface Message {
    id: string | Id<"messages">;
    channelId: string | Id<"channels">;
    channelType: "channel" | "group" | "dm";
    text: string;
    sender: string;
    timestamp: string;
}

export interface User {
    id: string | Id<"users">;
    name: string;
    lastSeen?: number;
}

export interface Channel {
    id: string | Id<"channels">;
    name: string;
    type: "channel" | "group" | "dm";
    members?: string[];
}
