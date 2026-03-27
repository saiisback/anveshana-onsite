import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ── Mutations ──

export const create = mutation({
  args: {
    teams: v.array(
      v.object({
        teamId: v.string(),
        teamName: v.string(),
        revealOrder: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("finalRound", {
      status: "setup",
      currentTeamIndex: -1,
      teams: args.teams,
    });
  },
});

export const revealNextTeam = mutation({
  args: { finalRoundId: v.id("finalRound") },
  handler: async (ctx, args) => {
    const round = await ctx.db.get(args.finalRoundId);
    if (!round) throw new Error("Final round not found");

    const nextIndex = round.currentTeamIndex + 1;
    if (nextIndex >= round.teams.length) {
      throw new Error("All teams have been revealed");
    }

    await ctx.db.patch(args.finalRoundId, {
      currentTeamIndex: nextIndex,
      status: "active",
    });
  },
});

export const showLeaderboard = mutation({
  args: { finalRoundId: v.id("finalRound") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.finalRoundId, {
      status: "finished",
    });
  },
});

export const castVote = mutation({
  args: {
    finalRoundId: v.id("finalRound"),
    teamId: v.string(),
    visitorId: v.string(),
    visitorTeamId: v.string(),
  },
  handler: async (ctx, args) => {
    // Can't vote for own team
    if (args.teamId === args.visitorTeamId) {
      throw new Error("You cannot vote for your own team");
    }

    // Check final round exists and is active
    const round = await ctx.db.get(args.finalRoundId);
    if (!round) throw new Error("Final round not found");
    if (round.status !== "active") throw new Error("Voting is not active");

    // Check team is the currently revealed team
    const currentTeam = round.teams[round.currentTeamIndex];
    if (!currentTeam || currentTeam.teamId !== args.teamId) {
      throw new Error("This team is not currently being voted on");
    }

    // Check if already voted for this team
    const existing = await ctx.db
      .query("finalRoundVotes")
      .withIndex("by_finalRound_visitor_team", (q) =>
        q
          .eq("finalRoundId", args.finalRoundId)
          .eq("visitorId", args.visitorId)
          .eq("teamId", args.teamId)
      )
      .first();

    if (existing) {
      throw new Error("You have already voted for this team");
    }

    await ctx.db.insert("finalRoundVotes", {
      finalRoundId: args.finalRoundId,
      visitorId: args.visitorId,
      visitorTeamId: args.visitorTeamId,
      teamId: args.teamId,
    });
  },
});

export const reset = mutation({
  args: {},
  handler: async (ctx) => {
    // Delete all votes
    const votes = await ctx.db.query("finalRoundVotes").collect();
    for (const vote of votes) {
      await ctx.db.delete(vote._id);
    }
    // Delete all final rounds
    const rounds = await ctx.db.query("finalRound").collect();
    for (const round of rounds) {
      await ctx.db.delete(round._id);
    }
  },
});

// ── Queries ──

export const getActive = query({
  args: {},
  handler: async (ctx) => {
    const rounds = await ctx.db.query("finalRound").order("desc").collect();
    // Return the most recent non-setup or any active/finished round
    return rounds.find((r) => r.status === "active" || r.status === "finished")
      ?? rounds[0]
      ?? null;
  },
});

export const getVoteCount = query({
  args: {
    finalRoundId: v.id("finalRound"),
    teamId: v.string(),
  },
  handler: async (ctx, args) => {
    const votes = await ctx.db
      .query("finalRoundVotes")
      .withIndex("by_finalRound_team", (q) =>
        q.eq("finalRoundId", args.finalRoundId).eq("teamId", args.teamId)
      )
      .collect();
    return votes.length;
  },
});

export const getAllVoteCounts = query({
  args: { finalRoundId: v.id("finalRound") },
  handler: async (ctx, args) => {
    const round = await ctx.db.get(args.finalRoundId);
    if (!round) return [];

    const counts: { teamId: string; teamName: string; votes: number }[] = [];
    for (const team of round.teams) {
      const votes = await ctx.db
        .query("finalRoundVotes")
        .withIndex("by_finalRound_team", (q) =>
          q.eq("finalRoundId", args.finalRoundId).eq("teamId", team.teamId)
        )
        .collect();
      counts.push({
        teamId: team.teamId,
        teamName: team.teamName,
        votes: votes.length,
      });
    }
    return counts.sort((a, b) => b.votes - a.votes);
  },
});

export const hasVoted = query({
  args: {
    finalRoundId: v.id("finalRound"),
    visitorId: v.string(),
    teamId: v.string(),
  },
  handler: async (ctx, args) => {
    const vote = await ctx.db
      .query("finalRoundVotes")
      .withIndex("by_finalRound_visitor_team", (q) =>
        q
          .eq("finalRoundId", args.finalRoundId)
          .eq("visitorId", args.visitorId)
          .eq("teamId", args.teamId)
      )
      .first();
    return !!vote;
  },
});
