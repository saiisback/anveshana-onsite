// Shared type definitions for UI/API layers.
// These mirror Prisma-generated types but are safe to use in client components.

export interface TeamMemberBasic {
  name: string;
  email: string;
  roleInTeam: string;
}

export type UserRole = "ADMIN" | "PARTICIPANT" | "VOLUNTEER" | "JUDGE";
export type TeamStatus = "PENDING" | "APPROVED" | "REJECTED";
export type HelpRequestStatus = "OPEN" | "CLAIMED" | "IN_PROGRESS" | "RESOLVED";
export type UrgencyLevel = "Low" | "Medium" | "High";
export type HelpCategory = "Technical" | "Logistics" | "Judge" | "Other";
export type JudgeAssignmentStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED";
export type InvitationStatus = "PENDING" | "USED" | "EXPIRED";
