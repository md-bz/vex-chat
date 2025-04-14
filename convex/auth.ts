import { ConvexError } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export async function getUser(ctx: QueryCtx) {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
        throw new ConvexError("Unauthorized");
    }

    const user = await ctx.db
        .query("users")
        .withIndex("by_tokenIdentifier", (q) =>
            q.eq("tokenIdentifier", identity.tokenIdentifier)
        )
        .first();

    if (!user) {
        throw new ConvexError("User not found");
    }
    return user;
}

export async function getMembership(
    ctx: QueryCtx | MutationCtx,
    channelId: Id<"channels">
) {
    const user = await getUser(ctx);
    return ctx.db
        .query("channelMembers")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .filter((q) => q.eq(q.field("channelId"), channelId))
        .first();
}

export async function isUserMemberOfChannel(
    ctx: QueryCtx | MutationCtx,
    channelId: Id<"channels">
) {
    const membership = await getMembership(ctx, channelId);

    return membership ? true : false;
}

export async function isUserAdminOfChannel(
    ctx: QueryCtx | MutationCtx,
    channelId: Id<"channels">
) {
    const membership = await getMembership(ctx, channelId);

    return membership ? membership.isAdmin : false;
}
