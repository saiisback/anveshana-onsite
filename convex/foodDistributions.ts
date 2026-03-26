import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    teamId: v.string(),
    teamName: v.string(),
    visitorName: v.optional(v.string()),
    distributedBy: v.string(),
    distributedByName: v.string(),
    mealType: v.union(
      v.literal("Breakfast"),
      v.literal("Lunch"),
      v.literal("Dinner"),
      v.literal("Snack")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("foodDistributions", args);
  },
});

export const getByTeamAndMeal = query({
  args: {
    teamId: v.string(),
    mealType: v.union(
      v.literal("Breakfast"),
      v.literal("Lunch"),
      v.literal("Dinner"),
      v.literal("Snack")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("foodDistributions")
      .withIndex("by_team_meal", (q) =>
        q.eq("teamId", args.teamId).eq("mealType", args.mealType)
      )
      .collect();
  },
});

export const getByTeam = query({
  args: {
    teamId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("foodDistributions")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();
  },
});

export const listByMeal = query({
  args: {
    mealType: v.union(
      v.literal("Breakfast"),
      v.literal("Lunch"),
      v.literal("Dinner"),
      v.literal("Snack")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("foodDistributions")
      .withIndex("by_meal", (q) => q.eq("mealType", args.mealType))
      .collect();
  },
});

export const listRecent = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("foodDistributions")
      .order("desc")
      .take(50);
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("foodDistributions").collect();
    
    const stats = {
      Breakfast: 0,
      Lunch: 0,
      Dinner: 0,
      Snack: 0,
      total: all.length,
    };

    for (const item of all) {
      stats[item.mealType]++;
    }

    return stats;
  },
});
