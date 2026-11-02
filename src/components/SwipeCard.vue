<script setup lang="ts">
import {
  Anchor,
  Banana,
  BedDouble,
  Dog,
  DoorOpen,
  Drama,
  Earth,
  FaceExpressionless,
  FaceGrinning,
  FaceSlightlyFrowning,
  Flame,
  Ghost,
  GraduationCap,
  Heart,
  HeartHandshake,
  House,
  JapaneseYen,
  Languages,
  Magnet,
  Martini,
  MessageCircleHeart,
  Mouth,
  Origami,
  ScanFace,
  ThumbsUp,
  Unlink,
  VenetianMask,
  X,
  createLucideIcon,
} from '@lucide/vue'
import { computed, onBeforeUnmount, ref, type Component } from 'vue'
import { useI18n } from 'vue-i18n'
import type { SwipeDirection } from '../types/game'

const props = withDefaults(
  defineProps<{
    questionId: string
    text: string
    /** 1-based position shown on the card. */
    number: number
    total: number
    /** 0 = top card, 1 and 2 = stacked behind. */
    depth?: number
    interactive?: boolean
    /** When set, the card plays its exit animation in that direction. */
    leaving?: SwipeDirection | null
    /** When set, the card plays an enter animation from that side (undo). */
    returning?: SwipeDirection | null
  }>(),
  { depth: 0, interactive: false, leaving: null, returning: null },
)

const emit = defineEmits<{
  swipe: [direction: SwipeDirection]
}>()

const { t } = useI18n()

/*
 * Icons from Lucide Lab (ISC license), copied here because @lucide/vue does not ship them.
 * Source: https://github.com/lucide-icons/lucide-lab/tree/main/icons
 */
const GemRing = createLucideIcon({
  name: 'gem-ring',
  size: 24,
  node: [
    ['path', { d: 'M13.2 8.1 16 4.4 14.4 2H9.6L8 4.4l2.8 3.7' }],
    ['circle', { cx: '12', cy: '15', r: '7' }],
  ],
})

const Bee = createLucideIcon({
  name: 'bee',
  size: 24,
  node: [
    ['path', { d: 'm8 2 1.88 1.88' }],
    ['path', { d: 'M14.12 3.88 16 2' }],
    ['path', { d: 'M9 7V6a3 3 0 1 1 6 0v1' }],
    ['path', { d: 'M5 7a3 3 0 1 0 2.2 5.1C9.1 10 12 7 12 7s2.9 3 4.8 5.1A3 3 0 1 0 19 7Z' }],
    ['path', { d: 'M7.56 12h8.87' }],
    ['path', { d: 'M7.5 17h9' }],
    ['path', { d: 'M15.5 10.7c.9.9 1.4 2.1 1.5 3.3 0 5.8-5 8-5 8s-5-2.2-5-8c.1-1.2.6-2.4 1.5-3.3' }],
  ],
})

/** Artwork shown above the text of a card, keyed by question ID. */
const CARD_ICONS: Partial<Record<string, Component>> = {
  q01: FaceExpressionless,
  q02: JapaneseYen,
  q03: Earth,
  q04: ScanFace,
  q05: BedDouble,
  q06: Ghost,
  q07: VenetianMask,
  q08: Martini,
  q09: House,
  q10: Magnet,
  q11: GemRing, // a wedding ring
  q12: Banana,
  q13: Anchor, // the naval bases at Yokosuka and Sasebo
  q14: HeartHandshake,
  q15: Flame,
  q16: Languages,
  q17: MessageCircleHeart,
  q18: DoorOpen,
  q19: Dog, // the Hachiko statue in front of Shibuya Station
  q20: Bee, // the logo of the Bumble app
  q21: Mouth,
  q22: Unlink,
  q23: ThumbsUp,
  q24: Origami, // a paper crane
  q25: FaceSlightlyFrowning, // q25 and q26 are a pair, so they share an icon
  q26: FaceSlightlyFrowning,
  q27: GraduationCap,
  q28: FaceGrinning, // laughing through a comedy night
  q29: Drama, // the comedy and tragedy masks of a live show
}

const icon = computed(() => CARD_ICONS[props.questionId])

/** Drag distance that commits an answer: 35% of the card width, capped at 120px. */
const MAX_THRESHOLD_PX = 120
const THRESHOLD_RATIO = 0.35
/** A quick flick commits below the distance threshold once it travels this far at this speed. */
const FLICK_MIN_DISTANCE_PX = 40
const FLICK_MIN_VELOCITY = 0.5 // px per ms
const FLICK_WINDOW_MS = 120

const el = ref<HTMLElement | null>(null)
const dragging = ref(false)
const dx = ref(0)
const dy = ref(0)
let pointerId: number | null = null
let pointerType = ''
let startX = 0
let startY = 0
let committed = false
/** Recent (time, x) samples used to measure flick velocity. */
let samples: { time: number; x: number }[] = []

const threshold = computed(() => {
  const width = el.value?.offsetWidth || 320
  return Math.min(MAX_THRESHOLD_PX, width * THRESHOLD_RATIO)
})

/** -1..1 progress toward a decision; sign gives the direction. */
const progress = computed(() => Math.max(-1, Math.min(1, dx.value / threshold.value)))
const yesOpacity = computed(() => Math.max(0, progress.value))
const noOpacity = computed(() => Math.max(0, -progress.value))

const style = computed(() => {
  // The leaving and returning states are driven entirely by CSS classes.
  if (props.leaving || props.returning) return undefined
  if (props.depth > 0) {
    return {
      transform: `translateY(${props.depth * 12}px) scale(${1 - props.depth * 0.05})`,
      opacity: String(1 - props.depth * 0.25),
    }
  }
  const rotate = dx.value * 0.06
  return {
    transform: `translate(${dx.value}px, ${dy.value * 0.4}px) rotate(${rotate}deg)`,
    transition: dragging.value ? 'none' : undefined,
  }
})

const textSizeClass = computed(() => {
  const length = props.text.length
  if (length > 60) return 'card__text--xs'
  if (length > 40) return 'card__text--sm'
  return ''
})

function recordSample(x: number) {
  const now = Date.now()
  samples.push({ time: now, x })
  samples = samples.filter((sample) => now - sample.time <= FLICK_WINDOW_MS)
}

/** Horizontal velocity in px per ms over the most recent movement window. */
function flickVelocity(): number {
  const first = samples[0]
  const last = samples[samples.length - 1]
  if (!first || !last || first === last) return 0
  const dt = last.time - first.time
  if (dt <= 0) return 0
  return (last.x - first.x) / dt
}

function onPointerDown(event: PointerEvent) {
  if (!props.interactive || props.leaving || pointerId !== null) return
  if (event.pointerType === 'mouse' && event.button !== 0) return
  pointerId = event.pointerId
  pointerType = event.pointerType
  startX = event.clientX
  startY = event.clientY
  dragging.value = true
  committed = false
  samples = []
  recordSample(event.clientX)
  try {
    el.value?.setPointerCapture?.(event.pointerId)
  } catch {
    /* capture is an optimization; dragging still works without it */
  }
}

function onPointerMove(event: PointerEvent) {
  if (!dragging.value || event.pointerId !== pointerId) return
  dx.value = event.clientX - startX
  dy.value = event.clientY - startY
  recordSample(event.clientX)
}

/** Ends the drag and returns the card to rest; reports how far and how fast it moved. */
function stopDrag(): { distance: number; velocity: number } {
  const id = pointerId
  dragging.value = false
  pointerId = null
  if (id !== null) {
    try {
      el.value?.releasePointerCapture?.(id)
    } catch {
      /* capture may already be released */
    }
  }
  const gesture = { distance: dx.value, velocity: flickVelocity() }
  dx.value = 0
  dy.value = 0
  samples = []
  return gesture
}

function finishDrag(event: PointerEvent, cancelled: boolean) {
  if (!dragging.value || event.pointerId !== pointerId) return
  const { distance, velocity } = stopDrag()
  if (cancelled || committed) return
  const pastThreshold = Math.abs(distance) >= threshold.value
  const flicked =
    Math.abs(distance) >= FLICK_MIN_DISTANCE_PX &&
    Math.abs(velocity) >= FLICK_MIN_VELOCITY &&
    Math.sign(velocity) === Math.sign(distance)
  if (pastThreshold || flicked) {
    committed = true
    emit('swipe', distance > 0 ? 'right' : 'left')
  }
}

function onPointerUp(event: PointerEvent) {
  finishDrag(event, false)
}

function onPointerCancel(event: PointerEvent) {
  finishDrag(event, true)
}

/** A double or triple click selects a word or a line of the card, so that press never moves it. */
function onMouseDown(event: MouseEvent) {
  if (event.detail >= 2 && dragging.value) stopDrag()
}

/**
 * A mouse or pen drag moves the card, so it must not select text at the same time.
 * A touch drag never selects text, so a long press on a touch screen stays free to select.
 */
function onSelectStart(event: Event) {
  if (dragging.value && pointerType !== 'touch') event.preventDefault()
}

onBeforeUnmount(() => {
  pointerId = null
})
</script>

<template>
  <article
    ref="el"
    class="card"
    :class="{
      'card--behind': depth > 0,
      'card--dragging': dragging,
      'card--interactive': interactive && !leaving,
      'card--leaving-left': leaving === 'left',
      'card--leaving-right': leaving === 'right',
      'card--returning-left': returning === 'left',
      'card--returning-right': returning === 'right',
    }"
    :style="style"
    :aria-hidden="depth > 0 || !!leaving ? 'true' : undefined"
    :aria-label="t('game.cardLabel', { current: number, total, text })"
    :data-question-id="questionId"
    :data-leaving="leaving ?? undefined"
    data-testid="swipe-card"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerCancel"
    @lostpointercapture="onPointerCancel"
    @mousedown="onMouseDown"
    @selectstart="onSelectStart"
    @dragstart.prevent
  >
    <header class="card__header">
      <span class="card__number">{{ t('game.progress', { current: number, total }) }}</span>
      <span class="card__heart" aria-hidden="true">&#10084;&#65039;</span>
    </header>
    <div class="card__body">
      <component :is="icon" v-if="icon" class="card__icon" aria-hidden="true" data-testid="card-icon" />
      <p class="card__text" :class="textSizeClass">{{ text }}</p>
    </div>
    <footer class="card__footer" aria-hidden="true">
      <span class="card__hint card__hint--no">&larr; {{ t('game.no') }}</span>
      <span class="card__hint card__hint--yes">{{ t('game.yes') }} &rarr;</span>
    </footer>
    <div
      class="card__stamp card__stamp--yes"
      :style="{ opacity: leaving === 'right' ? 1 : yesOpacity }"
      aria-hidden="true"
    >
      <Heart class="card__stamp-icon" fill="currentColor" aria-hidden="true" />
      {{ t('game.yesStamp') }}
    </div>
    <div
      class="card__stamp card__stamp--no"
      :style="{ opacity: leaving === 'left' ? 1 : noOpacity }"
      aria-hidden="true"
    >
      <X class="card__stamp-icon" aria-hidden="true" />
      {{ t('game.noStamp') }}
    </div>
  </article>
</template>

<style scoped>
.card {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  padding: 20px 22px;
  border-radius: 26px;
  background: linear-gradient(160deg, var(--white) 0%, var(--cream) 100%);
  box-shadow: var(--shadow);
  border: 1px solid rgba(233, 124, 166, 0.25);
  will-change: transform;
  transition:
    transform 280ms cubic-bezier(0.2, 0.8, 0.2, 1),
    opacity 280ms ease;
  -webkit-tap-highlight-color: transparent;
  overflow: hidden;
}

/* The top card hides the cards behind it, so their text stays out of a select-all copy. */
.card--behind {
  user-select: none;
  -webkit-user-select: none;
}

.card--interactive {
  cursor: grab;
  /* The card owns every touch gesture that starts on it, so iOS never
     turns a diagonal drag into a page scroll and cancels the pointer. */
  touch-action: none;
}

.card--dragging {
  cursor: grabbing;
}

.card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--berry);
  letter-spacing: 0.04em;
}

.card__heart {
  font-size: 1.2rem;
}

.card__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
}

.card__icon {
  align-self: center;
  width: 3rem;
  height: 3rem;
  stroke-width: 1.75;
  color: var(--berry);
}

.card__text {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 8px 4px;
  text-align: center;
  font-size: clamp(1.25rem, 5.2vw, 1.75rem);
  font-weight: 700;
  line-height: 1.4;
  color: var(--ink);
  overflow-wrap: anywhere;
  hyphens: auto;
  line-break: strict;
}

.card__text--sm {
  font-size: clamp(1.1rem, 4.6vw, 1.5rem);
}

.card__text--xs {
  font-size: clamp(1rem, 4.2vw, 1.3rem);
}

.card__footer {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--muted-text);
}

.card__hint--yes {
  color: var(--rose);
}

.card__stamp {
  position: absolute;
  top: 56px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 10px;
  border: 4px solid currentColor;
  font-size: 1.6rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  opacity: 0;
  pointer-events: none;
  transition: opacity 120ms ease;
  /* Invisible until a drag, so it stays out of a select-all copy. */
  user-select: none;
  -webkit-user-select: none;
}

.card__stamp-icon {
  width: 1.4rem;
  height: 1.4rem;
  stroke-width: 3;
}

.card__stamp--yes {
  left: 18px;
  color: var(--rose-deep);
  transform: rotate(-14deg);
  background: rgba(255, 255, 255, 0.85);
}

.card__stamp--no {
  right: 18px;
  color: var(--muted-text);
  transform: rotate(14deg);
  background: rgba(255, 255, 255, 0.85);
}

.card--leaving-left {
  transform: translate(-130%, 6%) rotate(-22deg);
  opacity: 0;
  pointer-events: none;
}

.card--leaving-right {
  transform: translate(130%, 6%) rotate(22deg);
  opacity: 0;
  pointer-events: none;
}

.card--returning-left {
  animation: return-left 320ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.card--returning-right {
  animation: return-right 320ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

@keyframes return-left {
  from {
    transform: translate(-130%, 6%) rotate(-22deg);
    opacity: 0;
  }
  to {
    transform: none;
    opacity: 1;
  }
}

@keyframes return-right {
  from {
    transform: translate(130%, 6%) rotate(22deg);
    opacity: 0;
  }
  to {
    transform: none;
    opacity: 1;
  }
}
</style>
