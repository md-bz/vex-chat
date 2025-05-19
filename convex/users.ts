import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { getUser } from "./auth";
import { getSanitizedUser, updateLastSeen } from "./helper";

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

//migration for old users without the soon to be required showLastSeen field
export const migrateUserShowLastSeen = mutation({
    args: {},
    handler: async (ctx) => {
        const users = await ctx.db.query("users").collect();
        for (const user of users) {
            await ctx.db.patch(user._id, {
                showLastSeen: true,
            });
        }
    },
});
