import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { getUser, isUserMemberOfChannel } from "./auth";

export const list = query({
    args: { channelId: v.id("channels") },
    handler: async (ctx, args) => {
        const isMember = await isUserMemberOfChannel(ctx, args.channelId);
        if (!isMember) {
            throw new ConvexError("Not a member of this channel");
        }

        const messages = (
            await ctx.db
                .query("messages")
                .withIndex("by_channel", (q) =>
                    q.eq("channelId", args.channelId)
                )
                .order("desc")
                .take(100)
        ).reverse();
        return await Promise.all(
            messages.map(async (message) => {
                const user = await ctx.db.get(message.userId);
                return {
                    ...message,
                    user,
                };
            })
        );
    },
});

export const send = mutation({
    args: {
        channelId: v.id("channels"),
        text: v.string(),
    },
    handler: async (ctx, args) => {
        const isMember = await isUserMemberOfChannel(ctx, args.channelId);
        if (!isMember) {
            throw new ConvexError("Not a member of this channel");
        }
        const user = await getUser(ctx);

        const id = await ctx.db.insert("messages", {
            channelId: args.channelId,
            text: args.text,
            userId: user._id,
            timestamp: Date.now(),
        });

        return id;
    },
});
