<script setup lang="ts">
import type { Component } from 'vue'
import ModalDialog from './ModalDialog.vue'

defineProps<{
  open: boolean
  message: string
  confirmLabel: string
  cancelLabel: string
  /** Optional decorative Lucide icon shown above the message. */
  icon?: Component
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <ModalDialog :open="open" title-id="confirm-title" @close="emit('cancel')">
    <component :is="icon" v-if="icon" class="confirm__icon" aria-hidden="true" />
    <p id="confirm-title" class="confirm__message">{{ message }}</p>
    <div class="confirm__actions">
      <!-- Cancel gets the initial focus, so a doubled or held Enter cannot confirm the destructive action. -->
      <button type="button" class="btn btn-secondary" data-testid="confirm-cancel" autofocus @click="emit('cancel')">
        {{ cancelLabel }}
      </button>
      <button type="button" class="btn btn-primary" data-testid="confirm-ok" @click="emit('confirm')">
        {{ confirmLabel }}
      </button>
    </div>
  </ModalDialog>
</template>

<style scoped>
.confirm__icon {
  display: block;
  width: 2rem;
  height: 2rem;
  color: var(--berry);
}

.confirm__message {
  margin: 0;
  font-weight: 700;
  font-size: 1.05rem;
  line-height: 1.5;
}

.confirm__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}
</style>
