<script setup lang="ts">
import { Check, Star, X } from '@lucide/vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Answer } from '../types/game'
import ModalDialog from './ModalDialog.vue'

const props = defineProps<{
  open: boolean
  text: string
  isFree: boolean
  answer: Answer | null
  winning: boolean
}>()

const emit = defineEmits<{
  change: [answer: Answer]
  close: []
}>()

const { t } = useI18n()

const answerLabel = computed(() => (props.answer === 'yes' ? t('results.markedYes') : t('results.markedNo')))
const otherAnswer = computed<Answer>(() => (props.answer === 'yes' ? 'no' : 'yes'))
const otherLabel = computed(() => (otherAnswer.value === 'yes' ? t('results.markedYes') : t('results.markedNo')))
</script>

<template>
  <ModalDialog :open="open" title-id="cell-title" @close="emit('close')">
    <h2 id="cell-title" class="detail__title">{{ t('cell.title') }}</h2>
    <p class="detail__question" data-testid="detail-question">{{ text }}</p>
    <p v-if="isFree" class="detail__meta">{{ t('cell.freeDescription') }}</p>
    <p v-else class="detail__meta">
      <strong>{{ t('cell.yourAnswer') }}</strong>
      <span class="detail__answer" :class="answer === 'yes' ? 'detail__answer--yes' : 'detail__answer--no'" data-testid="detail-answer">
        <Check v-if="answer === 'yes'" class="detail__mark" aria-hidden="true" />
        <X v-else class="detail__mark" aria-hidden="true" />
        {{ answerLabel }}
      </span>
    </p>
    <p class="detail__meta" :class="{ 'detail__meta--win': winning }" data-testid="detail-winning">
      <Star v-if="winning" fill="currentColor" aria-hidden="true" />
      {{ winning ? t('cell.winning') : t('cell.notWinning') }}
    </p>
    <div class="detail__actions">
      <button v-if="!isFree" type="button" class="btn btn-primary" data-testid="detail-change" @click="emit('change', otherAnswer)">
        <Check v-if="otherAnswer === 'yes'" class="detail__mark" aria-hidden="true" />
        <X v-else class="detail__mark" aria-hidden="true" />
        {{ t('cell.changeTo', { answer: otherLabel }) }}
      </button>
      <!-- Close gets the initial focus, so the Enter press that opened the dialog cannot also change the answer when it repeats. -->
      <button type="button" class="btn btn-secondary" data-testid="detail-close" autofocus @click="emit('close')">
        {{ t('cell.close') }}
      </button>
    </div>
  </ModalDialog>
</template>

<style scoped>
.detail__title {
  margin: 0;
  font-size: 0.9rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted-text);
}

.detail__question {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
  line-height: 1.4;
}

.detail__meta {
  margin: 0;
  color: var(--ink-soft);
}

.detail__meta--win {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--gold-deep);
  font-weight: 700;
}

.detail__answer {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: 6px;
  padding: 2px 10px;
  border-radius: 999px;
  font-weight: 700;
}

/* The same heavy stroke as the marks on the board squares. */
.detail__mark {
  stroke-width: 3;
}

.detail__answer--yes {
  background: var(--rose);
  color: var(--white);
}

.detail__answer--no {
  background: var(--muted);
  color: var(--ink-soft);
}

.detail__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}
</style>
