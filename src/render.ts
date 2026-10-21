const PLACEHOLDER = /\{\{([A-Z][A-Z0-9_]*)\}\}/g

/** The placeholder names a text uses, in order of first appearance, without duplicates. */
export const placeholdersIn = (text: string): string[] => [
  ...new Set([...text.matchAll(PLACEHOLDER)].map((m) => m[1] as string)),
]

/** Replaces every placeholder; throws naming the first value that is missing. */
export const render = (text: string, values: Record<string, string>): string => {
  const missing = placeholdersIn(text).filter((name) => values[name] === undefined)
  if (missing.length > 0) throw new Error(`missing placeholder value: ${missing.join(', ')}`)
  return text.replace(PLACEHOLDER, (_, name: string) => values[name] as string)
}
