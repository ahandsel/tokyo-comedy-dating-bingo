<script setup lang="ts">
import { Heart, Undo2, X } from '@lucide/vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  canUndo: boolean
}>()

const emit = defineEmits<{
  no: []
  yes: []
  undo: []
}>()

const { t } = useI18n()
</script>

<template>
  <div class="controls">
    <button type="button" class="ctrl ctrl--no" data-testid="btn-no" @click="emit('no')">
      <X class="ctrl__icon" aria-hidden="true" />
      <span class="ctrl__label">{{ t('game.no') }}</span>
    </button>
    <button
      type="button"
      class="ctrl ctrl--undo"
      data-testid="btn-undo"
      :disabled="!canUndo"
      :aria-label="canUndo ? t('game.undo') : t('game.noMoreUndo')"
      @click="emit('undo')"
    >
      <Undo2 class="ctrl__icon" aria-hidden="true" />
      <span class="ctrl__label">{{ t('game.undo') }}</span>
    </button>
    <button type="button" class="ctrl ctrl--yes" data-testid="btn-yes" @click="emit('yes')">
      <Heart class="ctrl__icon" fill="currentColor" aria-hidden="true" />
      <span class="ctrl__label">{{ t('game.yes') }}</span>
    </button>
  </div>
</template>

<style scoped>
.controls {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
}

.ctrl {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-height: 72px;
  border-radius: 22px;
  font-weight: 700;
  background: var(--white);
  box-shadow: var(--shadow-soft);
  transition:
    transform 140ms ease,
    box-shadow 140ms ease;
}

.ctrl:active:not(:disabled) {
  transform: scale(0.96);
}

.ctrl__icon {
  width: 1.75rem;
  height: 1.75rem;
  stroke-width: 2.5;
}

.ctrl__label {
  font-size: 0.9rem;
}

.ctrl--no {
  color: var(--ink-soft);
  border: 2px solid var(--muted);
}

.ctrl--yes {
  color: var(--white);
  background: linear-gradient(135deg, var(--rose), var(--berry));
  box-shadow: var(--shadow);
}

.ctrl--undo {
  min-width: 72px;
  min-height: 56px;
  color: var(--berry);
  border: 2px solid var(--blush-deep);
  border-radius: 999px;
}

.ctrl--undo:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
</style>
