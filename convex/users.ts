import { mutation, query } from "./_generated/server"
import { v } from "convex/values"

export const getAll = query({
  handler: async (ctx) => {
    return await ctx.db.query("users").collect()
  },
})

export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("name"), args.name))
      .first()

    if (existing) {
      return existing._id
    }

    const id = await ctx.db.insert("users", {
      name: args.name,
      lastSeen: Date.now(),
    })

    return id
  },
})

export const updateLastSeen = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("name"), args.name))
      .first()

    if (user) {
      await ctx.db.patch(user._id, { lastSeen: Date.now() })
    }
  },
})

