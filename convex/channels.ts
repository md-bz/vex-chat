import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { getUser, isUserMemberOfChannel } from "./auth";

export const getAll = query({
    handler: async (ctx) => {
        const user = await getUser(ctx);
        const userChannels = await ctx.db
            .query("channelMembers")
            .withIndex("by_userId_channelId", (q) => q.eq("userId", user?._id))
            .collect();
        return Promise.all(userChannels.map((c) => ctx.db.get(c.channelId)));
    },
});

export const get = query({
    args: { id: v.id("channels") },
    handler: async (ctx, args) => {
        const isMember = await isUserMemberOfChannel(ctx, args.id);
        if (!isMember) {
            throw new ConvexError("Not a member of this channel");
        }

        return await ctx.db.get(args.id);
    },
});

export const create = mutation({
    args: {
        name: v.string(),
        type: v.optional(
            v.union(
                v.literal("channel"),
                v.literal("group"),
                v.literal("private")
            )
        ),
        members: v.optional(v.array(v.id("users"))),
    },
    handler: async (ctx, args) => {
        const user = await getUser(ctx);

        const id = await ctx.db.insert("channels", {
            name: args.name,
            type: args.type || "private",
            createdBy: user._id,
            createdAt: Date.now(),
        });

        const members = args.members ? [user._id, ...args.members] : [user._id];

        for (const member of members) {
            await ctx.db.insert("channelMembers", {
                channelId: id,
                userId: member,
                isAdmin: false,
            });
        }
        return id;
    },
});
