export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const EVENT_NAME = "Anveshana 3.0";
export const TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
export const MIN_PASSWORD_LENGTH = 8;
export const TEAM_ROLE_LEAD = "lead";
export const TEAM_ROLE_MEMBER = "member";
export const VALID_TARGET_ROLES = ["ALL", "PARTICIPANT", "VOLUNTEER", "JUDGE", "ADMIN"] as const;
export const EMAIL_BATCH_SIZE = 100;

// --- User Roles ---
export const ROLES = {
  ADMIN: "ADMIN",
  PARTICIPANT: "PARTICIPANT",
  VOLUNTEER: "VOLUNTEER",
  JUDGE: "JUDGE",
} as const;

// --- Team Status ---
export const TEAM_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

// --- Judge Assignment Status ---
export const JUDGE_STATUS = {
  SCHEDULED: "SCHEDULED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
} as const;

// --- Invitation Status ---
export const INVITATION_STATUS = {
  PENDING: "PENDING",
  USED: "USED",
  EXPIRED: "EXPIRED",
} as const;

// --- Help Request Constants ---
export const HELP_STATUS = {
  OPEN: "OPEN",
  CLAIMED: "CLAIMED",
  IN_PROGRESS: "IN_PROGRESS",
  RESOLVED: "RESOLVED",
} as const;

export const URGENCY = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
} as const;

export const HELP_CATEGORIES = ["Technical", "Logistics", "Judge", "Other"] as const;

// --- Shared Color Maps ---
export const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  CLAIMED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  IN_PROGRESS: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  RESOLVED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

export const URGENCY_COLORS: Record<string, string> = {
  Low: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  Medium: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  High: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

// --- Role-to-Dashboard Route Mapping ---
export const ROLE_DASHBOARDS: Record<string, string> = {
  ADMIN: "/admin",
  PARTICIPANT: "/participant",
  VOLUNTEER: "/volunteer",
  JUDGE: "/judge",
};

// --- Event Tagline ---
export const EVENT_TAGLINE = "National Prototype Competition";

// --- Auth Cookie Names ---
export const AUTH_COOKIES = {
  SESSION: "better-auth.session_token",
  SESSION_SECURE: "__Secure-better-auth.session_token",
} as const;
