import { FREE, type Answers, type BingoResult, type BoardCellId } from '../types/game'
import { BOARD_SIZE, rowColToIndex } from './board'

function buildWinningLines(): number[][] {
  const lines: number[][] = []
  for (let r = 0; r < BOARD_SIZE; r++) {
    lines.push(Array.from({ length: BOARD_SIZE }, (_, c) => rowColToIndex(r, c)))
  }
  for (let c = 0; c < BOARD_SIZE; c++) {
    lines.push(Array.from({ length: BOARD_SIZE }, (_, r) => rowColToIndex(r, c)))
  }
  lines.push(Array.from({ length: BOARD_SIZE }, (_, i) => rowColToIndex(i, i)))
  lines.push(Array.from({ length: BOARD_SIZE }, (_, i) => rowColToIndex(i, BOARD_SIZE - 1 - i)))
  return lines
}

/** 5 rows, 5 columns, 2 diagonals: 12 potential winning lines. */
export const WINNING_LINES: readonly (readonly number[])[] = buildWinningLines()

/** A cell is marked when it is the free centre or its question was answered YES. */
export function isCellMarked(cell: BoardCellId, answers: Answers): boolean {
  return cell === FREE || answers[cell] === 'yes'
}

export function getMarkedCells(board: readonly BoardCellId[], answers: Answers): boolean[] {
  return board.map((cell) => isCellMarked(cell, answers))
}

/**
 * Language-independent Bingo evaluation.
 * Uses only board positions, question IDs, answers, and free-space status.
 */
export function evaluateBoard(board: readonly BoardCellId[], answers: Answers): BingoResult {
  const marked = getMarkedCells(board, answers)
  const winningLines = WINNING_LINES.filter((line) => line.every((i) => marked[i])).map((line) => [...line])
  const winningCellIndices = Array.from(new Set(winningLines.flat())).sort((a, b) => a - b)
  return {
    hasBingo: winningLines.length > 0,
    winningLines,
    winningCellIndices,
    totalWinningLines: winningLines.length,
  }
}
