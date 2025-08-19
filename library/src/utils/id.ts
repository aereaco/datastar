const counters: Record<string, number> = {}

export function generateId(name: string): number {
  if (!counters[name]) {
    counters[name] = 0
  }
  return ++counters[name]
}
