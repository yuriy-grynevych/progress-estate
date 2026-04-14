/**
 * Transforms a Cloudinary URL by inserting transformation params.
 * For local /uploads/ paths, returns the original URL untouched.
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

export function isCloudinary(url: string): boolean {
  return url.includes("res.cloudinary.com");
}

/**
 * Extracts Cloudinary public_id from a secure_url.
 * e.g. https://res.cloudinary.com/xxx/image/upload/v123/properties/abc/uuid.webp
 *   → properties/abc/uuid
 */
export function extractPublicId(url: string): string {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/);
  return match ? match[1] : "";
}
