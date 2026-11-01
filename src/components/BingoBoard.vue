<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { getQuestionText } from '../data/questions'
import { useLocale } from '../composables/useLocale'
import { FREE, type Answer, type Answers, type BingoResult, type BoardCellId } from '../types/game'
import { isCellMarked } from '../utils/bingo'
import { BOARD_SIZE, CELL_COUNT, indexToRowCol, rowColToIndex } from '../utils/board'
import BingoCell from './BingoCell.vue'

const props = defineProps<{
  board: readonly BoardCellId[]
  answers: Answers
  result: BingoResult
}>()

const emit = defineEmits<{
  select: [index: number]
}>()

const { t } = useI18n()
const { locale } = useLocale()

const root = ref<HTMLElement | null>(null)

interface CellView {
  index: number
  text: string
  isFree: boolean
  answer: Answer | null
  marked: boolean
  winning: boolean
}

const rows = computed<CellView[][]>(() => {
  const winning = new Set(props.result.winningCellIndices)
  const cells = props.board.map((cell, index): CellView => {
    const isFree = cell === FREE
    return {
      index,
      text: isFree ? t('results.freeSpace') : getQuestionText(cell, locale.value),
      isFree,
      answer: isFree ? null : (props.answers[cell] ?? null),
      marked: isCellMarked(cell, props.answers),
      winning: winning.has(index),
    }
  })
  const out: CellView[][] = []
  for (let r = 0; r < BOARD_SIZE; r++) out.push(cells.slice(r * BOARD_SIZE, (r + 1) * BOARD_SIZE))
  return out
})

/** Index of the cell to focus for a navigation key, or null when the key is not one. */
function nextIndexFor(key: string, index: number): number | null {
  const { row, col } = indexToRowCol(index)
  switch (key) {
    case 'ArrowLeft':
      return col > 0 ? index - 1 : null
    case 'ArrowRight':
      return col < BOARD_SIZE - 1 ? index + 1 : null
    case 'ArrowUp':
      return row > 0 ? index - BOARD_SIZE : null
    case 'ArrowDown':
      return row < BOARD_SIZE - 1 ? index + BOARD_SIZE : null
    case 'Home':
      return rowColToIndex(row, 0)
    case 'End':
      return rowColToIndex(row, BOARD_SIZE - 1)
    default:
      return null
  }
}

/** Arrow keys move focus around the grid, as the grid role promises. */
function onKeydown(event: KeyboardEvent) {
  const target = event.target instanceof HTMLElement ? closestCell(event.target) : null
  if (!target) return
  const index = Number(target.dataset.index)
  if (!Number.isInteger(index) || index < 0 || index >= CELL_COUNT) return
  const next = nextIndexFor(event.key, index)
  if (next === null) return
  event.preventDefault()
  root.value?.querySelector<HTMLElement>(`[data-index="${next}"]`)?.focus()
}

function closestCell(el: HTMLElement): HTMLElement | null {
  return el.closest<HTMLElement>('[data-testid="bingo-cell"]')
}
</script>

<template>
  <div ref="root" class="board" role="grid" :aria-label="t('results.boardLabel')" data-testid="bingo-board" @keydown="onKeydown">
    <div v-for="(row, r) in rows" :key="r" class="board__row" role="row">
      <div v-for="cell in row" :key="cell.index" role="gridcell" class="board__cell">
        <BingoCell v-bind="cell" @select="emit('select', $event)" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.board {
  display: grid;
  gap: 5px;
  width: 100%;
  padding: 8px;
  border-radius: 18px;
  background: var(--white);
  box-shadow: var(--shadow);
}

.board__row {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 5px;
}

.board__cell {
  min-width: 0;
}

@media (min-width: 560px) {
  .board,
  .board__row {
    gap: 8px;
  }
  .board {
    padding: 12px;
  }
}
</style>
