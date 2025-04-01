import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { getUser } from "./auth";

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

        const { _creationTime, tokenIdentifier, ...sanitizedUser } = user;

        return sanitizedUser;
    },
});

export const create = mutation({
    args: {
        name: v.string(),
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

        const id = await ctx.db.insert("users", {
            name: args.name,
            tokenIdentifier: identity.tokenIdentifier,
        });

        return id;
    },
});

export const updateLastSeen = mutation({
    args: {},
    handler: async (ctx, args) => {
        const user = await getUser(ctx);
        await ctx.db.patch(user._id, {
            lastSeen: Date.now(),
        });
    },
});
