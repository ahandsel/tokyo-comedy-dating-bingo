<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps<{
  open: boolean
  titleId: string
}>()

const emit = defineEmits<{
  close: []
}>()

const dialog = ref<HTMLDialogElement | null>(null)

/**
 * Mirror the `open` prop onto the native <dialog>.
 * showModal() gives a backdrop, focus trapping, Escape handling, and focus
 * restoration for free. Browsers without it (very old) fall back to the
 * plain `open` attribute, which renders the dialog inline.
 */
function sync(open: boolean) {
  const el = dialog.value
  if (!el) return
  if (open) {
    if (el.open) return
    if (typeof el.showModal === 'function') el.showModal()
    else el.setAttribute('open', '')
    return
  }
  if (!el.open) return
  if (typeof el.close === 'function') el.close()
  else el.removeAttribute('open')
}

watch(
  () => props.open,
  (open) => sync(open),
  { flush: 'post' },
)

onMounted(() => sync(props.open))
onBeforeUnmount(() => sync(false))

/** Escape key (or a platform back gesture) requests a close. */
function onCancel(event: Event) {
  event.preventDefault()
  emit('close')
}

/** The browser closed the dialog by itself; keep the prop in sync. */
function onNativeClose() {
  if (props.open) emit('close')
}

function onBackdropClick(event: MouseEvent) {
  if (event.target === dialog.value) emit('close')
}
</script>

<template>
  <dialog
    ref="dialog"
    class="modal"
    :aria-labelledby="titleId"
    @cancel="onCancel"
    @close="onNativeClose"
    @click="onBackdropClick"
  >
    <div v-if="open" class="modal__panel">
      <slot />
    </div>
  </dialog>
</template>

<style scoped>
.modal {
  width: min(92vw, 420px);
  max-height: 90dvh;
  padding: 0;
  border: 0;
  border-radius: 22px;
  background: transparent;
  color: var(--ink);
  overflow: visible;
}

.modal:not([open]) {
  display: none;
}

.modal::backdrop {
  background: rgba(38, 26, 33, 0.55);
  backdrop-filter: blur(2px);
}

.modal__panel {
  padding: 22px 20px;
  border-radius: 22px;
  background: var(--cream);
  box-shadow: var(--shadow);
  display: grid;
  gap: 12px;
  max-height: 90dvh;
  overflow: auto;
}
</style>
