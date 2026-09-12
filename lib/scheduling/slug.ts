import { db } from '@/lib/db/prisma';

/**
 * Normalizes a string into a URL-friendly slug.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric chars with hyphen
    .replace(/^-+|-+$/g, '')    // Remove leading & trailing hyphens
    .replace(/-{2,}/g, '-');     // Replace multiple hyphens with single hyphen
}

/**
 * Generates a unique event slug for a specific user ID.
 * If slug exists for the user, appends -1, -2, etc.
 */
export async function generateUniqueUserSlug(
  userId: string,
  baseText: string,
  excludeEventId?: string
): Promise<string> {
  const initialSlug = slugify(baseText) || 'event';
  let candidateSlug = initialSlug;
  let counter = 1;

  while (true) {
    try {
      const existing = await db.eventType.findUnique({
        where: {
          userId_slug: {
            userId,
            slug: candidateSlug,
          },
        },
      });

      // If no conflict or conflict is the current event being updated
      if (!existing || (excludeEventId && existing.id === excludeEventId)) {
        return candidateSlug;
      }

      candidateSlug = `${initialSlug}-${counter}`;
      counter++;
    } catch {
      // Fallback if DB disconnected in dev
      return candidateSlug;
    }
  }
}
