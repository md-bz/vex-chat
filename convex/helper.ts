import { Doc, Id } from "./_generated/dataModel";
import { MutationCtx, QueryCtx } from "./_generated/server";

export function getSanitizedUser(user: Doc<"users">) {
    const { _creationTime, tokenIdentifier, ...sanitizedUser } = user;
    return sanitizedUser;
}

export async function updateChannelLastSeen(
    ctx: MutationCtx,
    userId: Id<"users">,
    channelId: Id<"channels">,
    lastSeenAt: number = Date.now()
) {
    const existing = await ctx.db
        .query("channelLastSeen")
        .withIndex("by_user_channel", (q) =>
            q.eq("userId", userId).eq("channelId", channelId)
        )
        .unique();

    if (existing) {
        if (lastSeenAt > existing.lastSeenAt) {
            await ctx.db.patch(existing._id, { lastSeenAt });
        }
    } else {
        await ctx.db.insert("channelLastSeen", {
            userId,
            channelId,
            lastSeenAt,
        });
    }
}

export function getChannelLastSeenInternal(
    ctx: MutationCtx | QueryCtx,
    userId: Id<"users">,
    channelId: Id<"channels">
) {
    return ctx.db
        .query("channelLastSeen")
        .withIndex("by_user_channel", (q) =>
            q.eq("userId", userId).eq("channelId", channelId)
        )
        .first();
}
