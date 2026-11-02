import { describe, expect, it } from 'vitest'
import { FREE } from '../types/game'
import { WINNING_LINES, evaluateBoard, isCellMarked } from '../utils/bingo'
import { generateBoard } from '../utils/board'
import { seededRandom } from '../utils/shuffle'
import { SAMPLE_DECK, allAnswers, answersForMarked } from './helpers'

const board = generateBoard(SAMPLE_DECK, seededRandom(42))

describe('winning lines', () => {
  it('defines 12 lines of 5 cells', () => {
    expect(WINNING_LINES).toHaveLength(12)
    for (const line of WINNING_LINES) expect(line).toHaveLength(5)
    expect(WINNING_LINES[0]).toEqual([0, 1, 2, 3, 4])
    expect(WINNING_LINES[5]).toEqual([0, 5, 10, 15, 20])
    expect(WINNING_LINES[10]).toEqual([0, 6, 12, 18, 24])
    expect(WINNING_LINES[11]).toEqual([4, 8, 12, 16, 20])
  })
})

describe('evaluateBoard', () => {
  it('detects a horizontal Bingo', () => {
    const result = evaluateBoard(board, answersForMarked(board, [0, 1, 2, 3, 4]))
    expect(result.hasBingo).toBe(true)
    expect(result.winningLines).toEqual([[0, 1, 2, 3, 4]])
    expect(result.totalWinningLines).toBe(1)
  })

  it('detects a vertical Bingo', () => {
    const result = evaluateBoard(board, answersForMarked(board, [3, 8, 13, 18, 23]))
    expect(result.hasBingo).toBe(true)
    expect(result.winningLines).toEqual([[3, 8, 13, 18, 23]])
  })

  it('detects both diagonals, with the free centre counting', () => {
    const main = evaluateBoard(board, answersForMarked(board, [0, 6, 18, 24]))
    expect(main.winningLines).toEqual([[0, 6, 12, 18, 24]])
    const anti = evaluateBoard(board, answersForMarked(board, [4, 8, 16, 20]))
    expect(anti.winningLines).toEqual([[4, 8, 12, 16, 20]])
  })

  it('counts the free centre for the middle row and column', () => {
    const row = evaluateBoard(board, answersForMarked(board, [10, 11, 13, 14]))
    expect(row.winningLines).toEqual([[10, 11, 12, 13, 14]])
    const col = evaluateBoard(board, answersForMarked(board, [2, 7, 17, 22]))
    expect(col.winningLines).toEqual([[2, 7, 12, 17, 22]])
    expect(isCellMarked(FREE, {})).toBe(true)
  })

  it('returns No Bingo when every answer is NO', () => {
    const result = evaluateBoard(board, allAnswers('no'))
    expect(result).toEqual({ hasBingo: false, winningLines: [], winningCellIndices: [], totalWinningLines: 0 })
  })

  it('returns 12 winning lines when every answer is YES', () => {
    const result = evaluateBoard(board, allAnswers('yes'))
    expect(result.hasBingo).toBe(true)
    expect(result.totalWinningLines).toBe(12)
    expect(result.winningCellIndices).toEqual(Array.from({ length: 25 }, (_, i) => i))
  })

  it('counts multiple wins and deduplicates shared cells', () => {
    const result = evaluateBoard(board, answersForMarked(board, [0, 1, 2, 3, 4, 5, 10, 15, 20]))
    expect(result.totalWinningLines).toBe(2)
    expect(result.winningLines).toEqual([
      [0, 1, 2, 3, 4],
      [0, 5, 10, 15, 20],
    ])
    expect(result.winningCellIndices).toEqual([0, 1, 2, 3, 4, 5, 10, 15, 20])
  })

  it('does not award Bingo for four marked cells in a line', () => {
    const result = evaluateBoard(board, answersForMarked(board, [0, 1, 2, 3]))
    expect(result.hasBingo).toBe(false)
    const diag = evaluateBoard(board, answersForMarked(board, [0, 6, 18]))
    expect(diag.hasBingo).toBe(false)
  })

  it('ignores unknown IDs and missing answers safely', () => {
    const result = evaluateBoard(board, {})
    expect(result.hasBingo).toBe(false)
    expect(isCellMarked('q01', {})).toBe(false)
  })

  it('is identical regardless of language (uses IDs only)', () => {
    const answers = answersForMarked(board, [20, 21, 22, 23, 24])
    const a = evaluateBoard(board, answers)
    const b = evaluateBoard([...board], { ...answers })
    expect(a).toEqual(b)
  })
})
