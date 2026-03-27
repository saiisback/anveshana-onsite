# Final Round Voting Feature

## Overview

A live voting experience for the final round where the admin reveals 5 finalist teams one at a time and all participants vote in real-time. The admin has full control over when each team is revealed, and participants see a live-updating vote count (NumberTicker animation).

## Rules

- Only participants can vote
- Participants cannot vote for their own team
- One vote per participant per team (upvote style)
- Participants can vote for multiple teams (one per reveal)
- Teams are shown one at a time — admin controls the sequence, strictly forward
- Participant portal is fully replaced by the voting screen during the final round
- After all 5 teams, a final leaderboard is shown ranked by votes

## Data Model (Convex)

### `finalRound` table

| Field             | Type                                          | Description                          |
| ----------------- | --------------------------------------------- | ------------------------------------ |
| `status`          | `"setup" \| "active" \| "finished"`           | Current phase                        |
| `currentTeamIndex`| `number`                                      | -1 (not started) to 4               |
| `teams`           | `array of { teamId, teamName, revealOrder }`  | Ordered finalist teams               |

### `finalRoundVotes` table

| Field          | Type     | Description                        |
| -------------- | -------- | ---------------------------------- |
| `finalRoundId` | `Id`     | Reference to finalRound            |
| `visitorId`    | `string` | Participant's user ID              |
| `visitorTeamId`| `string` | Participant's own team ID          |
| `teamId`       | `string` | Team they voted for                |

## Convex Functions

### Mutations

- **`createFinalRound(teams[])`** — Admin creates final round with selected teams in reveal order
- **`revealNextTeam(finalRoundId)`** — Increments `currentTeamIndex`, sets status to `"active"`
- **`showLeaderboard(finalRoundId)`** — Sets status to `"finished"`
- **`castVote(finalRoundId, teamId, visitorId, visitorTeamId)`** — Validates: not own team, not already voted, team is currently revealed

### Queries

- **`getActiveFinalRound()`** — Returns current final round state
- **`getVoteCount(finalRoundId, teamId)`** — Real-time count for a single team
- **`getAllVoteCounts(finalRoundId)`** — All teams with counts (for leaderboard)
- **`hasVoted(finalRoundId, visitorId, teamId)`** — Check if participant already voted

## Admin Flow

### Setup Phase
1. Admin sees list of all approved teams (from Prisma)
2. Admin selects 5 teams as finalists
3. Admin sets reveal order (drag to reorder)
4. Admin clicks "Start Final Round" — creates `finalRound` with `status: "setup"`, `currentTeamIndex: -1`

### Live Control Phase
- Control panel shows: current team name + live vote count
- **"Reveal Next Team"** button — increments `currentTeamIndex`
- Progress indicator: "Team 2 of 5"
- After all 5: **"Show Leaderboard"** button — sets status to `"finished"`
- Strictly forward — no going back

## Participant Experience

The voting screen **replaces the entire participant portal** during the final round.

### States

1. **Waiting** (`status: "setup"` or between reveals): "Stay tuned..." with pulse animation
2. **Voting** (`status: "active"`):
   - Team name displayed prominently
   - Live vote count with NumberTicker animation
   - "Vote" button — disables after voting (shows checkmark)
   - Own team: button hidden with "This is your team" label
3. **Leaderboard** (`status: "finished"`):
   - All 5 teams ranked by vote count (highest first)
   - NumberTicker animating in for each count
   - Highlight on #1 team

## Tech Stack

- **Real-time**: Convex (useQuery/useMutation) — same pattern as help requests & announcements
- **Vote animation**: NumberTicker component from Magic UI (motion/react spring animation)
- **Team data**: Referenced from Prisma `Team` table by ID
- **Auth**: Existing participant auth — vote validated server-side

## Implementation Checklist

- [ ] Add `finalRound` and `finalRoundVotes` tables to Convex schema
- [ ] Implement Convex mutations: createFinalRound, revealNextTeam, showLeaderboard, castVote
- [ ] Implement Convex queries: getActiveFinalRound, getVoteCount, getAllVoteCounts, hasVoted
- [ ] Add NumberTicker component (Magic UI)
- [ ] Build admin final round setup page (select teams, set order)
- [ ] Build admin live control panel (reveal next, show leaderboard)
- [ ] Build participant voting screen (waiting, voting, leaderboard states)
- [ ] Add final round check to participant layout (override portal when active)
