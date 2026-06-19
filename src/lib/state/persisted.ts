// Pure serialization helpers — no runes, safe to import in any context.

export function serialize<T>(v: T): string {
  return JSON.stringify(v);
}

export function parseStored<T>(raw: string | null, initial: T): T {
  if (raw === null) return initial;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return initial;
  }
}
