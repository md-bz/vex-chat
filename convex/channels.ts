import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { getUser, isUserAdminOfChannel, isUserMemberOfChannel } from "./auth";
import { nanoid } from "nanoid";
import {
    generatePrivateChKey,
    getChannelLastSeenInternal,
    getContactInfo,
    getSanitizedUser,
    getSharedPrivate,
    updateChannelLastSeen,
} from "./helper";

export const getAll = query({
    handler: async (ctx) => {
        const user = await getUser(ctx);
        const userChannels = await ctx.db
            .query("channelMembers")
            .withIndex("by_userId", (q) => q.eq("userId", user._id))
            .collect();

        // todo: paginate this to only fetch 30ish channels each time
        return (
            await Promise.all(
                userChannels.map(async (membership) => {
                    let channel = await ctx.db.get(membership.channelId);
                    if (!channel) return null;

                    const messages = (
                        await ctx.db
                            .query("messages")
                            .withIndex("by_channel", (q) =>
                                q.eq("channelId", membership.channelId)
                            )
                            .order("desc")
                            .take(20)
                    ).reverse();

                    const channelLastSeen = await getChannelLastSeenInternal(
                        ctx,
                        membership.channelId,
                        user._id,
                        channel.type
                    );
                    if (channel.type !== "private")
                        return {
                            ...channel,
                            messages,
                            channelLastSeen,
                        };

                    const otherMember = await ctx.db
                        .query("channelMembers")
                        .withIndex("by_channelId", (q) =>
                            q.eq("channelId", channel._id)
                        )
                        .filter((q) => q.neq(q.field("userId"), user._id))
                        .first();

                    // this happens when you message yourself (saved message)
                    if (!otherMember)
                        return {
                            ...channel,
                            user: getSanitizedUser(user),
                            messages,
                            channelLastSeen,
                        };

                    const otherUser = await ctx.db.get(otherMember.userId);

                    if (!otherUser) return null;

                    const otherMemberContact = await getContactInfo(
                        ctx,
                        otherMember.userId,
                        user._id
                    );
                    if (otherMemberContact) {
                        otherUser.name = otherMemberContact.name;
                    }

                    const sanitizedUser = getSanitizedUser(otherUser);

                    return {
                        ...channel,
                        user: sanitizedUser,
                        messages,
                        channelLastSeen,
                    };
                })
            )
        )
            .filter((c) => {
                if (c === null) console.warn("Channel not found", c);
                return c !== null;
            })
            .sort((a, b) => {
                const timeA =
                    a.messages[a.messages.length - 1]?._creationTime || 0;
                const timeB =
                    b.messages[b.messages.length - 1]?._creationTime || 0;
                return timeB - timeA;
            });
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

        const isAdmin = thisMember.isAdmin;

        const hasPermission = isAdmin || channel.type !== "channel";

        const members = hasPermission
            ? await Promise.all(
                  channelMembers.map((m) =>
                      ctx.db.get(m.userId).then(async (m) => {
                          if (!m) return null;

                          const contact = await getContactInfo(
                              ctx,
                              m._id,
                              user._id
                          );
                          if (contact) {
                              m.name = contact.name;
                          }
                          return getSanitizedUser(m);
                      })
                  )
              )
            : undefined;
        const channelLink =
            channel.type !== "private" && isAdmin
                ? await ctx.db
                      .query("channelLinks")
                      .withIndex("by_channelId", (q) =>
                          q.eq("channelId", args.id)
                      )
                      .first()
                : undefined;

        return {
            ...channel,
            link: channelLink?.link,
            canSendMessage: hasPermission,
            members: members,
            isAdmin,
        };
    },
});

export const getPrivateChannelIdByUserId = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const user = await getUser(ctx);

        return await getSharedPrivate(ctx, user._id, args.userId);
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

        const createdAt = Date.now();
        if (type === "private") {
            if (!args.members || args.members.length !== 1) {
                throw new ConvexError("Private channels requires a member");
            }

            const sharedPrivate = await getSharedPrivate(
                ctx,
                user._id,
                args.members[0]
            );
            if (sharedPrivate) return sharedPrivate;
        }

        const id = await ctx.db.insert("channels", {
            name: args.name,
            type,
            createdBy: user._id,
            createdAt,
        });

        if (type !== "private") {
            const link = nanoid();
            await ctx.db.insert("channelLinks", {
                channelId: id,
                link,
                createdAt,
                createdBy: user._id,
            });
        }

        const privateMessageKey =
            type === "private"
                ? //@ts-ignore the members[0] is being checked in if condition
                  generatePrivateChKey(user._id, args.members[0])
                : undefined;

        const members = args.members ? [user._id, ...args.members] : [user._id];

        for (const member of members) {
            if (type !== "private" && member !== user._id) {
                const hasAsContact = await ctx.db
                    .query("contacts")
                    .withIndex("by_ownerId_contactId", (q) =>
                        q.eq("ownerId", member).eq("contactId", user._id)
                    )
                    .first();
                if (!hasAsContact) continue;
            }

            await ctx.db.insert("channelMembers", {
                channelId: id,
                userId: member,
                isAdmin: member === user._id ? true : false,
                privateMessageKey,
            });

            // this happens when you create chat with yourself (saved message)
            if (
                type === "private" &&
                member === user._id &&
                //@ts-ignore the members[0] is being checked in if condition
                args.members[0] === user._id
            )
                break;
        }
        await ctx.db.insert("messages", {
            channelId: id,
            text: "Chat Created",
            userId: user._id,
            timestamp: createdAt,
        });

        const newlyCreatedChannel = await ctx.db.get(id);
        if (!newlyCreatedChannel) {
            console.error(
                `Error creating channel:\n args: ${JSON.stringify(
                    args
                )} user: ${JSON.stringify(user)}`
            );
            throw new ConvexError("Something went wrong");
        }
        return newlyCreatedChannel;
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
        const user = await getUser(ctx);

        const channelLink = await ctx.db
            .query("channelLinks")
            .withIndex("by_link", (q) => q.eq("link", args.link))
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

        const isMember = await isUserMemberOfChannel(ctx, channel._id);
        if (isMember) throw new ConvexError("Already a member");

        await ctx.db.insert("channelMembers", {
            channelId: channelLink.channelId,
            userId: user._id,
            isAdmin: false,
        });

        return channel;
    },
});

export const seenChannel = mutation({
    args: {
        channelId: v.id("channels"),
        lastSeenAt: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const user = await getUser(ctx);
        await updateChannelLastSeen(
            ctx,
            user._id,
            args.channelId,
            args.lastSeenAt
        );
    },
});

export const getChannelLastSeen = query({
    args: { channelId: v.id("channels") },
    handler: async (ctx, args) => {
        const user = await getUser(ctx);
        const channel = await ctx.db.get(args.channelId);
        if (!channel) {
            throw new ConvexError("Channel not found");
        }

        const isMember = isUserMemberOfChannel(ctx, args.channelId);
        if (!isMember) {
            throw new ConvexError("You are not a member of this channel");
        }

        return getChannelLastSeenInternal(
            ctx,
            args.channelId,
            user._id,
            channel.type
        );
    },
});
