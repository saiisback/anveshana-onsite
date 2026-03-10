# Anveshana On-Site — Product Requirements Document

## Overview

A web-based event management platform for **Anveshana**, a prototype exhibition competition at BMSIT college. ~50 teams showcase prototypes at stalls, judges evaluate on fixed schedules, and volunteers handle on-ground logistics.

**Goal:** Replace chaotic on-site coordination with a unified platform — RSVP, scheduling, live help requests, 3D campus navigation, and real-time notifications.

---

## Users & Portals

### 1. Participant Portal (Teams)
- Register team via RSVP form (Luma-style)
- View stall assignment & prototype details
- See judge visit schedule (who's coming, when)
- Raise help requests (technical, logistics, judge-related)
- Track help request status in real-time
- Navigate venue via 3D map
- Receive notifications (schedule changes, announcements)

### 2. Volunteer Portal
- View assigned zone/area on map
- Receive real-time help request notifications
- Accept/claim help requests
- Scan QR codes for team check-in
- View task queue (pending, in-progress, completed)
- Get navigation to requesting team's stall via 3D map

### 3. Admin Portal
- **Event Management:** Create/edit event, set schedule, configure venue
- **Registration:** View/approve/reject team registrations
- **Stall Assignment:** Assign teams to stalls (drag-drop or auto)
- **Judge Management:** Add judges, create judge-team assignment matrix with time slots
- **Volunteer Management:** Add volunteers, assign zones, view availability
- **Notifications:** Push announcements to all or specific roles
- **Help Requests:** Monitor all requests, reassign if needed
- **Dashboard:** Live analytics — check-in count, help request stats, judge progress, event timeline
- **3D Map Config:** Mark buildings, floors, stall positions on map

---

## Core Features

### F1: Registration & RSVP
- Public registration page (no login required to register)
- Fields: team name, members (name, email, phone, role), prototype title, description, category, requirements (power, internet, table size)
- Confirmation email/SMS on submission
- Admin approval workflow
- Post-approval: team gets login credentials & stall assignment

### F2: Team Profiles
- Team name, members, prototype details
- Photo/video upload of prototype
- Stall number & location on map
- Judge visit schedule
- QR code for check-in (auto-generated)

### F3: Judge Scheduling
- Admin creates time slots (e.g., 10:00-10:20, 10:20-10:40)
- Admin assigns judges to teams in specific slots
- Judges see their schedule: which team, which stall, what time
- Teams see: which judge, what time
- Auto-conflict detection (judge double-booked)

### F4: Help Request System
- Team raises request → selects category (Technical / Logistics / Judge / Other)
- Optional description + urgency level (Low / Medium / High)
- Request goes to Convex → all available volunteers in that zone get notified
- Volunteer claims request → status updates in real-time for team
- Status flow: `OPEN → CLAIMED → IN_PROGRESS → RESOLVED`
- Admin can view all requests, reassign, escalate

### F5: 3D Campus Map
- 3D model of BMSIT college (from Google Earth / OSM data)
- Only event-relevant buildings are interactive (highlighted)
- Click building → see floors → see stall layout
- Stall markers with team name, prototype title
- Navigation: "Take me to Stall #23" → path highlighted
- Real-time markers: volunteer locations, help request hotspots (admin view)
- Built with React Three Fiber (Three.js in React)

### F6: Notifications (Real-time via Convex)
- Help request alerts → volunteers
- Schedule updates → judges & teams
- Announcements → all users
- Check-in confirmations → teams
- Convex subscriptions for live UI updates (no polling)
- Web Push API for background notifications

### F7: QR Check-in
- Each team gets unique QR code (generated on registration approval)
- Volunteers scan QR at stall → marks team as checked in
- Check-in data feeds into admin dashboard
- Judges can also scan to confirm visit completed

### F8: Admin Dashboard
- Live stats: teams checked in, help requests (open/resolved), judge progress
- Timeline view of event flow
- Heat map of help requests by zone
- Export data (CSV) for post-event analysis

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14+ (App Router) |
| Styling | Tailwind CSS + shadcn/ui |
| Database (structured) | Neon (serverless Postgres) + Prisma |
| Real-time | Convex |
| Auth | NextAuth.js (role-based) |
| 3D Map | React Three Fiber |
| QR Codes | `qrcode` package (generation) + `html5-qrcode` (scanning) |
| Deployment | Vercel |
| File Storage | Convex file storage or Vercel Blob |

---

## Data Architecture

### Neon + Prisma (Source of Truth)
```
User          — id, name, email, phone, role (PARTICIPANT|VOLUNTEER|JUDGE|ADMIN), password
Team          — id, name, prototype_title, description, category, requirements, stall_number, status, qr_code
TeamMember    — id, team_id, user_id, role_in_team
Event         — id, name, date, venue, description, schedule_config
JudgeAssignment — id, judge_id (User), team_id, time_slot_start, time_slot_end, status, score
StallLocation — id, stall_number, building, floor, x, y, z (map coordinates)
VolunteerZone — id, volunteer_id (User), zone_name, building, floor
```

### Convex (Real-time)
```
help_requests  — id, team_id, category, description, urgency, status, volunteer_id, created_at, updated_at
notifications  — id, user_id, title, message, type, read, created_at
check_ins      — id, team_id, checked_in_by (volunteer), timestamp
live_locations — id, user_id, building, floor, stall_nearby (for admin map view)
announcements  — id, title, message, target_role, created_at
```

---

## Page Structure

```
/                           — Landing page + event info
/register                   — Team registration / RSVP form
/login                      — Login (email + password)

/participant/               — Dashboard (team overview)
/participant/schedule       — Judge visit schedule
/participant/help           — Raise & track help requests
/participant/map            — 3D campus map with navigation
/participant/notifications  — Notification center

/volunteer/                 — Dashboard (task queue)
/volunteer/scan             — QR scanner for check-ins
/volunteer/requests         — Help requests feed (real-time)
/volunteer/map              — 3D map with assigned zone
/volunteer/notifications    — Notification center

/admin/                     — Dashboard (analytics)
/admin/registrations        — View/approve registrations
/admin/teams                — Manage teams & stalls
/admin/judges               — Manage judges & schedules
/admin/volunteers           — Manage volunteers & zones
/admin/notifications        — Send announcements
/admin/help-requests        — Monitor all help requests
/admin/map                  — 3D map config & live view
/admin/settings             — Event settings
```

---

## Implementation Plan

### Phase 1: Foundation (Core Setup)
- [ ] Initialize Next.js project with TypeScript, Tailwind, shadcn/ui
- [ ] Set up Prisma with Neon database
- [ ] Set up Convex
- [ ] Set up NextAuth.js with role-based auth
- [ ] Create base layout (sidebar nav per role)
- [ ] Landing page

### Phase 2: Registration & Teams
- [ ] Public registration/RSVP form
- [ ] Admin registration approval workflow
- [ ] Team profile pages
- [ ] QR code generation per team
- [ ] Stall assignment (admin)

### Phase 3: Judge Scheduling
- [ ] Time slot management (admin)
- [ ] Judge-team assignment matrix (admin)
- [ ] Judge schedule view
- [ ] Team schedule view (who's visiting when)
- [ ] Conflict detection

### Phase 4: Help Request System
- [ ] Convex schema for help requests
- [ ] Team: raise help request form
- [ ] Volunteer: real-time request feed
- [ ] Claim/resolve workflow
- [ ] Admin: monitor & reassign

### Phase 5: Notifications
- [ ] Convex notification schema & mutations
- [ ] Real-time notification bell in all portals
- [ ] Admin announcement sender
- [ ] Web Push API integration (optional stretch)

### Phase 6: QR Check-in
- [ ] Volunteer QR scanner page
- [ ] Check-in recording to Convex
- [ ] Check-in status on team profile & admin dashboard

### Phase 7: 3D Campus Map
- [ ] Acquire/create BMSIT 3D model
- [ ] React Three Fiber scene setup
- [ ] Building selection → floor → stall navigation
- [ ] Stall markers with team info
- [ ] Navigation paths
- [ ] Admin: live markers (stretch)

### Phase 8: Admin Dashboard
- [ ] Live stats cards (check-ins, requests, judge progress)
- [ ] Event timeline view
- [ ] Data export (CSV)

---

## MVP Scope (What to build first)

For a working demo: **Phase 1 + 2 + 4 + 5**
- Registration, team management, help requests, notifications
- This gives a functional on-site tool even without the map

**Phase 3 + 6** next for full event flow.

**Phase 7** (3D map) is the showpiece but can be added last since it's independent.
