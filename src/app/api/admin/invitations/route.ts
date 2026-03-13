import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateInviteToken } from "@/lib/tokens";
import { sendBatchTemplateEmails, TEMPLATE_IDS } from "@/lib/resend";

export async function POST(request: Request) {
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

    // Build email batch using template
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const emailBatch = invitations.map((inv) => ({
      to: inv.email,
      subject: "You're Invited to Anveshana 2026!",
      templateId: TEMPLATE_IDS.invitation,
      data: {
        REGISTER_URL: `${appUrl}/register?token=${inv.token}`,
      },
    }));

    // Send in batches of 100 (Resend limit)
    for (let i = 0; i < emailBatch.length; i += 100) {
      const result = await sendBatchTemplateEmails(emailBatch.slice(i, i + 100));
      if (!result.success) {
        console.error("Batch send failed:", JSON.stringify(result.error));
        return NextResponse.json(
          { error: "Failed to send emails", details: result.error },
          { status: 500 }
        );
      }
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
