<script setup lang="ts">
import { Languages } from '@lucide/vue'
import { useLocale } from '../composables/useLocale'
import type { Locale } from '../types/game'

const { locale, setLocale, t } = useLocale()

const options: { value: Locale; labelKey: 'app.languageEnglish' | 'app.languageJapanese'; lang: string }[] = [
  { value: 'en', labelKey: 'app.languageEnglish', lang: 'en' },
  { value: 'ja', labelKey: 'app.languageJapanese', lang: 'ja' },
]
</script>

<template>
  <div class="lang" role="group" :aria-label="t('app.languageLabel')">
    <Languages class="lang__icon" aria-hidden="true" />
    <template v-for="(option, index) in options" :key="option.value">
      <span v-if="index > 0" class="lang__sep" aria-hidden="true">|</span>
      <button
        type="button"
        class="lang__btn"
        :class="{ 'lang__btn--active': locale === option.value }"
        :lang="option.lang"
        :aria-pressed="locale === option.value"
        :aria-label="t('app.switchTo', { language: t(option.labelKey) })"
        :data-locale="option.value"
        @click="setLocale(option.value)"
      >
        {{ t(option.labelKey) }}
      </button>
    </template>
  </div>
</template>

<style scoped>
.lang {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.7);
  box-shadow: var(--shadow-soft);
}

.lang__icon {
  width: 1.15rem;
  height: 1.15rem;
  margin-left: 6px;
  color: var(--berry);
}

.lang__sep {
  color: var(--muted-text);
  font-size: 0.85rem;
}

.lang__btn {
  min-height: 40px;
  min-width: 44px;
  padding: 0 10px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.9rem;
  /* A narrow topbar would otherwise break "日本語" across two lines. */
  white-space: nowrap;
  color: var(--ink-soft);
  transition:
    background-color 160ms ease,
    color 160ms ease;
}

.lang__btn:not(.lang__btn--active):hover {
  color: var(--berry);
}

.lang__btn--active {
  background: var(--berry);
  color: var(--white);
}
</style>
