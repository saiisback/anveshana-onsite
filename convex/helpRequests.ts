import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    teamId: v.string(),
    teamName: v.string(),
    category: v.union(
      v.literal("Technical"),
      v.literal("Logistics"),
      v.literal("Judge"),
      v.literal("Other")
    ),
    description: v.optional(v.string()),
    urgency: v.union(
      v.literal("Low"),
      v.literal("Medium"),
      v.literal("High")
    ),
    stallNumber: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("helpRequests", {
      ...args,
      status: "OPEN",
    });
  },
});

export const list = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("OPEN"),
        v.literal("CLAIMED"),
        v.literal("IN_PROGRESS"),
        v.literal("RESOLVED")
      )
    ),
  },
  handler: async (ctx, args) => {
    if (args.status) {
      return await ctx.db
        .query("helpRequests")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .collect();
    }
    return await ctx.db.query("helpRequests").collect();
  },
});

export const listByTeam = query({
  args: {
    teamId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("helpRequests")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();
  },
});

export const claim = mutation({
  args: {
    helpRequestId: v.id("helpRequests"),
    volunteerId: v.string(),
    volunteerName: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.helpRequestId);
    if (!existing) {
      throw new Error("Help request not found");
    }
    if (existing.status !== "OPEN") {
      throw new Error("Help request is not open");
    }
    await ctx.db.patch(args.helpRequestId, {
      status: "CLAIMED",
      volunteerId: args.volunteerId,
      volunteerName: args.volunteerName,
    });
  },
});

export const updateStatus = mutation({
  args: {
    helpRequestId: v.id("helpRequests"),
    status: v.union(v.literal("IN_PROGRESS"), v.literal("RESOLVED")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.helpRequestId);
    if (!existing) {
      throw new Error("Help request not found");
    }
    await ctx.db.patch(args.helpRequestId, {
      status: args.status,
    });
  },
});

export const listByVolunteer = query({
  args: {
    volunteerId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("helpRequests")
      .withIndex("by_volunteer", (q) => q.eq("volunteerId", args.volunteerId))
      .collect();
  },
});
