<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  current: number
  total: number
}>()

const { t } = useI18n()

const percent = computed(() => Math.round(((props.current - 1) / props.total) * 100))
const remaining = computed(() => Math.max(props.total - (props.current - 1), 0))
</script>

<template>
  <div class="progress">
    <div class="progress__text">
      <span class="progress__label" data-testid="progress-label">{{ t('game.progress', { current, total }) }}</span>
      <span class="progress__remaining" data-testid="progress-remaining">{{ t('game.remaining', { count: remaining }, remaining) }}</span>
    </div>
    <div
      class="progress__track"
      role="progressbar"
      :aria-valuemin="0"
      :aria-valuemax="total"
      :aria-valuenow="current - 1"
      :aria-label="t('game.progress', { current, total })"
    >
      <div class="progress__bar" :style="{ width: `${percent}%` }" />
    </div>
  </div>
</template>

<style scoped>
.progress {
  display: grid;
  gap: 6px;
}

.progress__text {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 0.9rem;
  color: var(--ink-soft);
}

.progress__label {
  font-weight: 700;
  color: var(--berry);
}

.progress__track {
  height: 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.8);
  overflow: hidden;
  box-shadow: inset 0 1px 3px rgba(168, 63, 112, 0.15);
}

.progress__bar {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--rose), var(--berry));
  transition: width 260ms ease;
}
</style>
