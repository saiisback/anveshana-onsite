import { escapeHtml } from "@/lib/utils";
import { EVENT_NAME } from "@/lib/constants";

const baseLayout = (content: string) => `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${escapeHtml(EVENT_NAME)}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #050505; font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;">

  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #050505;">
    <tr>
      <td align="center" style="padding: 40px 16px;">

        <!-- Main card -->
        <table role="presentation" width="580" cellpadding="0" cellspacing="0" style="max-width: 580px; width: 100%; background-color: #0a0a0a; border-radius: 16px; border: 1px solid #1a1a1a; overflow: hidden;">

          <!-- Gradient accent bar -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #6366f1, #8b5cf6, #a855f7, #d946ef); font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>

          <!-- Logo / Header -->
          <tr>
            <td align="center" style="padding: 36px 40px 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <div style="height: 16px;"></div>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #fafafa; letter-spacing: -0.5px;">ANVESHANA 3.0</h1>
                    <p style="margin: 6px 0 0; font-size: 11px; color: #6366f1; text-transform: uppercase; letter-spacing: 3px; font-weight: 600;">National Prototype Competition</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <div style="height: 1px; background: linear-gradient(90deg, transparent, #262626, transparent);"></div>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px 40px;">
              ${content}
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <div style="height: 1px; background: linear-gradient(90deg, transparent, #262626, transparent);"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <p style="margin: 0 0 8px; font-size: 13px; color: #525252;">${escapeHtml(EVENT_NAME)}</p>
                    <p style="margin: 0; font-size: 11px; color: #3f3f3f;">National Prototype Competition</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
        <!-- /Main card -->

      </td>
    </tr>
  </table>

</body>
</html>
`;

// ─── Reusable snippets ────────────────────────────────────────────────────────

const ctaButton = (href: string, label: string, color: string = "#6366f1") => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding: 28px 0;">
        <a href="${escapeHtml(href)}" target="_blank" style="display: inline-block; padding: 14px 40px; background: ${escapeHtml(color)}; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 15px; letter-spacing: 0.3px; box-shadow: 0 4px 14px ${escapeHtml(color)}44;">
          ${label}
        </a>
      </td>
    </tr>
  </table>
`;

const infoBox = (rows: string) => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #111111; border: 1px solid #1e1e1e; border-radius: 12px; margin: 20px 0;">
    ${rows}
  </table>
`;

const infoRow = (icon: string, label: string, value: string) => `
  <tr>
    <td style="padding: 14px 18px; border-bottom: 1px solid #1a1a1a;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="28" style="font-size: 16px; vertical-align: middle;">${icon}</td>
          <td style="font-size: 13px; color: #737373; vertical-align: middle;">${label}</td>
          <td align="right" style="font-size: 14px; color: #e5e5e5; font-weight: 600; vertical-align: middle;">${value}</td>
        </tr>
      </table>
    </td>
  </tr>
`;

const badge = (text: string, type: "success" | "error" | "info" | "warning") => {
  const styles = {
    success: "background: #052e16; color: #4ade80; border: 1px solid #166534;",
    error: "background: #2c0b0e; color: #f87171; border: 1px solid #7f1d1d;",
    info: "background: #0c1929; color: #818cf8; border: 1px solid #312e81;",
    warning: "background: #1c1204; color: #fbbf24; border: 1px solid #713f12;",
  };
  return `<span style="display: inline-block; padding: 4px 14px; border-radius: 9999px; font-size: 12px; font-weight: 700; letter-spacing: 0.5px; ${styles[type]}">${text}</span>`;
};

const fallbackLink = (url: string) => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
    <tr>
      <td style="background: #111111; border: 1px solid #1e1e1e; border-radius: 10px; padding: 14px 18px;">
        <p style="margin: 0 0 6px; font-size: 11px; color: #525252; text-transform: uppercase; letter-spacing: 1px;">If the button doesn't work, copy this link:</p>
        <p style="margin: 0; word-break: break-all; font-size: 12px; color: #818cf8;">${url}</p>
      </td>
    </tr>
  </table>
`;

// ─── Email Templates ──────────────────────────────────────────────────────────

export function invitationEmail(registerUrl: string) {
  return baseLayout(`
    <!-- Emoji hero -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding-bottom: 20px;">
          <span style="font-size: 48px;">&#x1F389;</span>
        </td>
      </tr>
    </table>

    <h2 style="margin: 0 0 8px; font-size: 22px; font-weight: 800; color: #fafafa; text-align: center; letter-spacing: -0.3px;">You're Invited!</h2>
    <p style="margin: 0 0 24px; font-size: 14px; color: #a3a3a3; text-align: center; line-height: 1.7;">
      You've been specially selected to RSVP your team for <strong style="color: #e5e5e5;">${escapeHtml(EVENT_NAME)}</strong> — India's premier national-level prototype competition.
    </p>

    ${infoBox(`
      ${infoRow("&#x1F4C5;", "Event", escapeHtml(EVENT_NAME))}
      ${infoRow("&#x23F3;", "Link Expires", "7 Days")}
    `)}

    ${ctaButton(registerUrl, "&#x1F680;&nbsp;&nbsp;RSVP Your Team")}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding-bottom: 16px;">
          <p style="margin: 0; font-size: 13px; color: #525252;">&#x26A1; Spots are limited — RSVP before your invite expires</p>
        </td>
      </tr>
    </table>

    ${fallbackLink(registerUrl)}
  `);
}

export function teamApprovedEmail(teamName: string, stallNumber: number, leadName: string) {
  const safeTeamName = escapeHtml(teamName);
  const safeLeadName = escapeHtml(leadName);
  return baseLayout(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding-bottom: 20px;">
          <span style="font-size: 48px;">&#x1F389;</span>
        </td>
      </tr>
    </table>

    <h2 style="margin: 0 0 8px; font-size: 22px; font-weight: 800; color: #fafafa; text-align: center;">Congratulations, ${safeLeadName}!</h2>
    <p style="margin: 0 0 6px; font-size: 14px; color: #a3a3a3; text-align: center; line-height: 1.7;">
      Your team has been ${badge("APPROVED", "success")} for ${escapeHtml(EVENT_NAME)}.
    </p>
    <p style="margin: 0 0 24px; font-size: 14px; color: #a3a3a3; text-align: center; line-height: 1.7;">
      Get ready to showcase your innovation!
    </p>

    ${infoBox(`
      ${infoRow("&#x1F465;", "Team", safeTeamName)}
      ${infoRow("&#x1F4CD;", "Stall Number", `#${stallNumber}`)}
      ${infoRow("&#x2705;", "Status", "Approved")}
    `)}

    <p style="margin: 16px 0 0; font-size: 14px; color: #a3a3a3; line-height: 1.7;">
      &#x1F4CB; Log in to the portal to view your full schedule, stall details, and event guidelines. Make sure all team members are prepared!
    </p>
  `);
}

export function teamRejectedEmail(teamName: string, leadName: string) {
  const safeTeamName = escapeHtml(teamName);
  const safeLeadName = escapeHtml(leadName);
  return baseLayout(`
    <h2 style="margin: 0 0 8px; font-size: 22px; font-weight: 800; color: #fafafa;">Hi ${safeLeadName},</h2>
    <p style="margin: 0 0 20px; font-size: 14px; color: #a3a3a3; line-height: 1.7;">
      We appreciate your interest in ${escapeHtml(EVENT_NAME)}. After careful review, your team <strong style="color: #e5e5e5;">${safeTeamName}</strong> has been ${badge("NOT SELECTED", "error")} this year.
    </p>

    ${infoBox(`
      ${infoRow("&#x1F465;", "Team", safeTeamName)}
      ${infoRow("&#x274C;", "Status", "Not Selected")}
    `)}

    <p style="margin: 16px 0 0; font-size: 14px; color: #a3a3a3; line-height: 1.7;">
      &#x1F4AA; Don't be discouraged — we encourage you to keep innovating and apply again in the future. Thank you for your effort and participation.
    </p>
  `);
}

export function announcementEmail(title: string, message: string) {
  const safeTitle = escapeHtml(title);
  const safeMessage = escapeHtml(message);
  return baseLayout(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding-bottom: 16px;">
          <span style="font-size: 40px;">&#x1F4E2;</span>
        </td>
      </tr>
    </table>

    <h2 style="margin: 0 0 8px; font-size: 22px; font-weight: 800; color: #fafafa; text-align: center;">${safeTitle}</h2>
    <p style="margin: 0 0 20px; text-align: center;">${badge("ANNOUNCEMENT", "info")}</p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #111111; border: 1px solid #1e1e1e; border-radius: 12px; margin: 8px 0 20px;">
      <tr>
        <td style="padding: 20px;">
          <p style="color: #d4d4d4; margin: 0; font-size: 14px; line-height: 1.7; white-space: pre-wrap;">${safeMessage}</p>
        </td>
      </tr>
    </table>

    <p style="margin: 0; font-size: 13px; color: #525252; text-align: center;">&#x1F310; Log in to the portal for more details</p>
  `);
}

export function checkInReminderEmail(teamName: string) {
  const safeTeamName = escapeHtml(teamName);
  return baseLayout(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding-bottom: 16px;">
          <span style="font-size: 48px;">&#x1F3AB;</span>
        </td>
      </tr>
    </table>

    <h2 style="margin: 0 0 8px; font-size: 22px; font-weight: 800; color: #fafafa; text-align: center;">Check-In Reminder</h2>
    <p style="margin: 0 0 24px; font-size: 14px; color: #a3a3a3; text-align: center; line-height: 1.7;">
      Team <strong style="color: #e5e5e5;">${safeTeamName}</strong>, don't forget to check in when you arrive!
    </p>

    ${infoBox(`
      ${infoRow("&#x1F465;", "Team", safeTeamName)}
      ${infoRow("&#x1F4CD;", "Action", "Check in at registration desk")}
      ${infoRow("&#x1F4F1;", "Alternative", "Check in via portal")}
    `)}

    <p style="margin: 16px 0 0; font-size: 13px; color: #525252; text-align: center;">&#x23F0; Please check in as soon as you arrive at the venue</p>
  `);
}

export function scheduleUpdateEmail(title: string, details: string) {
  const safeTitle = escapeHtml(title);
  const safeDetails = escapeHtml(details);
  return baseLayout(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding-bottom: 16px;">
          <span style="font-size: 40px;">&#x1F504;</span>
        </td>
      </tr>
    </table>

    <h2 style="margin: 0 0 8px; font-size: 22px; font-weight: 800; color: #fafafa; text-align: center;">Schedule Update</h2>
    <p style="margin: 0 0 20px; text-align: center;">${badge("UPDATED", "warning")}</p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #111111; border: 1px solid #1e1e1e; border-radius: 12px; margin: 8px 0 20px;">
      <tr>
        <td style="padding: 20px;">
          <p style="color: #fafafa; font-weight: 700; margin: 0 0 10px; font-size: 15px;">&#x1F4CC; ${safeTitle}</p>
          <p style="color: #d4d4d4; margin: 0; font-size: 14px; line-height: 1.7; white-space: pre-wrap;">${safeDetails}</p>
        </td>
      </tr>
    </table>

    <p style="margin: 0; font-size: 13px; color: #525252; text-align: center;">&#x1F310; Check the portal for the latest schedule</p>
  `);
}

export function passwordSetupEmail(name: string, setupUrl: string) {
  const safeName = escapeHtml(name);
  return baseLayout(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding-bottom: 20px;">
          <span style="font-size: 48px;">&#x1F513;</span>
        </td>
      </tr>
    </table>

    <h2 style="margin: 0 0 8px; font-size: 22px; font-weight: 800; color: #fafafa; text-align: center;">Set Your Password</h2>
    <p style="margin: 0 0 24px; font-size: 14px; color: #a3a3a3; text-align: center; line-height: 1.7;">
      Hi <strong style="color: #e5e5e5;">${safeName}</strong>, your team is approved! &#x1F389;<br/>
      Set up your password to access the on-site portal.
    </p>

    ${infoBox(`
      ${infoRow("&#x1F464;", "Name", safeName)}
      ${infoRow("&#x2705;", "Status", "Approved")}
      ${infoRow("&#x23F3;", "Link Expires", "7 Days")}
    `)}

    ${ctaButton(setupUrl, "&#x1F512;&nbsp;&nbsp;Set Your Password", "#16a34a")}

    ${fallbackLink(setupUrl)}
  `);
}
