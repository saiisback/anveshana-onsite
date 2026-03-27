import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  helpRequests: defineTable({
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
    status: v.union(
      v.literal("OPEN"),
      v.literal("CLAIMED"),
      v.literal("IN_PROGRESS"),
      v.literal("RESOLVED")
    ),
    volunteerId: v.optional(v.string()),
    volunteerName: v.optional(v.string()),
    stallNumber: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_team", ["teamId"])
    .index("by_volunteer", ["volunteerId"]),

  notifications: defineTable({
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
    read: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_user_unread", ["userId", "read"]),

  checkIns: defineTable({
    visitorId: v.string(),
    visitorName: v.string(),
    teamName: v.optional(v.string()),
    checkedInBy: v.string(),
    checkedInByName: v.string(),
  }).index("by_visitor", ["visitorId"]),

  judgingAssignments: defineTable({
    assignmentId: v.string(),
    judgeId: v.string(),
    judgeName: v.string(),
    teamId: v.string(),
    teamName: v.string(),
    status: v.union(
      v.literal("SCHEDULED"),
      v.literal("IN_PROGRESS"),
      v.literal("COMPLETED")
    ),
    score: v.optional(v.number()),
    notes: v.optional(v.string()),
    timeSlotStart: v.string(),
    timeSlotEnd: v.string(),
  })
    .index("by_judge", ["judgeId"])
    .index("by_team", ["teamId"])
    .index("by_status", ["status"])
    .index("by_assignment", ["assignmentId"]),

  announcements: defineTable({
    title: v.string(),
    message: v.string(),
    targetRole: v.union(
      v.literal("ALL"),
      v.literal("PARTICIPANT"),
      v.literal("VOLUNTEER"),
      v.literal("ADMIN")
    ),
    createdBy: v.string(),
  }),

  foodDistributions: defineTable({
    visitorId: v.string(),
    visitorName: v.string(),
    teamName: v.optional(v.string()),
    distributedBy: v.string(),
    distributedByName: v.string(),
    mealType: v.union(v.literal("Lunch"), v.literal("Snack")),
  })
    .index("by_visitor", ["visitorId"])
    .index("by_visitor_meal", ["visitorId", "mealType"])
    .index("by_meal", ["mealType"]),
});
