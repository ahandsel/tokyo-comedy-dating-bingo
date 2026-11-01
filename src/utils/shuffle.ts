export type RandomSource = () => number

/**
 * Fisher-Yates shuffle. Returns a new array; the input is not mutated.
 * `random` must return a float in [0, 1). Injectable for deterministic tests.
 */
export function shuffle<T>(items: readonly T[], random: RandomSource = Math.random): T[] {
  const result = items.slice()
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    const tmp = result[i]!
    result[i] = result[j]!
    result[j] = tmp
  }
  return result
}

/** Small seeded PRNG (mulberry32) for reproducible tests. */
export function seededRandom(seed: number): RandomSource {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
