import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Anveshana <onboarding@resend.dev>";

// Template IDs from Resend dashboard
export const TEMPLATE_IDS = {
  invitation: process.env.RESEND_TEMPLATE_INVITATION!,
  teamApproved: process.env.RESEND_TEMPLATE_TEAM_APPROVED!,
  teamRejected: process.env.RESEND_TEMPLATE_TEAM_REJECTED!,
  passwordSetup: process.env.RESEND_TEMPLATE_PASSWORD_SETUP!,
};

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
}

interface SendTemplateEmailOptions {
  to: string | string[];
  subject: string;
  templateId: string;
  data: Record<string, string | number>;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  try {
    const recipients = Array.isArray(to) ? to : [to];

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: recipients,
      subject,
      html,
    });

    if (error) {
      console.error("Resend error:", JSON.stringify(error));
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Email send failed:", JSON.stringify(error, Object.getOwnPropertyNames(error as object)));
    return { success: false, error };
  }
}

/**
 * Send email using a Resend template with dynamic variables.
 */
export async function sendTemplateEmail({
  to,
  subject,
  templateId,
  data: templateData,
}: SendTemplateEmailOptions) {
  try {
    const recipients = Array.isArray(to) ? to : [to];

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: recipients,
        subject,
        template_id: templateId,
        template_data: templateData,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Resend template error:", JSON.stringify(result));
      return { success: false, error: result };
    }

    return { success: true, data: result };
  } catch (error) {
    console.error("Template email send failed:", JSON.stringify(error, Object.getOwnPropertyNames(error as object)));
    return { success: false, error };
  }
}

/**
 * Send batch template emails using direct fetch (bypasses SDK bundling issues).
 */
export async function sendBatchTemplateEmails(
  emails: { to: string; subject: string; templateId: string; data: Record<string, string | number> }[]
) {
  if (emails.length === 0) return { success: true, data: [] };

  try {
    const response = await fetch("https://api.resend.com/emails/batch", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        emails.map((e) => ({
          from: FROM_EMAIL,
          to: e.to,
          subject: e.subject,
          template_id: e.templateId,
          template_data: e.data,
        }))
      ),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Resend batch template error:", JSON.stringify(result));
      return { success: false, error: result };
    }

    return { success: true, data: result };
  } catch (error) {
    console.error("Batch template email send failed:", JSON.stringify(error, Object.getOwnPropertyNames(error as object)));
    return { success: false, error };
  }
}

/**
 * Send email to multiple recipients using batch API (counts as 1 API call).
 * Max 100 recipients per batch. Uses direct fetch to avoid SDK bundling issues.
 */
export async function sendBatchEmails(
  emails: { to: string; subject: string; html: string }[]
) {
  if (emails.length === 0) return { success: true, data: [] };

  try {
    const response = await fetch("https://api.resend.com/emails/batch", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        emails.map((e) => ({
          from: FROM_EMAIL,
          to: e.to,
          subject: e.subject,
          html: e.html,
        }))
      ),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Resend batch error:", JSON.stringify(result));
      return { success: false, error: result };
    }

    return { success: true, data: result };
  } catch (error) {
    console.error("Batch email send failed:", JSON.stringify(error, Object.getOwnPropertyNames(error as object)));
    return { success: false, error };
  }
}
