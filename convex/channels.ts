import { mutation, query } from "./_generated/server"
import { v } from "convex/values"

export const getAll = query({
  handler: async (ctx) => {
    return await ctx.db.query("channels").collect()
  },
})

export const get = query({
  args: { id: v.id("channels") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  },
})

export const getByType = query({
  args: { type: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("channels")
      .filter((q) => q.eq(q.field("type"), args.type))
      .collect()
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    type: v.string(),
    members: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("channels", {
      name: args.name,
      type: args.type,
      members: args.members || [],
      createdAt: Date.now(),
    })

    return id
  },
})

