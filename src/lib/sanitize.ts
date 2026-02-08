import DOMPurify from "dompurify";

const config = {
  ALLOWED_TAGS: [
    "p", "br", "strong", "em", "code", "span", "a", "u", "s",
    "h1", "h2", "h3", "ul", "ol", "li", "blockquote", "pre"
  ],
  ALLOWED_ATTR: ["href", "target", "class", "style", "data-page-id"],
};

/**
 * Sanitizes HTML content to prevent XSS attacks.
 * Should be used before rendering any user-generated content via dangerouslySetInnerHTML.
 */
export const sanitizeHtml = (html: string): string => {
  if (typeof window === "undefined") return html;
  return DOMPurify.sanitize(html, config) as string;
};

/**
 * Strips all HTML tags from a string.
 */
export const stripHtml = (html: string): string => {
  if (typeof window === "undefined") return html;
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] }) as string;
};

/**
 * Sanitizes plain text by removing potentially dangerous characters.
 */
export const sanitizeText = (text: string): string => {
  if (!text) return "";
  // Remove any HTML tags and trim whitespace
  return stripHtml(text).trim();
};

/**
 * Sanitizes a URL to ensure it's safe to use.
 * Returns null if the URL is invalid or potentially dangerous.
 */
export const sanitizeUrl = (url: string): string | null => {
  if (!url) return null;
  
  try {
    const parsed = new URL(url);
    // Only allow http, https, and mailto protocols
    if (!["http:", "https:", "mailto:"].includes(parsed.protocol)) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
};

/**
 * Sanitizes a search query by removing special characters that could cause issues.
 */
export const sanitizeSearchQuery = (query: string): string => {
  if (!query) return "";
  // Remove characters that could be problematic in search queries
  return query
    .replace(/[<>{}[\]\\]/g, "")
    .trim()
    .slice(0, 200); // Limit length
};
