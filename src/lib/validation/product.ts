import { z } from "zod";

export const productInputSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(1000).default(""),
  categoryId: z.string().uuid(),
});

export const updateProductInputSchema = productInputSchema.omit({ id: true });

export type ProductInput = z.infer<typeof productInputSchema>;
