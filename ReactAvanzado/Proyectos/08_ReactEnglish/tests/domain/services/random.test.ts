import { describe, it, expect } from 'vitest'
import { createSeededRandom, shuffle } from '@domain/services/random'

describe('random service', () => {
  it('seeded random: same seed gives same sequence', () => {
    const random1 = createSeededRandom(42)
    const sequence1 = Array.from({ length: 5 }, () => random1())

    const random2 = createSeededRandom(42)
    const sequence2 = Array.from({ length: 5 }, () => random2())

    expect(sequence1).toEqual(sequence2)
  })

  it('seeded random: different seeds differ', () => {
    const random1 = createSeededRandom(42)
    const sequence1 = Array.from({ length: 5 }, () => random1())

    const random2 = createSeededRandom(123)
    const sequence2 = Array.from({ length: 5 }, () => random2())

    expect(sequence1).not.toEqual(sequence2)
  })

  it('seeded random: values in [0,1)', () => {
    const random = createSeededRandom(999)
    for (let i = 0; i < 100; i++) {
      const value = random()
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })

  it('shuffle: does not mutate input', () => {
    const input: readonly number[] = [1, 2, 3, 4, 5]
    const random = createSeededRandom(42)
    const result = shuffle(input, random)

    expect(input).toEqual([1, 2, 3, 4, 5])
    expect(result).not.toBe(input)
  })

  it('shuffle: contains all original elements', () => {
    const input = [1, 2, 3, 4, 5]
    const random = createSeededRandom(42)
    const result = shuffle(input, random)

    expect(result.sort((a, b) => a - b)).toEqual(input.sort((a, b) => a - b))
  })

  it('shuffle: deterministic with seeded random', () => {
    const input = [1, 2, 3, 4, 5]

    const random1 = createSeededRandom(42)
    const result1 = shuffle(input, random1)

    const random2 = createSeededRandom(42)
    const result2 = shuffle(input, random2)

    expect(result1).toEqual(result2)
  })

  it('shuffle: empty array', () => {
    const input: readonly number[] = []
    const random = createSeededRandom(42)
    const result = shuffle(input, random)

    expect(result).toEqual([])
  })

  it('shuffle: single element', () => {
    const input = [42]
    const random = createSeededRandom(42)
    const result = shuffle(input, random)

    expect(result).toEqual([42])
  })
})
