/**
 * @file extract_excerpt.ts
 * @description The utility function to extract an excerpt from a given text.
 */
import removeMd from "remove-markdown";

const extract_excerpt = (text: string, maxLength: number): string => {
  const cleanedText = removeMd(text)
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (cleanedText.length <= maxLength) return cleanedText;
  return `${cleanedText.slice(0, maxLength).trim()}...`;
};

const extract_excerpt_highlight = (
  text: string | null,
  maxLength: number
): string | null => {
  if (!text) return null;
  const extracted = extract_excerpt(text, maxLength);
  return extracted.replace(/@@HL_START@@/g, "**").replace(/@@HL_END@@/g, "**");
};

export { extract_excerpt, extract_excerpt_highlight };
