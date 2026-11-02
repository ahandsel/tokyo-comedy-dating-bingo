import { nextTick } from 'vue'
import { describe, expect, it } from 'vitest'
import { createGameStore, createInitialState } from '../composables/useGame'
import { GAME_STATE_KEY, createGameStorage, createMemoryStorage, parseGameState } from '../composables/useGameStorage'
import { QUESTION_IDS } from '../data/questions'
import { generateBoard } from '../utils/board'
import { seededRandom } from '../utils/shuffle'
import { SAMPLE_DECK, allAnswers, answerAll, memoryStore } from './helpers'

describe('parseGameState', () => {
  it('accepts a fresh welcome state and a complete results state', () => {
    expect(parseGameState(createInitialState())).toEqual(createInitialState())
    const { store } = memoryStore(4)
    store.start()
    answerAll(store, () => 'yes')
    const roundTrip = parseGameState(JSON.parse(JSON.stringify(store.state)))
    expect(roundTrip).toEqual(JSON.parse(JSON.stringify(store.state)))
  })

  it('rejects malformed or inconsistent data', () => {
    const { store } = memoryStore(4)
    store.start()
    store.answer('yes')
    const good = JSON.parse(JSON.stringify(store.state))
    expect(parseGameState(good)).not.toBeNull()
    expect(parseGameState(null)).toBeNull()
    expect(parseGameState('nope')).toBeNull()
    expect(parseGameState({ ...good, version: 99 })).toBeNull()
    expect(parseGameState({ ...good, phase: 'done' })).toBeNull()
    expect(parseGameState({ ...good, questionOrder: good.questionOrder.slice(1) })).toBeNull()
    expect(parseGameState({ ...good, questionOrder: [...QUESTION_IDS] })).toBeNull()
    expect(parseGameState({ ...good, questionOrder: [...good.questionOrder.slice(0, 23), good.questionOrder[1]] })).toBeNull()
    expect(parseGameState({ ...good, answers: { q01: 'maybe' } })).toBeNull()
    expect(parseGameState({ ...good, answers: { hacked: 'yes' } })).toBeNull()
    expect(parseGameState({ ...good, currentQuestionIndex: -1 })).toBeNull()
    expect(parseGameState({ ...good, currentQuestionIndex: 5 })).toBeNull()
    expect(parseGameState({ ...good, boardQuestionIds: ['q01'] })).toBeNull()
    expect(parseGameState({ ...good, phase: 'results' })).toBeNull()
  })
})

describe('persistence', () => {
  it('saves automatically and restores answers, order, and index after a reload', async () => {
    const storage = createMemoryStorage()
    const { store } = memoryStore(8, storage)
    store.start()
    store.answer('yes')
    store.answer('no')
    await nextTick()
    const { store: reloaded } = memoryStore(1, storage)
    expect(reloaded.state.phase).toBe('playing')
    expect(reloaded.state.questionOrder).toEqual(store.state.questionOrder)
    expect(reloaded.state.answers).toEqual(store.state.answers)
    expect(reloaded.state.answerHistory).toEqual(store.state.answerHistory)
    expect(reloaded.state.currentQuestionIndex).toBe(2)
    expect(reloaded.currentQuestionId.value).toBe(store.currentQuestionId.value)
  })

  it('restores the final board positions after a reload', async () => {
    const storage = createMemoryStorage()
    const { store } = memoryStore(9, storage)
    store.start()
    answerAll(store, (_, i) => (i % 2 === 0 ? 'yes' : 'no'))
    await nextTick()
    const { store: reloaded } = memoryStore(1, storage)
    expect(reloaded.state.phase).toBe('results')
    expect(reloaded.state.boardQuestionIds).toEqual(store.state.boardQuestionIds)
    expect(reloaded.bingo.value).toEqual(store.bingo.value)
    expect(reloaded.stats.value).toEqual(store.stats.value)
  })

  it('restart clears the saved game and resets state', async () => {
    const storage = createMemoryStorage()
    const { store } = memoryStore(10, storage)
    store.start()
    answerAll(store)
    await nextTick()
    expect(storage.getItem(GAME_STATE_KEY)).not.toBeNull()
    store.restart()
    await nextTick()
    expect(store.state).toMatchObject(createInitialState())
    expect(storage.getItem(GAME_STATE_KEY)).toBeNull()
    const { store: reloaded } = memoryStore(1, storage)
    expect(reloaded.state).toMatchObject(createInitialState())
  })

  it('handles corrupted LocalStorage safely', () => {
    const storage = createMemoryStorage()
    storage.setItem(GAME_STATE_KEY, '{"version":1,"phase":"playing"')
    const gameStorage = createGameStorage(storage)
    expect(gameStorage.load()).toBeNull()
    expect(gameStorage.hadCorruptedData).toBe(true)
    const store = createGameStore({ storage: gameStorage })
    expect(store.loadedCorruptedData.value).toBe(true)
    expect(store.state.phase).toBe('welcome')
    store.start()
    expect(store.state.questionOrder).toHaveLength(24)
    expect(store.loadedCorruptedData.value).toBe(false)
  })

  it('tolerates an unavailable storage backend', () => {
    const store = createGameStore({ storage: createGameStorage(null) })
    store.start()
    store.answer('yes')
    expect(store.state.currentQuestionIndex).toBe(1)
  })

  it('updating an answer on the results screen recalculates Bingo without reshuffling', async () => {
    const { store } = memoryStore(12)
    store.start()
    answerAll(store, () => 'no')
    const board = [...store.state.boardQuestionIds!]
    expect(store.bingo.value?.hasBingo).toBe(false)
    for (const i of [0, 1, 2, 3, 4]) store.setAnswer(board[i] as string, 'yes')
    expect(store.bingo.value?.hasBingo).toBe(true)
    expect(store.bingo.value?.winningLines).toEqual([[0, 1, 2, 3, 4]])
    expect(store.stats.value).toEqual({ yes: 5, no: 19, winningLines: 1 })
    expect(store.state.boardQuestionIds).toEqual(board)
    expect(store.setAnswer('nope', 'yes')).toBe(false)
    const undealt = QUESTION_IDS.find((id) => !store.state.questionOrder.includes(id))!
    expect(store.setAnswer(undealt, 'yes')).toBe(false)
    expect(store.state.answers[undealt]).toBeUndefined()
  })

  it('pauses and resumes a game from the welcome screen', () => {
    const { store } = memoryStore(13)
    store.start()
    store.answer('yes')
    store.goToWelcome()
    expect(store.hasPausedGame.value).toBe(true)
    store.resume()
    expect(store.state.phase).toBe('playing')
    expect(store.state.currentQuestionIndex).toBe(1)
    answerAll(store)
    store.goToWelcome()
    expect(store.hasSavedResults.value).toBe(true)
    store.resume()
    expect(store.state.phase).toBe('results')
    expect(Object.keys(store.state.answers)).toHaveLength(24)
  })
})

describe('stricter saved-state validation', () => {
  it('rejects a playing state that already has a board or has run past the last card', () => {
    const { store } = memoryStore(5)
    store.start()
    store.answer('yes')
    const good = JSON.parse(JSON.stringify(store.state))
    const board: string[] = []
    for (const id of SAMPLE_DECK) {
      if (board.length === 12) board.push('free')
      board.push(id)
    }
    expect(parseGameState({ ...good, boardQuestionIds: board })).toBeNull()
    const history = [...SAMPLE_DECK]
    const answers = Object.fromEntries(history.map((id) => [id, 'yes']))
    expect(
      parseGameState({ ...good, questionOrder: history, answerHistory: history, answers, currentQuestionIndex: 24 }),
    ).toBeNull()
  })

  it('rejects answers and undo history that do not follow the swipe order', () => {
    const { store } = memoryStore(5)
    store.start()
    store.answer('yes')
    const good = JSON.parse(JSON.stringify(store.state))
    const order: string[] = good.questionOrder
    // An answer with no swipe behind it would block its card when the player reaches it.
    expect(parseGameState({ ...good, answers: { ...good.answers, [order[5]!]: 'no' } })).toBeNull()
    // A history that skips ahead in the order would make undo jump to the wrong card.
    expect(parseGameState({ ...good, answers: { [order[3]!]: 'yes' }, answerHistory: [order[3]] })).toBeNull()
  })

  it('rejects a paused game that has every answer but no board', () => {
    const order = [...SAMPLE_DECK]
    const paused = { ...createInitialState(), questionOrder: order, answers: allAnswers('yes'), answerHistory: order, currentQuestionIndex: 24 }
    expect(parseGameState(paused)).toBeNull()
  })

  it('rejects a board that shows a card the game did not deal', () => {
    const { store } = memoryStore(15)
    store.start()
    answerAll(store)
    const saved = JSON.parse(JSON.stringify(store.state))
    const undealt = QUESTION_IDS.find((id) => !saved.questionOrder.includes(id))!
    const board = [...saved.boardQuestionIds]
    board[0] = undealt
    expect(parseGameState({ ...saved, boardQuestionIds: board })).toBeNull()
  })

  it('keeps a game saved before the pool grew past the original 24 questions', () => {
    const order = [...SAMPLE_DECK]
    const board = generateBoard(SAMPLE_DECK, seededRandom(1))
    const saved = { ...createInitialState(), phase: 'results', questionOrder: order, currentQuestionIndex: 24, answers: allAnswers('yes'), answerHistory: order, boardQuestionIds: board }
    expect(parseGameState(saved)).toEqual(saved)
  })

  it('accepts a saved board viewed from the welcome screen', () => {
    const { store } = memoryStore(6)
    store.start()
    answerAll(store)
    store.goToWelcome()
    const saved = JSON.parse(JSON.stringify(store.state))
    expect(parseGameState(saved)).toEqual(saved)
  })

  it('reports whether a storage backend exists', () => {
    expect(createGameStorage(null).available).toBe(false)
    expect(createGameStorage(createMemoryStorage()).available).toBe(true)
    expect(createGameStore({ storage: createGameStorage(null) }).storageAvailable).toBe(false)
  })

  it('only replays the reveal right after the final answer', () => {
    const { store } = memoryStore(7)
    expect(store.revealPending.value).toBe(false)
    store.start()
    answerAll(store)
    expect(store.revealPending.value).toBe(true)
    store.clearReveal()
    expect(store.revealPending.value).toBe(false)
    store.goToWelcome()
    store.resume()
    expect(store.revealPending.value).toBe(false)
  })
})
