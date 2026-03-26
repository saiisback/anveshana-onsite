import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    visitorId: v.string(),
    visitorName: v.string(),
    teamName: v.optional(v.string()),
    checkedInBy: v.string(),
    checkedInByName: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("checkIns", args);
  },
});

export const getByVisitor = query({
  args: {
    visitorId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("checkIns")
      .withIndex("by_visitor", (q) => q.eq("visitorId", args.visitorId))
      .first();
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("checkIns").order("desc").collect();
  },
});
