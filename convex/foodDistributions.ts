import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    visitorId: v.string(),
    visitorName: v.string(),
    teamName: v.optional(v.string()),
    distributedBy: v.string(),
    distributedByName: v.string(),
    mealType: v.union(v.literal("Lunch"), v.literal("Snack")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("foodDistributions", args);
  },
});

export const getByVisitorAndMeal = query({
  args: {
    visitorId: v.string(),
    mealType: v.union(v.literal("Lunch"), v.literal("Snack")),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("foodDistributions")
      .withIndex("by_visitor_meal", (q) =>
        q.eq("visitorId", args.visitorId).eq("mealType", args.mealType)
      )
      .collect();
  },
});

export const getByVisitor = query({
  args: {
    visitorId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("foodDistributions")
      .withIndex("by_visitor", (q) => q.eq("visitorId", args.visitorId))
      .collect();
  },
});

export const listByMeal = query({
  args: {
    mealType: v.union(v.literal("Lunch"), v.literal("Snack")),
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
      Lunch: 0,
      Snack: 0,
      total: all.length,
    };

    for (const item of all) {
      if (item.mealType === "Lunch" || item.mealType === "Snack") {
        stats[item.mealType]++;
      }
    }

    return stats;
  },
});
