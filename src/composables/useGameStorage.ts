import { QUESTION_IDS, isQuestionId } from '../data/questions'
import type { Answer, Answers, GamePhase, GameState } from '../types/game'
import { isValidBoard } from '../utils/board'

export const GAME_STATE_KEY = 'tcdb:game'
export const GAME_STATE_VERSION = 1

const PHASES: readonly GamePhase[] = ['welcome', 'playing', 'results']

export interface GameStorage {
  load(): GameState | null
  save(state: GameState): void
  clear(): void
  /** True when the last load found data that could not be used. */
  readonly hadCorruptedData: boolean
  /** False when no storage backend exists; the game then lives in memory only. */
  readonly available: boolean
}

function isAnswer(value: unknown): value is Answer {
  return value === 'yes' || value === 'no'
}

function isPermutationOfQuestions(value: unknown): value is string[] {
  if (!Array.isArray(value) || value.length !== QUESTION_IDS.length) return false
  if (!value.every(isQuestionId)) return false
  return new Set(value).size === QUESTION_IDS.length
}

/**
 * Validate unknown JSON against the GameState shape.
 * Returns null for anything that is not a fully consistent saved game.
 */
export function parseGameState(raw: unknown): GameState | null {
  if (!raw || typeof raw !== 'object') return null
  const s = raw as Record<string, unknown>
  if (s.version !== GAME_STATE_VERSION) return null
  if (!PHASES.includes(s.phase as GamePhase)) return null
  const freshWelcome = s.phase === 'welcome' && Array.isArray(s.questionOrder) && s.questionOrder.length === 0
  if (!freshWelcome && !isPermutationOfQuestions(s.questionOrder)) return null
  if (typeof s.currentQuestionIndex !== 'number' || !Number.isInteger(s.currentQuestionIndex)) return null
  if (s.currentQuestionIndex < 0 || s.currentQuestionIndex > QUESTION_IDS.length) return null
  if (!s.answers || typeof s.answers !== 'object' || Array.isArray(s.answers)) return null
  const answers: Answers = {}
  for (const [id, value] of Object.entries(s.answers as Record<string, unknown>)) {
    if (!isQuestionId(id) || !isAnswer(value)) return null
    answers[id] = value
  }
  if (!Array.isArray(s.answerHistory) || !s.answerHistory.every(isQuestionId)) return null
  if (new Set(s.answerHistory).size !== s.answerHistory.length) return null
  if (!s.answerHistory.every((id) => id in answers)) return null
  if (s.boardQuestionIds !== null && !isValidBoard(s.boardQuestionIds)) return null
  const answerCount = Object.keys(answers).length
  // A board only exists once every question has been answered.
  if (s.boardQuestionIds !== null && answerCount !== QUESTION_IDS.length) return null
  if (s.phase === 'results' && s.boardQuestionIds === null) return null
  // While playing there is no board yet and the current card is always a real card.
  if (s.phase === 'playing' && (s.boardQuestionIds !== null || s.currentQuestionIndex >= QUESTION_IDS.length)) {
    return null
  }
  if (s.boardQuestionIds === null && s.answerHistory.length !== s.currentQuestionIndex) return null
  if (freshWelcome && (s.answerHistory.length !== 0 || Object.keys(answers).length !== 0 || s.boardQuestionIds !== null)) {
    return null
  }
  return {
    version: GAME_STATE_VERSION,
    phase: s.phase as GamePhase,
    questionOrder: [...(s.questionOrder as string[])],
    currentQuestionIndex: s.currentQuestionIndex,
    answers,
    answerHistory: [...(s.answerHistory as string[])],
    boardQuestionIds: s.boardQuestionIds === null ? null : [...(s.boardQuestionIds as string[])],
  }
}

/**
 * Wrap a Storage backend with validation.
 * Omit the argument to use LocalStorage when it works; pass `null` for an
 * explicitly storage-less game (tests, private browsing that throws).
 */
export function createGameStorage(storage: Storage | null = safeLocalStorage() ?? null): GameStorage {
  let hadCorruptedData = false
  return {
    get hadCorruptedData() {
      return hadCorruptedData
    },
    available: storage !== null,
    load() {
      hadCorruptedData = false
      if (!storage) return null
      let raw: string | null = null
      try {
        raw = storage.getItem(GAME_STATE_KEY)
      } catch {
        return null
      }
      if (raw === null) return null
      try {
        const parsed = parseGameState(JSON.parse(raw))
        if (!parsed) hadCorruptedData = true
        return parsed
      } catch {
        hadCorruptedData = true
        return null
      }
    },
    save(state) {
      try {
        storage?.setItem(GAME_STATE_KEY, JSON.stringify(state))
      } catch {
        /* quota exceeded or blocked storage: keep playing in memory */
      }
    },
    clear() {
      try {
        storage?.removeItem(GAME_STATE_KEY)
      } catch {
        /* ignore */
      }
    },
  }
}

export function safeLocalStorage(): Storage | undefined {
  try {
    if (typeof localStorage === 'undefined') return undefined
    const probe = '__tcdb_probe__'
    localStorage.setItem(probe, '1')
    localStorage.removeItem(probe)
    return localStorage
  } catch {
    return undefined
  }
}

/** In-memory Storage implementation for tests and storage-less browsers. */
export function createMemoryStorage(): Storage {
  const map = new Map<string, string>()
  return {
    get length() {
      return map.size
    },
    clear: () => map.clear(),
    getItem: (key) => map.get(key) ?? null,
    key: (index) => Array.from(map.keys())[index] ?? null,
    removeItem: (key) => {
      map.delete(key)
    },
    setItem: (key, value) => {
      map.set(key, String(value))
    },
  }
}
