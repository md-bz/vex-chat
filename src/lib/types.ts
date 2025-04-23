import type { Id } from "../../convex/_generated/dataModel";

export interface Message {
    _id: Id<"messages">;
    _creationTime: number;
    channelId: Id<"channels">;
    userId: Id<"users">;
    text: string;
    timestamp: number;
    user: User | null;
}

export interface User {
    _id: Id<"users">;
    name: string;
    username?: string;
    lastSeen?: number;
    imageUrl?: string;
}

export interface Channel {
    _id: Id<"channels"> | null;
    name: string;
    type: "channel" | "group" | "private";
    userId?: Id<"users">;
    createdAt?: number;
    members?: (User | null)[];
    link?: string;
    canSendMessages?: boolean;
    isAdmin?: boolean;
}

export interface channelLastSeen {
    userId: Id<"users">;
    channelId: Id<"channels">;
    lastSeenAt: number;
}
