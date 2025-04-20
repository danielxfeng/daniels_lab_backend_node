import slug from "limax";

/**
 * A small tool to generate a slug from a title.
 *
 * @param title The title to be converted to a slug.
 * @param re The optional flag, a random postfix is added to the slug if true.
 * @returns the generated slug.
 */
const generateSlug = (title: string, re?: boolean): string => {
  if (re) {
    return `title-${String(Math.floor(1000 + Math.random() * 9000))}`;
  }
  const slugText = slug(title).trim();
  if (slugText.length < 5)
    return `${slugText}-${String(Math.floor(1000 + Math.random() * 9000))}`;
  if (slugText.length > 50) return `${slugText.slice(0, 50)}`;
  return slugText;
};

export { generateSlug };
