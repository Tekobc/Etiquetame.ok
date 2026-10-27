import { describe, expect, it } from "vitest";
import { sanitizeUploadFileName } from "../orders/files";
import { slugifyProductName } from "../products/slug";
import { orderRequestSchema } from "./order";

const validOrder = {
  clientRequestId: "4d1d1d8c-5f67-4fb5-a6ce-029975777649",
  customerName: "Luana",
  phone: "+54 9 11 1234-5678",
  summary: "Stickers para mi emprendimiento",
  files: [],
};

describe("orderRequestSchema", () => {
  it("normalizes an Argentine phone number to digits", () => {
    const result = orderRequestSchema.parse(validOrder);
    expect(result.phone).toBe("5491112345678");
  });

  it("rejects a file with a disallowed MIME type or extension", () => {
    const result = orderRequestSchema.safeParse({
      ...validOrder,
      files: [{ name: "script.html", type: "text/html", size: 32 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects individual and combined file size limits", () => {
    const oversized = orderRequestSchema.safeParse({
      ...validOrder,
      files: [{ name: "large.jpg", type: "image/jpeg", size: 15 * 1024 * 1024 + 1 }],
    });
    const total = orderRequestSchema.safeParse({
      ...validOrder,
      files: Array.from({ length: 3 }, (_, index) => ({
        name: `design-${index}.jpg`,
        type: "image/jpeg",
        size: 14 * 1024 * 1024,
      })),
    });

    expect(oversized.success).toBe(false);
    expect(total.success).toBe(false);
  });

  it("rejects more than ten attachments", () => {
    const result = orderRequestSchema.safeParse({
      ...validOrder,
      files: Array.from({ length: 11 }, (_, index) => ({
        name: `design-${index}.jpg`,
        type: "image/jpeg",
        size: 100,
      })),
    });
    expect(result.success).toBe(false);
  });
});

describe("sanitizeUploadFileName", () => {
  it("removes path segments and unsafe characters while preserving accents", () => {
    const result = sanitizeUploadFileName("../Diseño final (1).jpg");
    expect(result).toBe("Diseño-final-1-.jpg");
    expect(result).not.toContain("..");
    expect(result).not.toContain("/");
  });
});

describe("slugifyProductName", () => {
  it("normalizes accents, spaces, and emoji into a stable slug", () => {
    expect(slugifyProductName("Diseño para mamá ✨")).toBe("diseno-para-mama");
  });
});
