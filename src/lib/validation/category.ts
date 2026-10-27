import { z } from "zod";

export const categoryInputSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(1000).default(""),
});

export const updateCategoryInputSchema = categoryInputSchema.omit({ id: true });
