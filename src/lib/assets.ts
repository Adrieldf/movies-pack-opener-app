export const BASE_PATH =
  process.env.NEXT_PUBLIC_BASE_PATH ??
  (process.env.NODE_ENV === "production" ? "/movies-pack-opener-app" : "");

/**
 * Returns a fully qualified path for static assets in the public folder,
 * taking into account Next.js basePath for GitHub Pages static export.
 */
export function getAssetUrl(path: string): string {
  if (!path) return "";
  // If it's already an external URL or data URI, return as-is
  if (/^(?:[a-z]+:)?\/\//i.test(path) || path.startsWith("data:")) {
    return path;
  }
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (BASE_PATH && cleanPath.startsWith(BASE_PATH)) {
    return cleanPath;
  }
  return `${BASE_PATH}${cleanPath}`;
}
