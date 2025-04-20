import removeMd from "remove-markdown";

const extract_excerpt = (text: string, maxLength: number): string => {
  const cleanedText = removeMd(text).trim();
  if (cleanedText.length < maxLength) return cleanedText;
  const excerpt = cleanedText.slice(0, maxLength);
  return `${excerpt}...`;
};

export { extract_excerpt };
