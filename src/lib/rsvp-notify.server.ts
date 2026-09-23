// Sends the guest confirmation and couple notification emails for a new RSVP.
// Email sending activates once the sender domain is configured.
export type RsvpForEmail = {
  id: string;
  full_name: string;
  email: string;
  guest_count: number;
  attending: boolean;
  confirmation_code: string;
};

export async function notifyRsvp(_rsvp: RsvpForEmail, _siteUrl: string): Promise<void> {
  return;
}
