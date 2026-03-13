import { Resend } from "resend";
import { EMAIL_BATCH_SIZE } from "@/lib/constants";

const resend = new Resend(process.env.RESEND_API_KEY);

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
 * Max 100 recipients per batch.
 */
async function sendBatchEmails(
  emails: { to: string; subject: string; html: string }[]
) {
  if (emails.length === 0) return { success: true, data: [] };

  try {
    const { data, error } = await resend.batch.send(
      emails.map((e) => ({
        from: FROM_EMAIL,
        to: e.to,
        subject: e.subject,
        html: e.html,
      }))
    );

    if (error) {
      console.error("Resend batch error:", JSON.stringify(error));
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Batch email send failed:", JSON.stringify(error, Object.getOwnPropertyNames(error as object)));
    return { success: false, error };
  }
}

/**
 * Send emails in batches of EMAIL_BATCH_SIZE (Resend limit).
 * Returns combined results from all batches.
 */
export async function sendEmailsInBatches(
  emails: { to: string; subject: string; html: string }[]
) {
  const batches = [];
  for (let i = 0; i < emails.length; i += EMAIL_BATCH_SIZE) {
    batches.push(sendBatchEmails(emails.slice(i, i + EMAIL_BATCH_SIZE)));
  }
  const results = await Promise.all(batches);
  const failed = results.filter((r) => !r.success);
  if (failed.length > 0) {
    return { success: false, error: failed[0].error, partialResults: results };
  }
  return { success: true, data: results };
}
