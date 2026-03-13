import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Anveshana <onboarding@resend.dev>";

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
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

/**
 * Send emails in batches of 100 (Resend limit).
 * Returns combined results from all batches.
 */
export async function sendEmailsInBatches(
  emails: { to: string; subject: string; html: string }[]
) {
  const batches = [];
  for (let i = 0; i < emails.length; i += 100) {
    batches.push(sendBatchEmails(emails.slice(i, i + 100)));
  }
  const results = await Promise.all(batches);
  const failed = results.filter((r) => !r.success);
  if (failed.length > 0) {
    return { success: false, error: failed[0].error, partialResults: results };
  }
  return { success: true, data: results };
}
