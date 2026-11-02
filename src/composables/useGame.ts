import { computed, reactive, readonly, ref, watch } from 'vue'
import { QUESTION_IDS } from '../data/questions'
import type { Answer, BingoResult, GameState, GameStats } from '../types/game'
import { evaluateBoard } from '../utils/bingo'
import { DECK_SIZE, drawDeck, generateBoard } from '../utils/board'
import type { RandomSource } from '../utils/shuffle'
import { GAME_STATE_VERSION, createGameStorage, type GameStorage } from './useGameStorage'

export function createInitialState(): GameState {
  return {
    version: GAME_STATE_VERSION,
    phase: 'welcome',
    questionOrder: [],
    currentQuestionIndex: 0,
    answers: {},
    answerHistory: [],
    boardQuestionIds: null,
  }
}

export interface GameStoreOptions {
  storage?: GameStorage
  random?: RandomSource
}

/**
 * Game store built on a reactive GameState.
 * All rules operate on question IDs only, never on translated text,
 * so locale changes cannot affect gameplay.
 */
export function createGameStore(options: GameStoreOptions = {}) {
  const storage = options.storage ?? createGameStorage()
  const random = options.random ?? Math.random

  const state = reactive<GameState>(storage.load() ?? createInitialState())
  /** True from a failed load until the player starts a new game, which replaces the unreadable save. */
  const loadedCorruptedData = ref(storage.hadCorruptedData)
  const storageAvailable = storage.available

  /**
   * True from the final answer until the results screen has played its reveal.
   * Not persisted: reopening a saved board should not replay the reveal.
   */
  const revealPending = ref(false)

  watch(
    () => state,
    (value) => storage.save(value),
    { deep: true, flush: 'sync' },
  )

  const totalQuestions = DECK_SIZE

  const currentQuestionId = computed<string | null>(() =>
    state.phase === 'playing' ? (state.questionOrder[state.currentQuestionIndex] ?? null) : null,
  )

  const upcomingQuestionIds = computed<string[]>(() =>
    state.phase === 'playing' ? state.questionOrder.slice(state.currentQuestionIndex) : [],
  )

  const answeredCount = computed(() => Object.keys(state.answers).length)
  const remainingCount = computed(() => totalQuestions - answeredCount.value)
  const canUndo = computed(() => state.phase === 'playing' && state.answerHistory.length > 0)

  const bingo = computed<BingoResult | null>(() =>
    state.boardQuestionIds ? evaluateBoard(state.boardQuestionIds, state.answers) : null,
  )

  const stats = computed<GameStats>(() => {
    let yes = 0
    let no = 0
    for (const id of state.questionOrder) {
      if (state.answers[id] === 'yes') yes++
      else if (state.answers[id] === 'no') no++
    }
    return { yes, no, winningLines: bingo.value?.totalWinningLines ?? 0 }
  })

  function start() {
    const fresh = createInitialState()
    fresh.phase = 'playing'
    fresh.questionOrder = drawDeck(QUESTION_IDS, random)
    Object.assign(state, fresh)
    loadedCorruptedData.value = false
  }

  /** From the welcome screen: continue a paused game, show a saved board, or start fresh. */
  function resume() {
    if (state.phase !== 'welcome') return
    if (state.boardQuestionIds) state.phase = 'results'
    else if (state.questionOrder.length === totalQuestions) state.phase = 'playing'
    else start()
  }

  const hasPausedGame = computed(
    () => state.phase === 'welcome' && state.questionOrder.length === totalQuestions && !state.boardQuestionIds,
  )
  const hasSavedResults = computed(() => state.phase === 'welcome' && state.boardQuestionIds !== null)

  function finish() {
    // Pool order, not swipe order, so the board shuffle cannot depend on the order the cards were seen.
    const dealt = QUESTION_IDS.filter((id) => state.questionOrder.includes(id))
    state.boardQuestionIds = generateBoard(dealt, random)
    revealPending.value = true
    state.phase = 'results'
  }

  /** The results screen calls this once it has shown (or skipped) the reveal. */
  function clearReveal() {
    revealPending.value = false
  }

  /** Record an answer for the current question and advance. Returns false if ignored. */
  function answer(value: Answer): boolean {
    if (state.phase !== 'playing') return false
    const id = currentQuestionId.value
    if (!id || id in state.answers) return false
    state.answers[id] = value
    state.answerHistory.push(id)
    state.currentQuestionIndex++
    if (state.currentQuestionIndex >= totalQuestions) finish()
    return true
  }

  /** Reopen the most recently answered question. Returns the reopened ID or null. */
  function undo(): string | null {
    if (!canUndo.value) return null
    const id = state.answerHistory.pop()!
    delete state.answers[id]
    const index = state.questionOrder.indexOf(id)
    state.currentQuestionIndex = index
    return id
  }

  /** Edit an answer on the results screen. The board arrangement is untouched. */
  function setAnswer(id: string, value: Answer): boolean {
    if (state.phase !== 'results' || !state.questionOrder.includes(id)) return false
    state.answers[id] = value
    return true
  }

  /** Reset progress only. Locale preference lives elsewhere and is not affected. */
  function restart() {
    revealPending.value = false
    Object.assign(state, createInitialState())
    storage.clear()
  }

  function goToWelcome() {
    state.phase = 'welcome'
  }

  return {
    state: readonly(state),
    loadedCorruptedData: readonly(loadedCorruptedData),
    storageAvailable,
    revealPending: readonly(revealPending),
    clearReveal,
    totalQuestions,
    currentQuestionId,
    upcomingQuestionIds,
    answeredCount,
    remainingCount,
    canUndo,
    hasPausedGame,
    hasSavedResults,
    bingo,
    stats,
    start,
    resume,
    answer,
    undo,
    setAnswer,
    restart,
    goToWelcome,
  }
}

export type GameStore = ReturnType<typeof createGameStore>

let singleton: GameStore | null = null

/** App-wide game store (lazy singleton). */
export function useGame(): GameStore {
  if (!singleton) singleton = createGameStore()
  return singleton
}

/** Test hook: discard the singleton so the next useGame() starts fresh. */
export function resetGameStore(): void {
  singleton = null
}
