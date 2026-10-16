import { z } from "zod";

export const MAX_ORDER_FILES = 10;
export const MAX_ORDER_FILE_BYTES = 15 * 1024 * 1024;
export const MAX_ORDER_TOTAL_BYTES = 40 * 1024 * 1024;

const allowedFiles = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
  "image/heic": ["heic"],
  "image/heif": ["heif"],
  "application/pdf": ["pdf"],
  "image/svg+xml": ["svg"],
  "application/zip": ["zip"],
  "application/postscript": ["ai", "eps"],
  "application/illustrator": ["ai"],
  "application/eps": ["eps"],
  "image/x-eps": ["eps"],
} as const;

export const orderFileSchema = z
  .object({
    name: z.string().trim().min(1).max(255),
    type: z.string().trim().toLowerCase(),
    size: z.number().int().min(1).max(MAX_ORDER_FILE_BYTES),
  })
  .superRefine((file, context) => {
    const extension = file.name.split(".").pop()?.toLowerCase();
    const extensions =
      allowedFiles[file.type as keyof typeof allowedFiles] as
        | readonly string[]
        | undefined;

    if (!extensions || !extension || !extensions.includes(extension)) {
      context.addIssue({
        code: "custom",
        message: "El tipo de archivo no está permitido.",
        path: ["type"],
      });
    }
  });

export const orderRequestSchema = z
  .object({
    clientRequestId: z.string().uuid(),
    customerName: z.string().trim().min(2).max(80),
    phone: z
      .string()
      .trim()
      .min(6)
      .max(40)
      .transform((value) => value.replace(/\D/g, ""))
      .pipe(z.string().min(6).max(20)),
    summary: z.string().trim().min(5).max(300),
    details: z.string().trim().max(3000).default(""),
    categorySlug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .nullable()
      .default(null),
    productId: z.string().uuid().nullable().default(null),
    website: z.string().max(500).default(""),
    turnstileToken: z.string().trim().min(1).max(2048),
    files: z.array(orderFileSchema).max(MAX_ORDER_FILES),
  })
  .superRefine((order, context) => {
    const totalBytes = order.files.reduce((total, file) => total + file.size, 0);
    if (totalBytes > MAX_ORDER_TOTAL_BYTES) {
      context.addIssue({
        code: "custom",
        message: "Los archivos superan el límite total de 40 MB.",
        path: ["files"],
      });
    }
  });

export type OrderRequest = z.infer<typeof orderRequestSchema>;
