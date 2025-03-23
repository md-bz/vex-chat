import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  users: defineTable({
    name: v.string(),
    lastSeen: v.optional(v.number()),
  }),

  channels: defineTable({
    name: v.string(),
    type: v.string(), // "channel", "group", or "dm"
    members: v.optional(v.array(v.string())),
    createdAt: v.number(),
  }),

  messages: defineTable({
    channelId: v.id("channels"),
    text: v.string(),
    sender: v.string(),
    timestamp: v.number(),
  }).index("by_channel", ["channelId"]),
})

