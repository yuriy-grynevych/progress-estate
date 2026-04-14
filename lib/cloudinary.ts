const CLOUD_NAME = "dkecfgzdb";

/**
 * For Cloudinary upload URLs — inserts transform params.
 * For all other URLs (S3, local) — returns as-is.
 */
export function cloudinaryUrl(
  url: string,
  opts: { width?: number; quality?: number } = {}
): string {
  if (!url.includes("res.cloudinary.com")) return url;
  const parts: string[] = ["f_auto"];
  if (opts.width) parts.push(`w_${opts.width}`);
  if (opts.quality) parts.push(`q_${opts.quality}`);
  return url.replace("/upload/", `/upload/${parts.join(",")}/`);
}

/**
 * Returns true for external URLs (S3, Cloudinary etc.).
 * These should be served directly — no Next.js re-processing.
 */
export function isExternalImage(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}

/**
 * Extracts Cloudinary public_id from a secure_url.
 */
export function extractPublicId(url: string): string {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/);
  return match ? match[1] : "";
}
