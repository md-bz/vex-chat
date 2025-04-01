import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { getUser, isUserAdminOfChannel } from "./auth";
import { nanoid } from "nanoid";

export const getAll = query({
    handler: async (ctx) => {
        const user = await getUser(ctx);
        const userChannels = await ctx.db
            .query("channelMembers")
            .withIndex("by_userId", (q) => q.eq("userId", user?._id))
            .collect();
        return Promise.all(userChannels.map((c) => ctx.db.get(c.channelId)));
    },
});

export const get = query({
    args: { id: v.id("channels") },
    handler: async (ctx, args) => {
        const user = await getUser(ctx);
        const channelMembers = await ctx.db
            .query("channelMembers")
            .withIndex("by_channelId", (q) => q.eq("channelId", args.id))
            .collect();

        const thisMember = channelMembers.find((m) => m.userId === user._id);
        if (!thisMember) {
            throw new ConvexError("Not a member of this channel");
        }

        const channel = await ctx.db.get(args.id);

        if (!channel) {
            throw new ConvexError("Channel not found");
        }

        const hasPermission = thisMember.isAdmin || channel.type !== "channel";

        const members = hasPermission
            ? await Promise.all(channelMembers.map((m) => ctx.db.get(m.userId)))
            : undefined;

        return {
            ...channel,
            canSendMessage: hasPermission,
            members: members,
        };
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

export const createLink = mutation({
    args: {
        channelId: v.id("channels"),
    },
    handler: async (ctx, args) => {
        const isAdmin = await isUserAdminOfChannel(ctx, args.channelId);
        if (!isAdmin) {
            throw new ConvexError("You are not an admin of this channel");
        }

        const channel = await ctx.db.get(args.channelId);
        if (!channel) {
            throw new ConvexError("Channel not found");
        }

        if (channel.type === "private") {
            throw new ConvexError(
                "Links can only be created in channels and groups"
            );
        }

        const oldLink = await ctx.db
            .query("channelLinks")
            .filter((q) => q.eq(q.field("channelId"), args.channelId))
            .first();
        if (oldLink) {
            return oldLink.link;
        }

        const user = await getUser(ctx);
        const link = nanoid();

        await ctx.db.insert("channelLinks", {
            channelId: args.channelId,
            link,
            createdAt: Date.now(),
            createdBy: user._id,
        });

        return link;
    },
});

export const joinChannel = mutation({
    args: {
        link: v.string(),
    },
    handler: async (ctx, args) => {
        const channelLink = await ctx.db
            .query("channelLinks")
            .filter((q) => q.eq(q.field("link"), args.link))
            .first();

        if (!channelLink) {
            throw new ConvexError("Link not found");
        }

        const channel = await ctx.db.get(channelLink.channelId);
        if (!channel) {
            throw new ConvexError("Channel not found");
        }

        // this condition is not needed, but it's here for safety
        if (channel.type === "private") {
            await ctx.db.delete(channelLink._id);
            console.error("Links found for private:", channel);

            throw new ConvexError(
                "Links can only be created in channels and groups"
            );
        }

        const user = await getUser(ctx);

        await ctx.db.insert("channelMembers", {
            channelId: channelLink.channelId,
            userId: user._id,
            isAdmin: false,
        });

        return true;
    },
});
