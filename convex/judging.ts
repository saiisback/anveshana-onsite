import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    assignmentId: v.string(),
    judgeId: v.string(),
    judgeName: v.string(),
    teamId: v.string(),
    teamName: v.string(),
    timeSlotStart: v.string(),
    timeSlotEnd: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("judgingAssignments", {
      ...args,
      status: "SCHEDULED",
    });
  },
});

export const listByJudge = query({
  args: {
    judgeId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("judgingAssignments")
      .withIndex("by_judge", (q) => q.eq("judgeId", args.judgeId))
      .collect();
  },
});

export const listByTeam = query({
  args: {
    teamId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("judgingAssignments")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();
  },
});

export const list = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("SCHEDULED"),
        v.literal("IN_PROGRESS"),
        v.literal("COMPLETED")
      )
    ),
  },
  handler: async (ctx, args) => {
    if (args.status) {
      return await ctx.db
        .query("judgingAssignments")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .collect();
    }
    return await ctx.db.query("judgingAssignments").collect();
  },
});

export const getByAssignmentId = query({
  args: {
    assignmentId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("judgingAssignments")
      .withIndex("by_assignment", (q) =>
        q.eq("assignmentId", args.assignmentId)
      )
      .first();
  },
});

export const updateStatus = mutation({
  args: {
    assignmentId: v.string(),
    status: v.union(v.literal("IN_PROGRESS"), v.literal("COMPLETED")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("judgingAssignments")
      .withIndex("by_assignment", (q) =>
        q.eq("assignmentId", args.assignmentId)
      )
      .first();
    if (!existing) {
      throw new Error("Assignment not found");
    }
    await ctx.db.patch(existing._id, {
      status: args.status,
    });
  },
});

export const submitScore = mutation({
  args: {
    assignmentId: v.string(),
    score: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("judgingAssignments")
      .withIndex("by_assignment", (q) =>
        q.eq("assignmentId", args.assignmentId)
      )
      .first();
    if (!existing) {
      throw new Error("Assignment not found");
    }
    await ctx.db.patch(existing._id, {
      status: "COMPLETED",
      score: args.score,
      notes: args.notes,
    });
  },
});
