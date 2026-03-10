import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    userId: v.string(),
    title: v.string(),
    message: v.string(),
    type: v.union(
      v.literal("help_request"),
      v.literal("schedule"),
      v.literal("announcement"),
      v.literal("check_in"),
      v.literal("general")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      ...args,
      read: false,
    });
  },
});

export const listByUser = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

export const markAsRead = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.notificationId);
    if (!existing) {
      throw new Error("Notification not found");
    }
    await ctx.db.patch(args.notificationId, { read: true });
  },
});

export const markAllAsRead = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q) =>
        q.eq("userId", args.userId).eq("read", false)
      )
      .collect();
    for (const notification of unread) {
      await ctx.db.patch(notification._id, { read: true });
    }
  },
});

export const countUnread = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q) =>
        q.eq("userId", args.userId).eq("read", false)
      )
      .collect();
    return unread.length;
  },
});
