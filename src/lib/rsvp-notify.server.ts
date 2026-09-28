// Sends the guest confirmation and couple notification emails for a new RSVP via the Resend API.
import { wedding } from "@/data/wedding";

export type RsvpForEmail = {
  id: string;
  full_name: string;
  email: string;
  guest_count: number;
  attending: boolean;
  confirmation_code: string;
};

const RESEND_URL = "https://api.resend.com/emails";

type Attachment = { filename: string; content: string; content_id: string };

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

async function send(to: string, subject: string, html: string, key: string, attachments?: Attachment[]) {
  const resendKey = process.env["RESEND_API_KEY"];
  if (!resendKey) throw new Error("RESEND_API_KEY is not configured");
  const from = process.env["RSVP_FROM_EMAIL"] || "Danielle & Obi <rsvp@danielleandobi.com.ng>";
  const res = await fetch(RESEND_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}`, "Idempotency-Key": key },
    body: JSON.stringify({ from, to: [to], subject, html, ...(attachments?.length ? { attachments } : {}) }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`Resend request failed [${res.status}]: ${body}`);
    throw new Error(`Resend request failed [${res.status}]: ${body}`);
  }
}

// Emails must not depend on a reachable preview host, so build the QR image inline.
async function qrAttachment(url: string): Promise<Attachment | null> {
  try {
    const QRCode = (await import("qrcode")).default;
    const dataUrl = await QRCode.toDataURL(url, { margin: 2, width: 320, color: { dark: "#4a1424", light: "#ffffff" } });
    return { filename: "checkin-qr.png", content: dataUrl.split(",")[1]!, content_id: "checkin-qr" };
  } catch (e) {
    console.error("QR generation failed", e);
    return null;
  }
}


const shell = (inner: string) => `<div style="background:#ffffff;padding:24px;font-family:Georgia,serif;color:#2b1a1f"><div style="max-width:520px;margin:0 auto;border:1px solid #d9c08a;padding:32px;text-align:center">${inner}</div></div>`;

export async function notifyRsvp(r: RsvpForEmail, siteUrl: string): Promise<void> {
  const names = `${esc(wedding.couple.bride)} &amp; ${esc(wedding.couple.groom)}`;
  const name = esc(r.full_name);
  const code = esc(r.confirmation_code);
  const publicSite = /localhost|127\.0\.0\.1/.test(siteUrl) ? "https://www.danielleandobi.com.ng" : siteUrl;
  const qr = r.attending ? await qrAttachment(`${publicSite}/checkin/${r.confirmation_code}`) : null;
  const guest = shell(`
    <p style="letter-spacing:3px;font-size:12px;color:#8a6d3b">YOU'RE ON THE LIST</p>
    <h1 style="color:#4a1424;font-weight:normal">${names}</h1>
    <p>Dear ${name}, thank you for your RSVP${r.attending ? ` for a party of ${r.guest_count}` : ""}.</p>
    <p><strong>Saturday, 14 November 2026</strong><br/>Ceremony 12:00 pm (arrival 11:00 am)<br/>The Cathedral Church of Christ, 29 Marina Rd, Lagos Island, Lagos</p>
    <p><strong>Reception</strong><br/>Bics Boat Club (Bics Garden), Wole Olateju Crescent, Lekki Phase 1, Lagos</p>
    ${r.attending ? `${qr ? `<img src="cid:checkin-qr" width="220" height="220" alt="Check-in QR code" style="margin:16px auto;display:block"/>` : ""}
    <p style="font-size:12px;letter-spacing:3px;color:#8a6d3b">CONFIRMATION CODE</p>
    <p style="font-size:26px;letter-spacing:6px;color:#4a1424;margin:4px 0">${code}</p>
    <p style="font-size:14px">Please show this at the entrance.</p>` : `<p>We'll miss you, and we're grateful you let us know.</p>`}
    <p style="font-style:italic;color:#8a6d3b">Two hearts, one throne</p>`);
  const tasks: Promise<unknown>[] = [
    send(r.email, "Your RSVP for Danielle & Obi's wedding", guest, `rsvp-confirm-${r.id}`, qr ? [qr] : undefined),
  ];
  const admins = (process.env["ADMIN_NOTIFY_EMAILS"] ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const admin = shell(`<h2 style="color:#4a1424">New RSVP received</h2><p>Hey Obi, <strong>${name}</strong> just filled out the wedding RSVP form.</p><p>${esc(r.email)}</p><p>Attending: ${r.attending ? "Yes" : "No"}<br/>Party size: ${r.guest_count}<br/>Code: ${code}</p><p>Check the admin dashboard for more information.</p><p><a href="${publicSite}/admin/rsvps" style="color:#4a1424">Open the admin dashboard</a></p>`);
  admins.forEach((a, i) => tasks.push(send(a, `[RSVP] ${r.full_name} · ${r.attending ? "Yes" : "No"} · party of ${r.guest_count}`, admin, `rsvp-admin-${r.id}-${i}`)));
  const results = await Promise.allSettled(tasks);
  results.forEach((x) => x.status === "rejected" && console.error("RSVP email failed", x.reason));
}
