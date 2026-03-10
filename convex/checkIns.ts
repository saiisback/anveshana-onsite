import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    teamId: v.string(),
    teamName: v.string(),
    checkedInBy: v.string(),
    checkedInByName: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("checkIns", args);
  },
});

export const getByTeam = query({
  args: {
    teamId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("checkIns")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .first();
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("checkIns").collect();
  },
});
