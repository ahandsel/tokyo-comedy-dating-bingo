<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { getQuestionText } from '../data/questions'
import { useLocale } from '../composables/useLocale'
import type { SwipeDirection } from '../types/game'
import SwipeCard from './SwipeCard.vue'

const props = defineProps<{
  /** Remaining question IDs, current first. */
  questionIds: readonly string[]
  /** 1-based number of the current question. */
  currentNumber: number
  total: number
}>()

const emit = defineEmits<{
  answer: [direction: SwipeDirection]
}>()

const { t } = useI18n()
const { locale } = useLocale()

/** Must match the transform transition and the return animation in SwipeCard.vue. */
const EXIT_MS = 320
/** How many upcoming cards are rendered in the stack. */
const STACK_SIZE = 3

interface LeavingCard {
  id: string
  number: number
  direction: SwipeDirection
  timer: ReturnType<typeof setTimeout>
}

interface CardView {
  id: string
  number: number
  depth: number
  interactive: boolean
  leaving: SwipeDirection | null
  returning: SwipeDirection | null
  zIndex: number
}

/** Cards that have been answered and are still flying off screen. */
const leaving = ref<LeavingCard[]>([])
const returning = ref<SwipeDirection | null>(null)
let returningTimer: ReturnType<typeof setTimeout> | null = null

function reducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
}

function exitDuration(): number {
  return reducedMotion() ? 0 : EXIT_MS
}

/**
 * Render list. Leaving cards come first and keep their original keys, so Vue
 * patches the same DOM element instead of remounting it and the CSS
 * transition can run from wherever the drag left the card.
 */
const cards = computed<CardView[]>(() => {
  const stack = props.questionIds.slice(0, STACK_SIZE)
  const stackIds = new Set(stack)
  const out: CardView[] = []
  leaving.value.forEach((card, index) => {
    // A card that was undone is back in the stack; the stack entry wins.
    if (stackIds.has(card.id)) return
    out.push({
      id: card.id,
      number: card.number,
      depth: 0,
      interactive: false,
      leaving: card.direction,
      returning: null,
      zIndex: 20 + index,
    })
  })
  stack.forEach((id, depth) => {
    out.push({
      id,
      number: props.currentNumber + depth,
      depth,
      interactive: depth === 0,
      leaving: null,
      returning: depth === 0 ? returning.value : null,
      zIndex: 10 - depth,
    })
  })
  return out
})

function removeLeaving(id: string) {
  const entry = leaving.value.find((card) => card.id === id)
  if (!entry) return
  clearTimeout(entry.timer)
  leaving.value = leaving.value.filter((card) => card.id !== id)
}

/**
 * Animate the top card away and report the answer.
 * Repeated calls for the same card (double events, key repeat) are ignored
 * because the card is already in the leaving list.
 */
function swipe(direction: SwipeDirection) {
  const id = props.questionIds[0]
  if (!id) return
  if (leaving.value.some((card) => card.id === id)) return
  const timer = setTimeout(() => removeLeaving(id), exitDuration())
  leaving.value = [...leaving.value, { id, number: props.currentNumber, direction, timer }]
  emit('answer', direction)
}

/** Play the "card flies back" animation after an undo. */
function playReturn(direction: SwipeDirection) {
  if (returningTimer) clearTimeout(returningTimer)
  returning.value = direction
  returningTimer = setTimeout(() => {
    returning.value = null
    returningTimer = null
  }, exitDuration())
}

onBeforeUnmount(() => {
  for (const card of leaving.value) clearTimeout(card.timer)
  if (returningTimer) clearTimeout(returningTimer)
})

defineExpose({ swipe, playReturn })
</script>

<template>
  <div class="deck" tabindex="0" role="group" :aria-label="t('game.deckLabel')" data-testid="swipe-deck">
    <SwipeCard
      v-for="card in cards"
      :key="card.id"
      :question-id="card.id"
      :text="getQuestionText(card.id, locale)"
      :number="card.number"
      :total="total"
      :depth="card.depth"
      :interactive="card.interactive"
      :leaving="card.leaving"
      :returning="card.returning"
      :style="{ zIndex: card.zIndex }"
      @swipe="swipe"
    />
  </div>
</template>

<style scoped>
.deck {
  position: relative;
  flex: 1 1 auto;
  width: 100%;
  min-height: 240px;
  max-height: min(480px, 58dvh);
  margin: 4px 0;
  border-radius: 26px;
}

@supports not (height: 1dvh) {
  .deck {
    max-height: min(480px, 58vh);
  }
}
</style>
