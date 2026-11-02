<script setup lang="ts">
import { ArrowLeft, CircleCheck, Download, LoaderCircle, Mic, Pencil, Pointer, RotateCcw, Share, TriangleAlert } from '@lucide/vue'
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch, type Component } from 'vue'
import { I18nT, useI18n } from 'vue-i18n'
import BingoBoard from '../components/BingoBoard.vue'
import CellDetailModal from '../components/CellDetailModal.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import CreditLink from '../components/CreditLink.vue'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'
import ResultSummary from '../components/ResultSummary.vue'
import { useGame } from '../composables/useGame'
import { useLocale } from '../composables/useLocale'
import { getQuestionText } from '../data/questions'
import { FREE, type Answer } from '../types/game'
import { isCellMarked } from '../utils/bingo'
import { canShareFiles, renderBoardImage, saveImage, shareOrDownload, type ExportLabels } from '../utils/exportImage'

const { t } = useI18n()
const { locale } = useLocale()
const game = useGame()

const board = computed(() => game.state.boardQuestionIds ?? [])
const result = computed(() => game.bingo.value ?? { hasBingo: false, winningLines: [], winningCellIndices: [], totalWinningLines: 0 })

const revealed = ref(false)
const confirmOpen = ref(false)
const selectedIndex = ref<number | null>(null)
const status = ref('')
/** Decorative Lucide icon shown before the status text; hidden from screen readers. */
const statusIcon = shallowRef<Component | null>(null)
const busy = ref(false)
const shareSupported = typeof navigator !== 'undefined' && canShareFiles()

let revealTimer: ReturnType<typeof setTimeout> | null = null

function reducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
}

async function celebrate() {
  if (!result.value.hasBingo || reducedMotion()) return
  if (!document.createElement('canvas').getContext('2d')) return
  try {
    const { default: confetti } = await import('canvas-confetti')
    confetti({ particleCount: 140, spread: 75, origin: { y: 0.6 }, colors: ['#E97CA6', '#A83F70', '#FFF8F4', '#F2B544'] })
  } catch {
    /* confetti is decorative only */
  }
}

const REVEAL_MS = 900

onMounted(() => {
  // Only the first visit after the final answer gets the reveal and confetti.
  // Reopening a saved board from the welcome screen shows it immediately.
  if (!game.revealPending.value) {
    revealed.value = true
    return
  }
  game.clearReveal()
  revealTimer = setTimeout(
    () => {
      revealed.value = true
      void celebrate()
    },
    reducedMotion() ? 0 : REVEAL_MS,
  )
})

onBeforeUnmount(() => {
  if (revealTimer) clearTimeout(revealTimer)
})

const selected = computed(() => {
  const index = selectedIndex.value
  if (index === null) return null
  const cell = board.value[index]
  if (cell === undefined) return null
  const isFree = cell === FREE
  return {
    index,
    isFree,
    text: isFree ? t('results.freeSpace') : getQuestionText(cell, locale.value),
    answer: isFree ? null : (game.state.answers[cell] ?? null),
    marked: isCellMarked(cell, game.state.answers),
    winning: result.value.winningCellIndices.includes(index),
  }
})

function changeAnswer(answer: Answer) {
  const sel = selected.value
  if (!sel || sel.isFree) return
  const id = board.value[sel.index]
  if (!id || id === FREE) return
  game.setAnswer(id, answer)
  showStatus(t('results.answerUpdated', { lines: result.value.totalWinningLines }), Pencil)
}

function showStatus(text: string, icon: Component | null = null) {
  status.value = text
  statusIcon.value = icon
}

watch(locale, () => {
  showStatus('')
})

function requestRestart() {
  confirmOpen.value = true
}

function confirmRestart() {
  confirmOpen.value = false
  game.restart()
}

function exportLabels(): ExportLabels {
  const hasBingo = result.value.hasBingo
  return {
    brand: t('app.brand'),
    bingoWord: t('app.bingo'),
    heading: hasBingo ? t('results.bingoTitle') : t('results.noBingoTitle'),
    subtitle: hasBingo ? t('results.bingoSubtitle') : t('results.noBingoSubtitle'),
    yesCount: t('results.yesCount'),
    noCount: t('results.noCount'),
    lineCount: t('results.lineCount'),
    freeSpace: t('results.freeSpace'),
    yesMark: t('results.markedYes'),
    noMark: t('results.markedNo'),
    footer: t('results.exportFooter', { url: appUrl() }),
  }
}

/** The address of the game without a query or a fragment, so no answers can travel with it. */
function appUrl(): string {
  return typeof location !== 'undefined' ? location.href.replace(/[#?].*$/, '') : ''
}

function filename(): string {
  return `tokyo-comedy-dating-bingo-${locale.value}.png`
}

async function createImage(): Promise<Blob> {
  const currentLocale = locale.value
  return renderBoardImage({
    board: board.value,
    answers: { ...game.state.answers },
    result: result.value,
    stats: game.stats.value,
    labels: exportLabels(),
    getText: (id) => getQuestionText(id, currentLocale),
    lang: currentLocale,
  })
}

function shareText(): string {
  const s = game.stats.value
  return t('results.shareText', {
    yes: s.yes,
    no: s.no,
    lines: s.winningLines,
    verdict: result.value.hasBingo ? t('results.shareBingo') : t('results.shareNoBingo'),
    url: appUrl(),
  })
}

async function onDownload() {
  if (busy.value) return
  busy.value = true
  showStatus(t('results.exporting'), LoaderCircle)
  try {
    const blob = await createImage()
    const outcome = await saveImage(blob, filename())
    if (outcome === 'cancelled') showStatus(t('results.saveCancelled'))
    else showStatus(t('results.exportSuccess'), CircleCheck)
  } catch {
    showStatus(t('results.exportError'), TriangleAlert)
  } finally {
    busy.value = false
  }
}

async function onShare() {
  if (busy.value) return
  busy.value = true
  showStatus(t('results.exporting'), LoaderCircle)
  try {
    const blob = await createImage()
    const outcome = await shareOrDownload(blob, filename(), { title: t('results.shareTitle'), text: shareText() })
    if (outcome === 'cancelled') showStatus(t('results.shareCancelled'))
    else if (outcome === 'downloaded') showStatus(t('results.exportSuccess'), CircleCheck)
    else showStatus('')
  } catch {
    showStatus(t('results.exportError'), TriangleAlert)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <main class="page results">
    <div class="topbar">
      <button type="button" class="btn btn-ghost results__home" :aria-label="t('game.backHome')" @click="game.goToWelcome()">
        <ArrowLeft aria-hidden="true" />
        <span class="brand-script">{{ t('app.brand') }}</span>
      </button>
      <LanguageSwitcher />
    </div>

    <div v-if="!revealed" class="reveal" role="status" aria-live="polite" data-testid="revealing">
      <span class="reveal__heart heart-motif" aria-hidden="true">&#10084;&#65039;</span>
      <p>{{ t('results.revealing') }}</p>
    </div>

    <template v-else>
      <ResultSummary :has-bingo="result.hasBingo" :stats="game.stats.value" />

      <BingoBoard :board="board" :answers="game.state.answers" :result="result" @select="selectedIndex = $event" />

      <p class="results__hint"><Pointer aria-hidden="true" /> {{ t('results.editHint') }}</p>

      <div class="results__actions">
        <button type="button" class="btn btn-secondary" data-testid="btn-download" :disabled="busy" @click="onDownload">
          <Download aria-hidden="true" />
          {{ t('results.download') }}
        </button>
        <button v-if="shareSupported" type="button" class="btn btn-secondary" data-testid="btn-share" :disabled="busy" @click="onShare">
          <Share aria-hidden="true" />
          {{ t('results.share') }}
        </button>
        <button type="button" class="btn btn-primary" data-testid="btn-play-again" @click="requestRestart">
          <RotateCcw aria-hidden="true" />
          {{ t('results.playAgain') }}
        </button>
      </div>
    </template>

    <p class="results__status" role="status" aria-live="polite" data-testid="results-status">
      <component :is="statusIcon" v-if="statusIcon" aria-hidden="true" /> {{ status }}
    </p>

    <!-- Below the status line, so export messages stay next to the buttons. -->
    <p v-if="revealed" class="results__shoutout" data-testid="shoutout">
      <Mic class="results__shoutout-icon" aria-hidden="true" /> <I18nT keypath="results.shoutout" tag="span">
        <template #name><CreditLink credit="artist" /></template>
        <template #venue><CreditLink credit="venue" /></template>
      </I18nT>
    </p>

    <CellDetailModal
      :open="selected !== null"
      :text="selected?.text ?? ''"
      :is-free="selected?.isFree ?? false"
      :answer="selected?.answer ?? null"
      :winning="selected?.winning ?? false"
      @change="changeAnswer"
      @close="selectedIndex = null"
    />

    <ConfirmDialog
      :open="confirmOpen"
      :message="t('results.restartConfirm')"
      :icon="TriangleAlert"
      :confirm-label="t('results.confirm')"
      :cancel-label="t('results.cancel')"
      @confirm="confirmRestart"
      @cancel="confirmOpen = false"
    />
  </main>
</template>

<style scoped>
.results {
  gap: 14px;
}

.results__home {
  gap: 0.35rem;
  padding: 0;
  text-decoration: none;
  font-size: 1.05rem;
}

.reveal {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 50vh;
  font-weight: 700;
  color: var(--berry);
}

.reveal__heart {
  font-size: 3rem;
}

.results__hint {
  margin: 0;
  text-align: center;
  font-size: 0.85rem;
  color: var(--ink-soft);
}

.results__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
}

.results__status {
  min-height: 1.5em;
  margin: 0;
  text-align: center;
  font-size: 0.9rem;
  color: var(--berry);
}

.results__shoutout {
  margin: 0;
  padding: 14px 18px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.55);
  text-align: center;
  font-size: 0.9rem;
  color: var(--ink-soft);
}

.results__shoutout-icon {
  color: var(--berry);
}

/* The reduced-motion rule in style.css stops the spin. */
.results__status .lucide-loader-circle {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
