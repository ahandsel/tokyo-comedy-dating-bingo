<script setup lang="ts">
import { ArrowLeft, Keyboard, MoveHorizontal } from '@lucide/vue'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'
import ProgressIndicator from '../components/ProgressIndicator.vue'
import SwipeControls from '../components/SwipeControls.vue'
import SwipeDeck from '../components/SwipeDeck.vue'
import { useGame } from '../composables/useGame'
import type { Answer, SwipeDirection } from '../types/game'

const { t } = useI18n()
const game = useGame()

const deck = ref<InstanceType<typeof SwipeDeck> | null>(null)
const announcement = ref('')

const currentNumber = computed(() => game.state.currentQuestionIndex + 1)

function directionToAnswer(direction: SwipeDirection): Answer {
  return direction === 'right' ? 'yes' : 'no'
}

function onAnswer(direction: SwipeDirection) {
  const value = directionToAnswer(direction)
  const before = game.state.currentQuestionIndex
  if (!game.answer(value)) return
  const answerLabel = value === 'yes' ? t('game.yes') : t('game.no')
  const next =
    before + 1 >= game.totalQuestions
      ? t('game.allAnswered')
      : t('game.nextUp', { current: before + 2, total: game.totalQuestions })
  announcement.value = t('game.answerAnnouncement', { answer: answerLabel, next })
}

function onUndo() {
  const lastId = game.state.answerHistory[game.state.answerHistory.length - 1]
  if (!lastId) return
  const previous = game.state.answers[lastId]
  if (!game.undo()) return
  deck.value?.playReturn(lastId, previous === 'yes' ? 'right' : 'left')
  announcement.value = t('game.undoAnnouncement', { current: game.state.currentQuestionIndex + 1 })
}

function swipe(direction: SwipeDirection) {
  deck.value?.swipe(direction)
}

/** True when the key press belongs to a text field or an open dialog, not the game. */
function keyboardIsBusy(event: KeyboardEvent): boolean {
  const target = event.target
  if (target instanceof HTMLElement) {
    if (target.isContentEditable) return true
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return true
  }
  return typeof document !== 'undefined' && document.querySelector('dialog[open]') !== null
}

/**
 * Page-wide keyboard controls, so arrow keys work without focusing the deck:
 * right = yes, left = no, down (or Backspace, Ctrl/Cmd+Z) = undo.
 * Held keys auto-repeat; only the first press counts.
 */
function onKeydown(event: KeyboardEvent) {
  if (event.repeat || event.defaultPrevented || keyboardIsBusy(event)) return
  const isUndoShortcut = event.key.toLowerCase() === 'z' && (event.metaKey || event.ctrlKey) && !event.shiftKey && !event.altKey
  if (isUndoShortcut) {
    event.preventDefault()
    onUndo()
    return
  }
  if (event.metaKey || event.ctrlKey || event.altKey) return
  switch (event.key) {
    case 'ArrowLeft':
      event.preventDefault()
      swipe('left')
      break
    case 'ArrowRight':
      event.preventDefault()
      swipe('right')
      break
    case 'ArrowDown':
    case 'Backspace':
      event.preventDefault()
      onUndo()
      break
    default:
      break
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <main class="page game">
    <div class="topbar">
      <button type="button" class="btn btn-ghost game__home" :aria-label="t('game.backHome')" @click="game.goToWelcome()">
        <ArrowLeft aria-hidden="true" />
        <span class="brand-script">{{ t('app.brand') }}</span>
      </button>
      <LanguageSwitcher />
    </div>

    <ProgressIndicator :current="currentNumber" :total="game.totalQuestions" />

    <SwipeDeck
      ref="deck"
      :question-ids="game.upcomingQuestionIds.value"
      :current-number="currentNumber"
      :total="game.totalQuestions"
      @answer="onAnswer"
    />

    <p class="game__hint">
      <span><MoveHorizontal aria-hidden="true" /> {{ t('game.swipeHint') }}</span>
      <span class="game__keys" data-testid="keyboard-hint"><Keyboard aria-hidden="true" /> {{ t('game.keyboardHint') }}</span>
    </p>

    <SwipeControls :can-undo="game.canUndo.value" @no="swipe('left')" @yes="swipe('right')" @undo="onUndo" />

    <p class="visually-hidden" role="status" aria-live="polite" data-testid="announcer">{{ announcement }}</p>
  </main>
</template>

<style scoped>
.game {
  gap: 10px;
}

.game__home {
  gap: 0.35rem;
  padding: 0;
  text-decoration: none;
  font-size: 1.05rem;
}

.game__hint {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 0;
  text-align: center;
  font-size: 0.85rem;
  color: var(--ink-soft);
}

/* Keyboard shortcuts only matter where a keyboard is likely. */
.game__keys {
  display: none;
}

@media (hover: hover) and (pointer: fine) {
  .game__keys {
    display: block;
  }
}
</style>
