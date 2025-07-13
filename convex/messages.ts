import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { getUser, isUserAdminOfChannel, isUserMemberOfChannel } from "./auth";
import Autolinker from "autolinker";
import xss from "xss";
import { updateChannelLastSeen, updateLastSeen } from "./helper";
import { paginationOptsValidator } from "convex/server";

export const list = query({
    args: {
        channelId: v.id("channels"),
        firstMessageCreationTime: v.optional(v.number()),
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, args) => {
        const isMember = await isUserMemberOfChannel(ctx, args.channelId);
        if (!isMember) {
            throw new ConvexError("Not a member of this channel");
        }

        args.paginationOpts.numItems =
            args.paginationOpts.numItems > 100
                ? 100
                : args.paginationOpts.numItems;

        const messages = await ctx.db
            .query("messages")
            .withIndex("by_channel", (q) =>
                q
                    .eq("channelId", args.channelId)
                    .lt(
                        "_creationTime",
                        args.firstMessageCreationTime || Infinity
                    )
            )
            .order("desc")
            .paginate(args.paginationOpts);

        const page = await Promise.all(
            messages.page.map(async (message) => {
                const user = await ctx.db.get(message.userId);
                const repliedMessage = message.replyTo
                    ? await ctx.db.get(message.replyTo)
                    : null;

                return {
                    ...message,
                    repliedMessage,
                    user,
                };
            })
        );
        return { ...messages, page };
    },
});

export const send = mutation({
    args: {
        channelId: v.id("channels"),
        text: v.string(),
        replyTo: v.optional(v.id("messages")),
    },
    handler: async (ctx, args) => {
        const timestamp = Date.now();
        const channel = await ctx.db.get(args.channelId);
        if (!channel) {
            throw new ConvexError("Channel not found");
        }

        if (channel.type === "channel") {
            const isAdmin = await isUserAdminOfChannel(ctx, args.channelId);
            if (!isAdmin)
                throw new ConvexError("You are not an admin of this channel");
        }

        const isMember = await isUserMemberOfChannel(ctx, args.channelId);

        if (!isMember) {
            throw new ConvexError("Not a member of this channel");
        }

        const user = await getUser(ctx);

        // few ms delay to avoid the last message being unseen when u send it yourself
        await updateChannelLastSeen(ctx, user._id, channel._id, timestamp + 5);

        await updateLastSeen(ctx, user._id, timestamp);

        if (args.replyTo) {
            const replyToMessage = await ctx.db.get(args.replyTo);
            if (!replyToMessage) {
                throw new ConvexError("Reply to message not found");
            }
            if (replyToMessage.channelId !== args.channelId) {
                const isMember = await isUserMemberOfChannel(
                    ctx,
                    replyToMessage.channelId
                );
                if (!isMember) {
                    throw new ConvexError(
                        "Not a member of this channel to reply to"
                    );
                }
            }
        }

        const id = await ctx.db.insert("messages", {
            channelId: channel._id,
            text: xss(Autolinker.link(args.text), {
                whiteList: {
                    a: ["href", "title", "target"],
                },
            }),
            userId: user._id,
            timestamp,
            replyTo: args.replyTo,
        });

        return id;
    },
});

export const edit = mutation({
    args: {
        messageId: v.id("messages"),
        text: v.string(),
    },
    handler: async (ctx, args) => {
        const message = await ctx.db.get(args.messageId);
        if (!message) {
            throw new ConvexError("Message not found");
        }

        const user = await getUser(ctx);
        if (message.userId !== user._id) {
            throw new ConvexError("You can only edit your own messages");
        }

        const isMember = await isUserMemberOfChannel(ctx, message.channelId);
        if (!isMember) {
            throw new ConvexError("Not a member of this channel");
        }

        await ctx.db.patch(args.messageId, {
            text: xss(Autolinker.link(args.text), {
                whiteList: {
                    a: ["href", "title", "target"],
                },
            }),
            editedAt: Date.now(),
        });

        return args.messageId;
    },
});

export const deleteMessage = mutation({
    args: {
        messageId: v.id("messages"),
    },
    handler: async (ctx, args) => {
        const message = await ctx.db.get(args.messageId);
        if (!message) {
            throw new ConvexError("Message not found");
        }

        const user = await getUser(ctx);
        if (message.userId !== user._id) {
            throw new ConvexError("You can only delete your own messages");
        }

        const isMember = await isUserMemberOfChannel(ctx, message.channelId);
        if (!isMember) {
            throw new ConvexError("Not a member of this channel");
        }

        await ctx.db.patch(args.messageId, {
            text: "this message has been deleted",
            deletedAt: Date.now(),
        });
        return args.messageId;
    },
});
