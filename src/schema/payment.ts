import { z } from "zod";

export const InitiatePaymentSchema = z.object({
    cart_id: z.string(),
    cart_currency: z.string().length(3),
    cart_amount: z.number().positive(),
    cart_description: z.string(),
    booking_ids: z.array(z.number().int().positive()).optional(),
    service_ids: z.array(z.number().int().positive()).optional(),
    redeemed_coupon_id: z.number().int().positive().optional(),
    redeemed_points: z.number().int().nonnegative().optional()
}).superRefine((val, ctx) => {
    const hasBookings = Array.isArray(val.booking_ids) && val.booking_ids.length > 0;
    const hasServices = Array.isArray(val.service_ids) && val.service_ids.length > 0;
    if (!hasBookings && !hasServices) {
        ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Either booking_ids or service_ids must be present and non-empty"
        });
    }
});


export type InitiatePaymentInput = z.infer<typeof InitiatePaymentSchema>;