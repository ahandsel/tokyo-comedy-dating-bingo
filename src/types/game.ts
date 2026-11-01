export type Locale = 'en' | 'ja'

export const LOCALES: readonly Locale[] = ['en', 'ja'] as const

export type Answer = 'yes' | 'no'

/** Answers keyed by stable question ID. Never keyed by translated text. */
export type Answers = Record<string, Answer>

export type GamePhase = 'welcome' | 'playing' | 'results'

/** Marker used in the board arrangement for the centre square. */
export const FREE = 'free' as const
export type FreeCell = typeof FREE

/** One board position: either a question ID or the free centre. */
export type BoardCellId = string | FreeCell

export interface Question {
  id: string
  text: Record<Locale, string>
}

export interface GameState {
  version: number
  phase: GamePhase
  /** Shuffled question IDs, fixed for the life of one game. */
  questionOrder: string[]
  currentQuestionIndex: number
  answers: Answers
  /** Question IDs in the order they were answered; used for undo. */
  answerHistory: string[]
  /** 25-cell arrangement generated once after the final answer. */
  boardQuestionIds: BoardCellId[] | null
}

export interface UserPreferences {
  locale: Locale
}

export interface BingoResult {
  hasBingo: boolean
  /** Each winning line as a list of flat cell indices (0-24). */
  winningLines: number[][]
  /** Deduplicated flat indices of every cell that belongs to a winning line. */
  winningCellIndices: number[]
  totalWinningLines: number
}

export type SwipeDirection = 'left' | 'right'

export interface GameStats {
  yes: number
  no: number
  winningLines: number
}
