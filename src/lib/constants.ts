export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const EVENT_NAME = "Anveshana 3.0";
export const TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
export const MIN_PASSWORD_LENGTH = 8;
export const TEAM_ROLE_LEAD = "lead";
export const TEAM_ROLE_MEMBER = "member";
export const VALID_TARGET_ROLES = ["ALL", "PARTICIPANT", "VOLUNTEER", "JUDGE", "ADMIN"] as const;
export const EMAIL_BATCH_SIZE = 100;
