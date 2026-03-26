# Competition Day — Master Checklist

> **Date:** 2026-03-27
> **Event:** Anveshana 3.0 — National Prototype Competition
> **Teams:** 50 (10 Hardware, 40 Software)
> **Judges:** 4
> - **J1 — Swaroop** (SW expert)
> - **J2 — Neeraj** (SW expert)
> - **J3 — Santosh** (SW expert)
> - **J4 — Harish** (HW expert)

---

## Judging Allocation (Option A — Balanced 2-Judge Coverage)

Every team seen by exactly 2 judges. 25 evaluations per judge.

| Judge | Expertise | HW Teams | SW Teams | Total |
|-------|-----------|----------|----------|-------|
| **Harish** (J4) | HW expert | 10 | 15 | 25 |
| **Swaroop** (J1) | SW expert | 5 | 20 | 25 |
| **Neeraj** (J2) | SW expert | 5 | 20 | 25 |
| **Santosh** (J3) | SW expert | 0 | 25 | 25 |

**Rules:**
- HW teams: each seen by Harish + one of {Swaroop, Neeraj} (split 5/5)
- SW teams: each seen by exactly 2 of {Swaroop, Neeraj, Santosh, Harish}
- Harish's 15 SW evaluations = statistical bridge for cross-track normalization

**Prize Pool (10 total):**
- 1st, 2nd, 3rd place (overall, normalized ranking)
- 7 consolation prizes

---

## Pre-Event Setup

### 1. Judge Setup
- [ ] Create judge accounts in the system (4 judges)
- [ ] Assign roles: tag each judge as SW_EXPERT or HW_EXPERT
- [ ] Build the judge-team assignment matrix (see allocation table above)
- [ ] Create time slots (e.g., 20 min per team × 25 teams = ~8.5 hrs per judge)
- [ ] Upload judge schedule to the platform
- [ ] Share login credentials with judges
- [ ] Brief judges on scoring rubric (0–100 scale, criteria weights)
- [ ] Test judge evaluation flow end-to-end (submit a dummy score, verify it saves)

### 2. Participant / Team Setup
- [ ] Confirm all 50 teams are APPROVED in the system
- [ ] Assign stall numbers to all teams
- [ ] Generate QR codes for each team (unique per team, encodes team ID)
- [ ] Generate registration QR codes (for check-in on arrival)
- [ ] Verify participant profiles show: team info, stall number, QR code, judge schedule
- [ ] Send confirmation emails with stall assignments + event day instructions
- [ ] Tag each team as HARDWARE or SOFTWARE in the system

### 3. Scheduling
- [ ] Define event timeline (registration window, judging rounds, breaks, results)
- [ ] Create judge time slots — ensure no overlaps per judge
- [ ] Map judge routes: minimize travel between stalls (group nearby stalls per judge)
- [ ] Build buffer slots (10–15 min) between rounds for judge breaks
- [ ] Publish schedule to participant portal (so teams know when to expect judges)
- [ ] Publish schedule to judge portal

### 4. QR Code System
- [ ] Registration QR code: scannable at entry for check-in (volunteer scans → marks team as arrived)
- [ ] Team profile QR code: displayed at stall, judges scan to pull up team info + scoring form
- [ ] Test QR scanner on volunteer portal (camera permissions, scan speed)
- [ ] Print backup QR codes (in case phones fail)
- [ ] Verify QR → profile link works for all 50 teams

### 5. Participant Profile Page
- [ ] Profile displays: team name, members, prototype title, description, category (HW/SW)
- [ ] Profile displays: stall number + location on map
- [ ] Profile displays: registration QR code (for check-in)
- [ ] Profile displays: team QR code (for judge scanning at stall)
- [ ] Profile displays: judge visit schedule (who, when)
- [ ] Profile displays: real-time status (checked-in, judging in progress, completed)

---

## Event Day Operations

### 6. Registration & Check-In
- [ ] Set up check-in desk with volunteers + QR scanners
- [ ] Teams arrive → volunteer scans registration QR → system marks team as checked-in
- [ ] Dashboard shows live check-in count (X/50 teams arrived)
- [ ] Handle late arrivals: grace period policy decided? (e.g., 30 min)
- [ ] Distribute any physical materials (badges, stall markers)

### 7. Judging Rounds
- [ ] Judges log in to judge portal → see their schedule for today
- [ ] Judge arrives at stall → scans team QR OR selects assignment from schedule
- [ ] Judge evaluates → submits score (0–100) with optional comments
- [ ] Assignment status: SCHEDULED → IN_PROGRESS → COMPLETED
- [ ] Admin monitors judge progress on dashboard (how many completed vs remaining)
- [ ] Handle no-shows: if a team is absent, judge marks as N/A, admin reassigns if needed

### 8. Buzzer / Notification System
- [ ] Timer per evaluation slot — when time is up, send notification to judge ("move to next team")
- [ ] Notify team 5 min before judge arrives ("Judge arriving in 5 min")
- [ ] Notify team when judge is en route ("Judge J2 is heading to your stall")
- [ ] Use Convex real-time notifications for all of the above
- [ ] Admin can broadcast announcements (e.g., "Lunch break", "Judging resumes at 2 PM")

### 9. Help Requests (Already Built)
- [ ] Verify help request flow works: team raises → volunteer claims → resolves
- [ ] Volunteers assigned to zones covering all stalls
- [ ] Admin monitors help request dashboard for escalations

---

## Post-Judging

### 10. Score Normalization & Results
- [ ] Collect all scores (100 evaluations total)
- [ ] Normalize using z-scores:
  - For each judge, compute mean and std dev of their scores
  - Convert each raw score to z-score: `z = (score - mean) / stddev`
  - Each team's final score = average of their 2 z-scores
- [ ] Cross-track calibration via J4's 15 SW evaluations:
  - Compare J4's SW z-scores against J1/J2/J3's z-scores for the same teams
  - Compute offset if J4 grades systematically higher/lower
  - Apply offset to J4's HW scores
- [ ] Rank all 50 teams on normalized scores
- [ ] Select winners: 1st, 2nd, 3rd + 7 consolation
- [ ] Sanity check: are HW teams fairly represented in the results?
- [ ] Admin reviews final ranking before announcement

### 11. Results & Awards
- [ ] Display results on participant portal
- [ ] Prepare certificates / trophies
- [ ] Announce winners at closing ceremony
- [ ] Send follow-up emails with results + certificates

---

## ETA / Timeline Template

| Time | Activity | Duration |
|------|----------|----------|
| 8:00 AM | Venue setup, stall prep | 1 hr |
| 9:00 AM | Registration & check-in opens | 1 hr |
| 10:00 AM | Check-in closes, opening ceremony | 30 min |
| 10:30 AM | **Judging Round 1** (teams 1–12 per judge) | 4 hrs |
| 12:30 PM | Lunch break | 1 hr |
| 1:30 PM | **Judging Round 2** (teams 13–25 per judge) | 4 hrs |
| 5:30 PM | Score normalization & deliberation | 1 hr |
| 6:30 PM | Results announcement & awards | 30 min |
| 7:00 PM | Wrap up | — |

> **Note:** 25 teams × 20 min = ~8.3 hrs of judging per judge. Split into 2 rounds with lunch break. Adjust slot duration based on actual evaluation time needed.

---

## System Checklist (Technical)

- [ ] Database seeded with all 50 teams, 4 judges, volunteer accounts
- [ ] Prisma schema has `category` field on Team (HARDWARE / SOFTWARE) — verify it exists
- [ ] Judge assignment API supports bulk creation (25 assignments per judge)
- [ ] QR code generation works and encodes correct team IDs
- [ ] Convex real-time notifications tested with multiple concurrent users
- [ ] Mobile-responsive: judges will likely use phones/tablets at stalls
- [ ] Offline fallback: what happens if WiFi drops mid-evaluation? (cache locally?)
- [ ] Backup plan: printed score sheets in case system goes down
