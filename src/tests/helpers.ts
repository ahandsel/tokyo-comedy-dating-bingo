import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick, type Component } from 'vue'
import App from '../App.vue'
import { createGameStore, type GameStore } from '../composables/useGame'
import { createGameStorage, createMemoryStorage } from '../composables/useGameStorage'
import { createAppI18n, type AppI18n } from '../i18n'
import type { Answer, Answers, BoardCellId, Locale } from '../types/game'
import { QUESTION_IDS } from '../data/questions'
import { DECK_SIZE } from '../utils/board'
import { seededRandom } from '../utils/shuffle'

/** The original 24 questions: a fixed, valid deck for tests that need one game's cards. */
export const SAMPLE_DECK: readonly string[] = QUESTION_IDS.slice(0, DECK_SIZE)

export function mountWithI18n(component: Component, locale: Locale = 'en', props: Record<string, unknown> = {}) {
  const i18n = createAppI18n(locale)
  const wrapper = mount(component, { props, global: { plugins: [i18n] } })
  return { wrapper, i18n }
}

export function mountApp(locale: Locale = 'en'): { wrapper: VueWrapper; i18n: AppI18n } {
  const i18n = createAppI18n(locale)
  const wrapper = mount(App, { global: { plugins: [i18n] }, attachTo: document.body })
  return { wrapper, i18n }
}

export function memoryStore(seed = 1, storage: Storage = createMemoryStorage()): { store: GameStore; storage: Storage } {
  const store = createGameStore({ storage: createGameStorage(storage), random: seededRandom(seed) })
  return { store, storage }
}

export function answerAll(store: GameStore, pick: (id: string, index: number) => Answer = () => 'yes'): void {
  let guard = 0
  while (store.state.phase === 'playing' && guard++ < 100) {
    const id = store.currentQuestionId.value!
    store.answer(pick(id, store.state.currentQuestionIndex))
  }
}

export function allAnswers(value: Answer): Answers {
  return Object.fromEntries(SAMPLE_DECK.map((id) => [id, value]))
}

export function answersForMarked(board: readonly BoardCellId[], markedIndices: number[]): Answers {
  const answers = allAnswers('no')
  for (const i of markedIndices) {
    const id = board[i]
    if (id && id !== 'free') answers[id] = 'yes'
  }
  return answers
}

export async function flush(): Promise<void> {
  await new Promise((r) => setTimeout(r, 0))
}

export interface PointerInit {
  pointerId?: number
  clientX?: number
  clientY?: number
  button?: number
  pointerType?: string
}

/** Dispatch a pointer event in jsdom, which lacks a usable PointerEvent constructor. */
export async function firePointer(el: Element, type: string, init: PointerInit = {}): Promise<void> {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, button: init.button ?? 0 })
  Object.defineProperties(event, {
    pointerId: { value: init.pointerId ?? 1 },
    pointerType: { value: init.pointerType ?? 'touch' },
    clientX: { value: init.clientX ?? 0 },
    clientY: { value: init.clientY ?? 0 },
  })
  el.dispatchEvent(event)
  await nextTick()
}
