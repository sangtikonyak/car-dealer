import { z } from 'zod';

export const newsletterSubscriptionSchema = z
  .object({ email: z.string().trim().email().max(320) })
  .strict();

export type NewsletterSubscriptionInput = z.infer<typeof newsletterSubscriptionSchema>;
