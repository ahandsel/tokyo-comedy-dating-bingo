import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { writeSavedPreferences } from '../i18n'
import { LOCALES, type Locale } from '../types/game'
import { safeLocalStorage } from './useGameStorage'

/**
 * Reactive locale with persistence. Changing the locale only changes
 * displayed text; game state is never touched.
 *
 * The preference is written only when the user picks a language. A locale
 * that was merely detected from the browser is not saved, so a later change
 * of browser language is still honoured.
 */
export function useLocale() {
  const { locale, t } = useI18n()

  const current = computed<Locale>(() => locale.value as Locale)

  function setLocale(next: Locale) {
    if (!LOCALES.includes(next) || locale.value === next) return
    locale.value = next
    writeSavedPreferences(safeLocalStorage(), { locale: next })
  }

  function toggleLocale() {
    setLocale(current.value === 'en' ? 'ja' : 'en')
  }

  return { locale: current, setLocale, toggleLocale, t }
}

/**
 * Keep <html lang> and document.title in sync with the locale.
 * Call once from the root component.
 */
export function useLocaleSideEffects() {
  const { locale, t } = useI18n()
  watch(
    locale,
    (value) => {
      if (typeof document === 'undefined') return
      document.documentElement.lang = value
      document.title = t('app.documentTitle')
    },
    { immediate: true },
  )
}
