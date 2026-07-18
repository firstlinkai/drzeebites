import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
} from 'payload'

/**
 * Revalidate a list of Next.js paths, never throwing.
 *
 * Wrapped in try/catch so Payload hooks can never break an admin save, and so
 * the seed script (which runs outside the Next.js request context) still works.
 */
export const safeRevalidate = async (
  paths: string[],
  type?: 'layout' | 'page',
): Promise<void> => {
  try {
    const { revalidatePath } = await import('next/cache')
    for (const path of paths) {
      revalidatePath(path, type)
    }
  } catch (err) {
    // Outside the Next.js runtime (e.g. seed script) or revalidation failure —
    // log and move on; content saves must never fail because of ISR.
    const message = err instanceof Error ? err.message : String(err)
    console.warn(`[revalidate] skipped for ${paths.join(', ')}: ${message}`)
  }
}

type GetPaths = (doc: Record<string, unknown>) => string[]

/** afterChange hook factory: revalidates paths for the new AND previous doc (slug changes). */
export const revalidateAfterChange = (getPaths: GetPaths): CollectionAfterChangeHook => {
  return async ({ doc, previousDoc }) => {
    try {
      const paths = new Set<string>(getPaths(doc))
      if (previousDoc) {
        for (const path of getPaths(previousDoc)) paths.add(path)
      }
      await safeRevalidate([...paths])
    } catch (err) {
      console.warn('[revalidate] afterChange hook failed:', err)
    }
    return doc
  }
}

/** afterDelete hook factory. */
export const revalidateAfterDelete = (getPaths: GetPaths): CollectionAfterDeleteHook => {
  return async ({ doc }) => {
    try {
      await safeRevalidate(getPaths(doc))
    } catch (err) {
      console.warn('[revalidate] afterDelete hook failed:', err)
    }
    return doc
  }
}

/** Global afterChange hook factory (e.g. site-settings affects every page). */
export const revalidateGlobalAfterChange = (
  paths: string[],
  type?: 'layout' | 'page',
): GlobalAfterChangeHook => {
  return async ({ doc }) => {
    await safeRevalidate(paths, type)
    return doc
  }
}
