<script setup lang="ts">
import { Check, Heart, Star, X } from '@lucide/vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Answer } from '../types/game'
import { indexToRowCol } from '../utils/board'

const props = defineProps<{
  index: number
  text: string
  isFree: boolean
  answer: Answer | null
  marked: boolean
  winning: boolean
}>()

const emit = defineEmits<{
  select: [index: number]
}>()

const { t } = useI18n()

const position = computed(() => indexToRowCol(props.index))

const answerLabel = computed(() => {
  if (props.isFree) return t('results.free')
  return props.answer === 'yes' ? t('results.markedYes') : t('results.markedNo')
})

const label = computed(() => {
  const base = t('results.cellLabel', {
    row: position.value.row + 1,
    col: position.value.col + 1,
    text: props.text,
    answer: answerLabel.value,
  })
  return props.winning ? `${base} ${t('results.winningCell')}` : base
})

const sizeClass = computed(() => {
  const length = props.text.length
  if (length > 34) return 'cell__text--xs'
  if (length > 22) return 'cell__text--sm'
  return ''
})
</script>

<template>
  <button
    type="button"
    class="cell"
    :class="{ 'cell--yes': marked && !isFree, 'cell--no': !marked, 'cell--free': isFree, 'cell--winning': winning }"
    :aria-label="label"
    :data-index="index"
    :data-marked="marked ? 'true' : 'false'"
    :data-winning="winning ? 'true' : 'false'"
    data-testid="bingo-cell"
    @click="emit('select', index)"
  >
    <Heart v-if="isFree" class="cell__mark" fill="currentColor" aria-hidden="true" />
    <Check v-else-if="marked" class="cell__mark" aria-hidden="true" />
    <X v-else class="cell__mark" aria-hidden="true" />
    <span class="cell__text" :class="sizeClass">{{ text }}</span>
    <Star v-if="winning" class="cell__star" fill="currentColor" aria-hidden="true" />
  </button>
</template>

<style scoped>
.cell {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 2px;
  width: 100%;
  aspect-ratio: 1 / 1;
  padding: 6px 3px 4px;
  border-radius: 10px;
  border: 2px solid transparent;
  text-align: center;
  overflow: hidden;
  transition:
    transform 140ms ease,
    box-shadow 140ms ease;
}

.cell:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-soft);
}

.cell--yes {
  background: var(--rose);
  color: var(--white);
}

.cell--no {
  background: var(--muted);
  color: var(--ink-soft);
}

.cell--free {
  background: var(--berry);
  color: var(--white);
}

.cell--winning {
  border-color: var(--gold);
  box-shadow:
    0 0 0 2px var(--gold-deep),
    0 6px 16px rgba(201, 138, 18, 0.35);
}

.cell__mark {
  width: 1rem;
  height: 1rem;
  stroke-width: 3;
}

.cell__text {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  overflow: hidden;
  max-height: calc(3 * 1.2em);
  font-size: 0.6rem;
  font-weight: 700;
  line-height: 1.2;
  overflow-wrap: break-word;
  hyphens: auto;
  line-break: strict;
}

.cell__text--sm {
  font-size: 0.54rem;
}

.cell__text--xs {
  font-size: 0.5rem;
}

.cell__star {
  position: absolute;
  top: 3px;
  right: 3px;
  width: 0.7rem;
  height: 0.7rem;
  stroke-width: 2;
  color: var(--gold);
}

@media (min-width: 420px) {
  .cell__text {
    -webkit-line-clamp: 4;
    line-clamp: 4;
    max-height: calc(4 * 1.2em);
    font-size: 0.68rem;
  }
  .cell__text--sm {
    font-size: 0.6rem;
  }
  .cell__text--xs {
    font-size: 0.54rem;
  }
}

@media (min-width: 560px) {
  .cell {
    padding: 8px 6px 6px;
    gap: 4px;
  }
  .cell__mark {
    width: 1.2rem;
    height: 1.2rem;
  }
  .cell__text {
    font-size: 0.8rem;
  }
  .cell__text--sm {
    font-size: 0.72rem;
  }
  .cell__text--xs {
    font-size: 0.64rem;
  }
}
</style>
