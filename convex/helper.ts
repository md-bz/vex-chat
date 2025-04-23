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
        .withIndex("by_channel_user", (q) =>
            q.eq("channelId", channelId).eq("userId", userId)
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

export async function getChannelLastSeenInternal(
    ctx: MutationCtx | QueryCtx,
    channelId: Id<"channels">,
    userId: Id<"users">,
    channelType: "channel" | "group" | "private"
) {
    const channelLastSeen = await ctx.db
        .query("channelLastSeen")
        .withIndex("by_channel_user", (q) => q.eq("channelId", channelId))
        .collect();

    if (channelType === "channel") {
        return channelLastSeen.map((m) =>
            m.userId === userId ? m : { ...m, userId: "anonymous" }
        );
    }
    return channelLastSeen;
}

export async function getContactInfo(
    ctx: QueryCtx,
    userId: Id<"users">,
    ownerId: Id<"users">
) {
    return await ctx.db
        .query("contacts")
        .withIndex("by_ownerId_contactId", (q) =>
            q.eq("ownerId", ownerId).eq("contactId", userId)
        )
        .first();
}

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

export function generatePrivateChKey(userId1: string, userId2: string): string {
    const [a, b] = [userId1, userId2].sort(); // Lexicographic sort
    return `${a}_${b}`;
}

export async function getSharedPrivate(
    ctx: QueryCtx | MutationCtx,
    user1: Id<"users">,
    user2: Id<"users">
) {
    const key = generatePrivateChKey(user1, user2);
    const membership = await ctx.db
        .query("channelMembers")
        .withIndex("by_userId", (q) =>
            q.eq("userId", user1).eq("privateMessageKey", key)
        )
        .first();
    if (!membership) {
        return null;
    }
    return await ctx.db.get(membership.channelId);
}
