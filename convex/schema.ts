import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        tokenIdentifier: v.string(), // from clerk
        name: v.string(),
        imageUrl: v.optional(v.string()),
        lastSeen: v.optional(v.number()),
    }).index("by_tokenIdentifier", ["tokenIdentifier"]),

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
    })
        .index("by_userId", ["userId"])
        .index("by_channelId", ["channelId"]),

    channelLinks: defineTable({
        channelId: v.id("channels"),
        link: v.string(),
        createdBy: v.id("users"),
        createdAt: v.number(),
    }).index("by_link_channelId", ["link", "channelId"]),

    messages: defineTable({
        channelId: v.id("channels"),
        text: v.string(),
        userId: v.id("users"),
        timestamp: v.number(),
    }).index("by_channel", ["channelId"]),
});
