import { mutation, MutationCtx, query, QueryCtx } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { getUser, isUserAdminOfChannel } from "./auth";
import { nanoid } from "nanoid";
import { Id } from "./_generated/dataModel";

export async function getSharedChannels(
    ctx: QueryCtx | MutationCtx,
    user1: Id<"users">,
    user2: Id<"users">
) {
    const user1Membership = await ctx.db
        .query("channelMembers")
        .withIndex("by_userId", (q) => q.eq("userId", user1))
        .collect();

    if (!user1Membership) {
        return {
            sharedPrivate: null,
            sharedChannels: [],
        };
    }

    const user2Membership = await ctx.db
        .query("channelMembers")
        .withIndex("by_userId", (q) => q.eq("userId", user2))
        .collect();
    if (!user2Membership) {
        return {
            sharedPrivate: null,
            sharedChannels: [],
        };
    }

    const user1ChannelIds = new Set(
        user1Membership.map((membership) => membership.channelId)
    );
    const sharedChannelIds = user2Membership
        .map((membership) => membership.channelId)
        .filter((channelId) => user1ChannelIds.has(channelId));

    const channels = await Promise.all(
        sharedChannelIds.map((channelId) => ctx.db.get(channelId))
    );

    if (!channels || channels.length === 0) {
        return {
            sharedPrivate: null,
            sharedChannels: [],
        };
    }

    return {
        sharedPrivate: channels.find((c) => c?.type === "private"),
        sharedChannels: channels.filter((c) => c?.type !== "private"),
    };
}

export const getAll = query({
    handler: async (ctx) => {
        const user = await getUser(ctx);
        const userChannels = await ctx.db
            .query("channelMembers")
            .withIndex("by_userId", (q) => q.eq("userId", user._id))
            .collect();

        return Promise.all(
            userChannels.map(async (membership) => {
                const channel = await ctx.db.get(membership.channelId);
                if (!channel) return null;
                if (channel.type !== "private") return channel;

                const otherMember = await ctx.db
                    .query("channelMembers")
                    .withIndex("by_channelId", (q) =>
                        q.eq("channelId", channel._id)
                    )
                    .filter((q) => q.neq(q.field("userId"), user._id))
                    .first();

                if (!otherMember) return null;
                const otherUser = await ctx.db.get(otherMember.userId);

                return {
                    ...channel,
                    user: otherUser,
                };
            })
        );
    },
});

export const get = query({
    args: { id: v.id("channels") },
    handler: async (ctx, args) => {
        const user = await getUser(ctx);

        const channel = await ctx.db.get(args.id);

        if (!channel) {
            throw new ConvexError("Channel not found");
        }

        const channelMembers = await ctx.db
            .query("channelMembers")
            .withIndex("by_channelId", (q) => q.eq("channelId", args.id))
            .collect();

        const thisMember = channelMembers.find((m) => m.userId === user._id);
        if (!thisMember) {
            throw new ConvexError("Not a member of this channel");
        }

        const hasPermission = thisMember.isAdmin || channel.type !== "channel";

        const members = hasPermission
            ? await Promise.all(
                  channelMembers.map((m) =>
                      ctx.db.get(m.userId).then((m) => {
                          if (!m) return null;
                          return {
                              _id: m._id,
                              name: m.name,
                              imageUrl: m.imageUrl,
                              lastSeen: m.lastSeen,
                          };
                      })
                  )
              )
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

        const type = args.type || "private";

        if (type === "private") {
            if (!args.members || args.members.length !== 1) {
                throw new ConvexError("Private channels requires a member");
            }

            const { sharedPrivate } = await getSharedChannels(
                ctx,
                user._id,
                args.members[0]
            );
            if (sharedPrivate) return sharedPrivate?._id;
        }

        const id = await ctx.db.insert("channels", {
            name: args.name,
            type,
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
