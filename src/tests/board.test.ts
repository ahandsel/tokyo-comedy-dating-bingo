import { describe, expect, it } from 'vitest'
import { QUESTION_IDS } from '../data/questions'
import { FREE } from '../types/game'
import { CENTER_INDEX, DECK_SIZE, drawDeck, generateBoard, indexToRowCol, isValidBoard } from '../utils/board'
import { seededRandom, shuffle } from '../utils/shuffle'
import { SAMPLE_DECK, answerAll, memoryStore } from './helpers'

describe('shuffle', () => {
  it('returns a permutation without mutating the input', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8]
    const copy = [...input]
    const out = shuffle(input, seededRandom(3))
    expect(input).toEqual(copy)
    expect([...out].sort((a, b) => a - b)).toEqual(copy)
  })

  it('is deterministic for a given seed and varies across seeds', () => {
    expect(shuffle(QUESTION_IDS, seededRandom(1))).toEqual(shuffle(QUESTION_IDS, seededRandom(1)))
    expect(shuffle(QUESTION_IDS, seededRandom(1))).not.toEqual(shuffle(QUESTION_IDS, seededRandom(2)))
  })
})

describe('drawDeck', () => {
  it('deals 24 different questions from the pool', () => {
    for (let seed = 0; seed < 20; seed++) {
      const deck = drawDeck(QUESTION_IDS, seededRandom(seed))
      expect(deck).toHaveLength(DECK_SIZE)
      expect(new Set(deck).size).toBe(DECK_SIZE)
      expect(deck.every((id) => QUESTION_IDS.includes(id))).toBe(true)
    }
  })

  it('leaves different cards out across games, and can deal every card', () => {
    const dealt = new Set<string>()
    const leftOut = new Set<string>()
    for (let seed = 0; seed < 100; seed++) {
      const deck = drawDeck(QUESTION_IDS, seededRandom(seed))
      deck.forEach((id) => dealt.add(id))
      leftOut.add(QUESTION_IDS.filter((id) => !deck.includes(id)).join(','))
    }
    expect([...dealt].sort()).toEqual([...QUESTION_IDS].sort())
    expect(leftOut.size).toBeGreaterThan(1)
  })

  it('is deterministic for a seed and rejects a pool too small for a board', () => {
    expect(drawDeck(QUESTION_IDS, seededRandom(4))).toEqual(drawDeck(QUESTION_IDS, seededRandom(4)))
    expect(drawDeck(SAMPLE_DECK, seededRandom(4))).toHaveLength(DECK_SIZE)
    expect(() => drawDeck(SAMPLE_DECK.slice(1))).toThrow()
    expect(() => drawDeck([...SAMPLE_DECK.slice(1), 'q02'])).toThrow()
  })
})

describe('generateBoard', () => {
  it('has 25 cells with FREE at the centre (row 2, col 2, index 12)', () => {
    const board = generateBoard(SAMPLE_DECK, seededRandom(5))
    expect(board).toHaveLength(25)
    expect(board[CENTER_INDEX]).toBe(FREE)
    expect(indexToRowCol(CENTER_INDEX)).toEqual({ row: 2, col: 2 })
    expect(board.filter((c) => c === FREE)).toHaveLength(1)
  })

  it('places all 24 dealt questions exactly once and loses none', () => {
    for (let seed = 0; seed < 20; seed++) {
      const board = generateBoard(SAMPLE_DECK, seededRandom(seed))
      const ids = board.filter((c) => c !== FREE)
      expect(ids).toHaveLength(24)
      expect([...ids].sort()).toEqual([...SAMPLE_DECK].sort())
    }
  })

  it('rejects an invalid number of questions', () => {
    expect(() => generateBoard(SAMPLE_DECK.slice(0, 10))).toThrow()
    expect(() => generateBoard(QUESTION_IDS)).toThrow()
    expect(() => generateBoard([...SAMPLE_DECK, 'q01'])).not.toThrow()
  })

  it('validates board structure', () => {
    const board = generateBoard(SAMPLE_DECK, seededRandom(1))
    expect(isValidBoard(board)).toBe(true)
    expect(isValidBoard([...board.slice(0, 24)])).toBe(false)
    const noFree = [...board]
    noFree[CENTER_INDEX] = 'q01'
    expect(isValidBoard(noFree)).toBe(false)
    const dup = [...board]
    dup[0] = dup[1]!
    expect(isValidBoard(dup)).toBe(false)
  })

  it('is independent of the question order and of answers', () => {
    const { store: a } = memoryStore(11)
    const { store: b } = memoryStore(11)
    a.start()
    b.start()
    answerAll(a, () => 'yes')
    answerAll(b, () => 'no')
    expect(a.state.boardQuestionIds).toEqual(b.state.boardQuestionIds)
    expect(a.state.boardQuestionIds).not.toEqual([...a.state.questionOrder.slice(0, 12), FREE, ...a.state.questionOrder.slice(12)])
  })
})

describe('board in the game store', () => {
  it('fills the board with exactly the cards the game dealt', () => {
    const { store } = memoryStore(14)
    store.start()
    const dealt = [...store.state.questionOrder]
    answerAll(store)
    const ids = store.state.boardQuestionIds!.filter((c) => c !== FREE)
    expect([...ids].sort()).toEqual(dealt.sort())
  })

  it('keeps answers linked to the correct IDs on the board', () => {
    const { store } = memoryStore(2)
    store.start()
    const chosen = new Set(store.state.questionOrder.slice(0, 5))
    answerAll(store, (id) => (chosen.has(id) ? 'yes' : 'no'))
    const board = store.state.boardQuestionIds!
    board.forEach((cell) => {
      if (cell === FREE) return
      expect(store.state.answers[cell]).toBe(chosen.has(cell) ? 'yes' : 'no')
    })
  })

  it('keeps the saved board order stable across reloads and answer edits', () => {
    const { store, storage } = memoryStore(3)
    store.start()
    answerAll(store, () => 'no')
    const board = [...store.state.boardQuestionIds!]
    store.setAnswer(board[0] as string, 'yes')
    expect(store.state.boardQuestionIds).toEqual(board)

    const { store: reloaded } = memoryStore(99, storage)
    expect(reloaded.state.phase).toBe('results')
    expect(reloaded.state.boardQuestionIds).toEqual(board)
    expect(reloaded.state.answers[board[0] as string]).toBe('yes')
  })
})
