import { QUESTION_IDS, isQuestionId } from '../data/questions'
import { FREE, type BoardCellId } from '../types/game'
import { shuffle, type RandomSource } from './shuffle'

export const BOARD_SIZE = 5
export const CELL_COUNT = BOARD_SIZE * BOARD_SIZE
/** Zero-based: row 2, column 2, flat index 12. */
export const CENTER_INDEX = 12
/** Cards dealt per game: one for every square except the free centre. */
export const DECK_SIZE = CELL_COUNT - 1

/**
 * Deal the cards for one game: DECK_SIZE question IDs drawn at random from the pool.
 * The result is already shuffled, so it doubles as the swipe order.
 */
export function drawDeck(pool: readonly string[] = QUESTION_IDS, random: RandomSource = Math.random): string[] {
  const unique = Array.from(new Set(pool))
  if (unique.length < DECK_SIZE) {
    throw new Error(`drawDeck needs at least ${DECK_SIZE} unique question IDs, received ${unique.length}`)
  }
  return shuffle(unique, random).slice(0, DECK_SIZE)
}

/**
 * Build a randomized 5x5 arrangement from the 24 dealt question IDs.
 * Randomization is independent of answers and of the question order
 * the player saw during swiping.
 */
export function generateBoard(questionIds: readonly string[], random: RandomSource = Math.random): BoardCellId[] {
  const unique = Array.from(new Set(questionIds))
  if (unique.length !== DECK_SIZE) {
    throw new Error(`generateBoard expects ${DECK_SIZE} unique question IDs, received ${unique.length}`)
  }
  const shuffled = shuffle(unique, random)
  const board: BoardCellId[] = []
  let cursor = 0
  for (let i = 0; i < CELL_COUNT; i++) {
    if (i === CENTER_INDEX) {
      board.push(FREE)
    } else {
      board.push(shuffled[cursor++]!)
    }
  }
  return board
}

export function indexToRowCol(index: number): { row: number; col: number } {
  return { row: Math.floor(index / BOARD_SIZE), col: index % BOARD_SIZE }
}

export function rowColToIndex(row: number, col: number): number {
  return row * BOARD_SIZE + col
}

/** True when the value is a structurally valid, complete board arrangement. */
export function isValidBoard(value: unknown): value is BoardCellId[] {
  if (!Array.isArray(value) || value.length !== CELL_COUNT) return false
  if (value[CENTER_INDEX] !== FREE) return false
  const ids = value.filter((_, i) => i !== CENTER_INDEX)
  if (!ids.every(isQuestionId)) return false
  return new Set(ids).size === DECK_SIZE
}
