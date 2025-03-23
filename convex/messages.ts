import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
    args: { channelId: v.id("channels") },
    handler: async (ctx, args) => {
        return (
            await ctx.db
                .query("messages")
                .withIndex("by_channel", (q) =>
                    q.eq("channelId", args.channelId)
                )
                .order("desc")
                .take(100)
        ).reverse();
    },
});

export const send = mutation({
    args: {
        channelId: v.id("channels"),
        text: v.string(),
        sender: v.string(),
    },
    handler: async (ctx, args) => {
        const id = await ctx.db.insert("messages", {
            channelId: args.channelId,
            text: args.text,
            sender: args.sender,
            timestamp: Date.now(),
        });

        return id;
    },
});
