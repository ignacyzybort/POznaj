const API = "https://api.resend.com/emails";
const FROM = "POznaj <noreply@po-znaj.pl>";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
  scheduledAt?: Date;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.AUTH_RESEND_KEY);
}

export async function sendEmail(input: SendEmailInput): Promise<{ id: string } | null> {
  const apiKey = process.env.AUTH_RESEND_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
        ...(input.scheduledAt ? { scheduled_at: input.scheduledAt.toISOString() } : {}),
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      console.error("[email] send failed:", res.status);
      return null;
    }

    const data = (await res.json()) as { id?: string };
    return data.id ? { id: data.id } : null;
  } catch (e) {
    console.error("[email] send error:", (e as Error).message);
    return null;
  }
}

export async function cancelScheduledEmail(id: string): Promise<boolean> {
  const apiKey = process.env.AUTH_RESEND_KEY;
  if (!apiKey) return false;

  try {
    const res = await fetch(`${API}/${encodeURIComponent(id)}/cancel`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(10000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
