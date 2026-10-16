export function sanitizeUploadFileName(fileName: string) {
  const cleaned = fileName
    .normalize("NFC")
    .replace(/[\u0000-\u001f\u007f/\\]/g, "-")
    .replace(/\.{2,}/g, ".")
    .replace(/[^\p{L}\p{N}._-]+/gu, "-")
    .replace(/^[.-]+|[.-]+$/g, "")
    .slice(-100);

  return cleaned || "archivo";
}
