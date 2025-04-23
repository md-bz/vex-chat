import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        tokenIdentifier: v.string(), // from clerk
        name: v.string(),
        imageUrl: v.optional(v.string()),
        username: v.optional(v.string()),
        lastSeen: v.optional(v.number()),
    })
        .index("by_tokenIdentifier", ["tokenIdentifier"])
        .searchIndex("search_username", { searchField: "username" }),

    channels: defineTable({
        name: v.string(),
        type: v.union(
            v.literal("channel"),
            v.literal("group"),
            v.literal("private")
        ),
        createdBy: v.id("users"),
        createdAt: v.number(),
    }),

    channelMembers: defineTable({
        channelId: v.id("channels"),
        userId: v.id("users"),
        isAdmin: v.boolean(),
        privateMessageKey: v.optional(v.string()), // unique deterministic key for private messages
    })
        .index("by_userId", ["userId", "privateMessageKey"])
        .index("by_channelId", ["channelId"]),

    channelLinks: defineTable({
        channelId: v.id("channels"),
        link: v.string(),
        createdBy: v.id("users"),
        createdAt: v.number(),
    })
        .index("by_channelId", ["channelId"])
        .index("by_link", ["link"]),

    messages: defineTable({
        channelId: v.id("channels"),
        text: v.string(),
        userId: v.id("users"),
        timestamp: v.number(),
    }).index("by_channel", ["channelId"]),

    channelLastSeen: defineTable({
        userId: v.id("users"),
        channelId: v.id("channels"),
        lastSeenAt: v.number(),
    }).index("by_channel_user", ["channelId", "userId"]),

    contacts: defineTable({
        ownerId: v.id("users"),
        name: v.string(),
        contactId: v.id("users"),
    })
        .index("by_ownerId_contactId", ["ownerId", "contactId"])
        .searchIndex("search_contact", {
            filterFields: ["ownerId"],
            searchField: "name",
        }),
});
