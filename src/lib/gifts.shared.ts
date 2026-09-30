import { z } from "zod";
export const giftIdentitySchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z
    .string()
    .trim()
    .email()
    .max(255)
    .transform((v) => v.toLowerCase()),
});
export const giftSubmissionSchema = z.discriminatedUnion("kind", [
  giftIdentitySchema.extend({
    requestId: z.string().uuid(),
    kind: z.literal("money"),
    amount: z.number().positive().max(100000000).multipleOf(0.01),
  }),
  giftIdentitySchema.extend({
    requestId: z.string().uuid(),
    kind: z.literal("items"),
    items: z
      .array(z.string().max(50))
      .min(1)
      .max(10)
      .refine((v) => new Set(v).size === v.length, "Select each gift only once"),
  }),
]);
export type GiftPledge = {
  id: string;
  full_name: string;
  email: string;
  kind: "money" | "items";
  amount: number | null;
  items: { id: string; name: string }[];
  created_at: string;
  notification_sent_at: string | null;
};
export const giftBank = { bank: "PocketApp", name: "Danielle Dan-Egua", number: "7718648760" };
export const naira = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(amount);
