import type { Id } from "../../convex/_generated/dataModel";

export interface Message {
    id: string | Id<"messages">;
    channelId: string | Id<"channels">;
    channelType: "channel" | "group" | "dm";
    text: string;
    userId: Id<"users">;
    timestamp: string;
}

export interface User {
    _id: Id<"users">;
    name: string;
    lastSeen?: number;
    imageUrl?: string;
}

export interface Channel {
    id: string | Id<"channels">;
    name: string;
    type: "channel" | "group" | "dm";
    members?: string[];
}
