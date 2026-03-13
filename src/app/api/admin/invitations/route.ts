import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateInviteToken } from "@/lib/tokens";
import { sendEmailsInBatches } from "@/lib/resend";
import { invitationEmail } from "@/lib/email-templates";
import { requireAdmin } from "@/lib/auth-server";
import { APP_URL } from "@/lib/constants";

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { emails } = await request.json();

    if (!Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: "Please provide an array of emails" },
        { status: 400 }
      );
    }

    // Dedupe and normalize
    const uniqueEmails = [
      ...new Set(emails.map((e: string) => e.trim().toLowerCase()).filter(Boolean)),
    ];

    // Find already-invited emails
    const existing = await prisma.invitation.findMany({
      where: { email: { in: uniqueEmails } },
      select: { email: true },
    });
    const existingSet = new Set(existing.map((e) => e.email));

    const newEmails = uniqueEmails.filter((e) => !existingSet.has(e));

    if (newEmails.length === 0) {
      return NextResponse.json({
        message: "All emails have already been invited",
        invited: 0,
        skipped: uniqueEmails.length,
      });
    }

    // Create invitation rows
    const invitations = await Promise.all(
      newEmails.map((email) => generateInviteToken(email))
    );

    // Build email batch with rendered HTML
    const emailBatch = invitations.map((inv) => ({
      to: inv.email,
      subject: "You're Invited to Anveshana 3.0!",
      html: invitationEmail(`${APP_URL}/register?token=${inv.token}`),
    }));

    const result = await sendEmailsInBatches(emailBatch);
    if (!result.success) {
      console.error("Batch send failed:", JSON.stringify(result.error));
      return NextResponse.json(
        { error: "Failed to send emails", details: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: `Invited ${newEmails.length} team leads`,
      invited: newEmails.length,
      skipped: existingSet.size,
    });
  } catch (error) {
    console.error("Invite error:", error);
    return NextResponse.json(
      { error: "Failed to send invitations" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const invitations = await prisma.invitation.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        team: { select: { id: true, name: true, status: true } },
      },
    });

    return NextResponse.json(invitations);
  } catch (error) {
    console.error("Fetch invitations error:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitations" },
      { status: 500 }
    );
  }
}
