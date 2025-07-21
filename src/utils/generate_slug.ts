import slug from "limax";
import { v4 as uuidv4 } from "uuid";

const generateSlug = (title: string, re?: boolean): string => {
  if (re) {
    return `${title}-${uuidv4()}`;
  }

  const slugText = slug(title).trim();

  if (slugText.length < 5) return `${slugText}-${uuidv4()}`;
  if (slugText.length > 50) return `${slugText.slice(0, 50)}`;
  return slugText;
};

export { generateSlug };
