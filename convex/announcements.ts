import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    title: v.string(),
    message: v.string(),
    targetRole: v.union(
      v.literal("ALL"),
      v.literal("PARTICIPANT"),
      v.literal("VOLUNTEER"),
      v.literal("JUDGE"),
      v.literal("ADMIN")
    ),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("announcements", args);
  },
});

export const list = query({
  args: {
    targetRole: v.optional(
      v.union(
        v.literal("ALL"),
        v.literal("PARTICIPANT"),
        v.literal("VOLUNTEER"),
        v.literal("JUDGE"),
        v.literal("ADMIN")
      )
    ),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("announcements").order("desc").collect();
    if (!args.targetRole) {
      return all;
    }
    return all.filter(
      (a) => a.targetRole === "ALL" || a.targetRole === args.targetRole
    );
  },
});
