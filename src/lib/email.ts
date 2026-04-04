const RESEND_API_URL = "https://api.resend.com/emails";
const FROM_ADDRESS = "SeaSignal <notifications@seasignal.com>";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

interface SendEmailResult {
  success: boolean;
  error?: string;
}

/**
 * Send an email via the Resend API.
 *
 * If RESEND_API_KEY is not set, the email is logged to the console and the
 * call returns success (graceful degradation for local dev).
 */
export async function sendEmail({
  to,
  subject,
  html,
}: SendEmailParams): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(
      `[email] RESEND_API_KEY not set — logging email instead:\n` +
        `  To: ${to}\n  Subject: ${subject}\n  Body length: ${html.length} chars`
    );
    return { success: true };
  }

  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to,
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`[email] Resend API error (${res.status}):`, body);
      return { success: false, error: `Resend API ${res.status}: ${body}` };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[email] Failed to send:", message);
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Email templates — plain functions that return HTML strings.
// Styled with inline CSS using a maritime theme (dark navy + teal accents).
// ---------------------------------------------------------------------------

const WRAPPER_OPEN = `
<div style="background-color:#0b1628;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <div style="max-width:560px;margin:0 auto;background-color:#132039;border-radius:12px;overflow:hidden;border:1px solid #1e3a5f">
    <div style="background:linear-gradient(135deg,#0d9488,#0f766e);padding:24px 28px">
      <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600">⚓ SeaSignal</h1>
    </div>
    <div style="padding:28px">
`;

const WRAPPER_CLOSE = `
    </div>
    <div style="padding:16px 28px;border-top:1px solid #1e3a5f;text-align:center">
      <p style="margin:0;color:#64748b;font-size:12px">
        You received this because of your notification settings on SeaSignal.
      </p>
    </div>
  </div>
</div>
`;

/**
 * Template for new message notifications.
 */
export function newMessageEmail({
  senderName,
  channelName,
  preview,
}: {
  senderName: string;
  channelName: string;
  preview: string;
}): string {
  return `${WRAPPER_OPEN}
      <h2 style="margin:0 0 12px;color:#e2e8f0;font-size:18px">New message from ${escapeHtml(senderName)}</h2>
      <p style="margin:0 0 8px;color:#94a3b8;font-size:14px">
        Channel: <strong style="color:#5eead4">${escapeHtml(channelName)}</strong>
      </p>
      <div style="margin:16px 0;padding:16px;background-color:#0b1628;border-left:3px solid #0d9488;border-radius:4px">
        <p style="margin:0;color:#cbd5e1;font-size:14px;line-height:1.5;white-space:pre-wrap">${escapeHtml(preview)}</p>
      </div>
      <a href="https://seasignal.com/messages"
         style="display:inline-block;margin-top:12px;padding:10px 20px;background-color:#0d9488;color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:500">
        View conversation
      </a>
  ${WRAPPER_CLOSE}`;
}

/**
 * Template for certificate expiry alerts.
 */
export function certExpiryEmail({
  certTitle,
  expiryDate,
  daysLeft,
}: {
  certTitle: string;
  expiryDate: string;
  daysLeft: number;
}): string {
  const urgencyColor = daysLeft <= 7 ? "#ef4444" : daysLeft <= 30 ? "#f59e0b" : "#0d9488";

  return `${WRAPPER_OPEN}
      <h2 style="margin:0 0 12px;color:#e2e8f0;font-size:18px">Certificate expiring soon</h2>
      <div style="margin:16px 0;padding:16px;background-color:#0b1628;border-radius:8px">
        <p style="margin:0 0 8px;color:#94a3b8;font-size:13px;text-transform:uppercase;letter-spacing:0.05em">Certificate</p>
        <p style="margin:0 0 16px;color:#e2e8f0;font-size:16px;font-weight:600">${escapeHtml(certTitle)}</p>
        <p style="margin:0 0 8px;color:#94a3b8;font-size:13px;text-transform:uppercase;letter-spacing:0.05em">Expires</p>
        <p style="margin:0;color:${urgencyColor};font-size:16px;font-weight:600">
          ${escapeHtml(expiryDate)} — ${daysLeft} day${daysLeft === 1 ? "" : "s"} remaining
        </p>
      </div>
      <a href="https://seasignal.com/certs"
         style="display:inline-block;margin-top:12px;padding:10px 20px;background-color:#0d9488;color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:500">
        View certificates
      </a>
  ${WRAPPER_CLOSE}`;
}

/**
 * Escape HTML special characters to prevent injection in email templates.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
