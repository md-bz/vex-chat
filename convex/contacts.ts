import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { getUser } from "./auth";

export const getContacts = query({
    args: {},
    handler: async (ctx, args) => {
        const user = await getUser(ctx);

        return ctx.db
            .query("contacts")
            .withIndex("by_ownerId_contactId", (q) => q.eq("ownerId", user._id))
            .collect();
    },
});

export const addContact = mutation({
    args: {
        contactId: v.id("users"),
        contactName: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await getUser(ctx);

        const userContact = await ctx.db.get(args.contactId);
        if (!userContact) {
            throw new Error("Contact not found");
        }

        const oldContact = await ctx.db
            .query("contacts")
            .withIndex("by_ownerId_contactId", (q) => q.eq("ownerId", user._id))
            .filter((q) => q.eq(q.field("contactId"), args.contactId))
            .first();

        if (oldContact) {
            throw new ConvexError("contact already exists");
        }

        return ctx.db.insert("contacts", {
            ownerId: user._id,
            name: args.contactName,
            contactId: args.contactId,
        });
    },
});

export const searchContacts = query({
    args: {
        query: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await getUser(ctx);

        const contacts = await ctx.db
            .query("contacts")
            .withSearchIndex("search_contact", (q) =>
                q.search("name", args.query).eq("ownerId", user._id)
            )
            .collect();

        return contacts;
    },
});

export const deleteContact = mutation({
    args: {
        contactId: v.id("contacts"),
    },
    handler: async (ctx, args) => {
        const user = await getUser(ctx);

        const contact = await ctx.db.get(args.contactId);
        if (!contact) {
            throw new ConvexError("Contact not found");
        }

        if (contact.ownerId !== user._id) {
            throw new ConvexError("You cannot delete this contact");
        }

        return ctx.db.delete(args.contactId);
    },
});

export const updateContact = mutation({
    args: {
        contactId: v.id("contacts"),
        name: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await getUser(ctx);

        const contact = await ctx.db.get(args.contactId);
        if (!contact) {
            throw new ConvexError("Contact not found");
        }

        if (contact.ownerId !== user._id) {
            throw new ConvexError("You cannot update this contact");
        }

        return ctx.db.patch(args.contactId, {
            name: args.name,
        });
    },
});
