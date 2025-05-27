import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { getUser } from "./auth";
import {
    generatePrivateChKey,
    getSanitizedUser,
    updateLastSeen,
} from "./helper";
import { Id } from "./_generated/dataModel";

export const getAll = query({
    handler: async (ctx) => {
        return await ctx.db.query("users").collect();
    },
});

export const getMe = query({
    handler: async (ctx) => {
        return getUser(ctx);
    },
});

export const getById = query({
    args: {
        id: v.id("users"),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.id);

        if (!user) {
            throw new ConvexError("User not found");
        }

        return getSanitizedUser(user);
    },
});

export const getByUsername = query({
    args: {
        username: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_username", (q) =>
                q.eq("username", args.username.toLowerCase())
            )
            .first();

        if (!user) {
            throw new ConvexError("User not found");
        }

        return getSanitizedUser(user);
    },
});

export const create = mutation({
    args: {
        name: v.string(),
        username: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new ConvexError("Unauthorized");
        }

        const existing = await ctx.db
            .query("users")
            .withIndex("by_tokenIdentifier", (q) =>
                q.eq("tokenIdentifier", identity.tokenIdentifier)
            )
            .first();

        if (existing) {
            return existing._id;
        }

        const username = args.username
            ?.replace(" ", "_")
            .replace(" ", "-")
            .toLowerCase();

        if (username) {
            const result = await ctx.db
                .query("users")
                .filter((q) => q.eq(q.field("username"), username))
                .first();
            if (result) {
                throw new ConvexError("Username already taken");
            }
        }

        const id = await ctx.db.insert("users", {
            name: args.name,
            username,
            tokenIdentifier: identity.tokenIdentifier,
            showLastSeen: true,
            lastSeen: Date.now(),
        });

        const channels = process.env.NEW_MEMBER_CHANNELS_IDS;
        if (channels) {
            const channelIds = channels.split(".") as Id<"channels">[];
            try {
                for (const channelId of channelIds) {
                    await ctx.db.insert("channelMembers", {
                        channelId: channelId,
                        userId: id,
                        isAdmin: false,
                    });
                }
            } catch (error) {
                console.error("Failed to add new member to channel:", error);
            }
        }

        const creator = process.env.CREATOR_ID as Id<"users"> | undefined;

        if (creator) {
            try {
                const channelWithCreator = await ctx.db.insert("channels", {
                    name: "chat",
                    type: "private",
                    createdBy: creator,
                    createdAt: Date.now(),
                });
                const privateMessageKey = generatePrivateChKey(creator, id);

                await ctx.db.insert("channelMembers", {
                    channelId: channelWithCreator,
                    userId: creator,
                    isAdmin: true,
                    privateMessageKey,
                });

                await ctx.db.insert("channelMembers", {
                    channelId: channelWithCreator,
                    userId: id,
                    isAdmin: false,
                    privateMessageKey,
                });

                await ctx.db.insert("messages", {
                    channelId: channelWithCreator,
                    text: "Welcome to Vex Chat! feel free to message me, this is an automated message.",
                    userId: creator,
                    timestamp: Date.now(),
                });
            } catch (error) {
                console.error("Failed to create private with creator:", error);
            }
        }
        return id;
    },
});

export const updateLastSeenMutation = mutation({
    args: {},
    handler: async (ctx) => {
        const user = await getUser(ctx);
        await updateLastSeen(ctx, user._id);
    },
});

export const search = query({
    args: {
        query: v.string(),
    },
    handler: async (ctx, args) => {
        const users = await ctx.db
            .query("users")
            .withSearchIndex("search_username", (q) =>
                q.search("username", args.query)
            )
            .collect();

        return users;
    },
});

export const migrate = mutation({
    args: {},
    handler: async (ctx) => {
        const channels = process.env.NEW_MEMBER_CHANNELS_IDS;
        if (!channels) return;

        const channelIds = channels.split(".") as Id<"channels">[];

        const users = await ctx.db.query("users").collect();

        for (const user of users) {
            for (const channelId of channelIds) {
                const isMember = await ctx.db
                    .query("channelMembers")
                    .withIndex("by_userId", (q) => q.eq("userId", user._id))
                    .filter((q) => q.eq(q.field("channelId"), channelId))
                    .first();
                if (isMember) continue;
                await ctx.db.insert("channelMembers", {
                    channelId: channelId,
                    userId: user._id,
                    isAdmin: false,
                });
            }
        }
    },
});

export const updateUserPreferences = mutation({
    args: {
        name: v.optional(v.string()),
        username: v.optional(v.string()),
        showLastSeen: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const user = await getUser(ctx);

        // If username is being updated, check if it's already taken
        if (args.username) {
            const username = args.username
                .replace(" ", "_")
                .replace(" ", "-")
                .toLowerCase();
            const existingUser = await ctx.db
                .query("users")
                .withIndex("by_username", (q) => q.eq("username", username))
                .first();

            if (existingUser && existingUser._id !== user._id) {
                throw new ConvexError("Username already taken");
            }
            args.username = username;
        }

        await ctx.db.patch(user._id, args);
        return await ctx.db.get(user._id);
    },
});
