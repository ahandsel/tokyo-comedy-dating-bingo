import { createI18n } from 'vue-i18n'
import { LOCALES, type Locale, type UserPreferences } from '../types/game'
import type { MessageSchema } from '../types/i18n'
import en from './locales/en'
import ja from './locales/ja'

export const DEFAULT_LOCALE: Locale = 'en'
export const PREFERENCES_KEY = 'tcdb:preferences'

export const messages: Record<Locale, MessageSchema> = { en, ja }

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
}

/**
 * Pick a locale from browser language tags.
 * Any tag starting with "ja" selects Japanese; everything else falls back to English.
 */
export function detectLocale(languages: readonly string[] | undefined): Locale {
  for (const tag of languages ?? []) {
    if (typeof tag === 'string' && tag.toLowerCase().startsWith('ja')) return 'ja'
    if (typeof tag === 'string' && tag.toLowerCase().startsWith('en')) return 'en'
  }
  return DEFAULT_LOCALE
}

function browserLanguages(nav: Pick<Navigator, 'languages' | 'language'> | undefined): string[] {
  if (!nav) return []
  if (Array.isArray(nav.languages) && nav.languages.length > 0) return [...nav.languages]
  return nav.language ? [nav.language] : []
}

export function readSavedPreferences(storage: Storage | undefined): UserPreferences | null {
  try {
    const raw = storage?.getItem(PREFERENCES_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && isLocale((parsed as { locale?: unknown }).locale)) {
      return { locale: (parsed as { locale: Locale }).locale }
    }
  } catch {
    /* corrupted preferences are ignored */
  }
  return null
}

export function writeSavedPreferences(storage: Storage | undefined, prefs: UserPreferences): void {
  try {
    storage?.setItem(PREFERENCES_KEY, JSON.stringify(prefs))
  } catch {
    /* storage may be full or blocked; the in-memory locale still works */
  }
}

/** Saved preference wins; otherwise detect from the browser. */
export function resolveInitialLocale(
  storage: Storage | undefined,
  nav: Pick<Navigator, 'languages' | 'language'> | undefined,
): Locale {
  return readSavedPreferences(storage)?.locale ?? detectLocale(browserLanguages(nav))
}

export function createAppI18n(locale: Locale = DEFAULT_LOCALE) {
  return createI18n<[MessageSchema], Locale, false>({
    legacy: false,
    locale,
    fallbackLocale: DEFAULT_LOCALE,
    messages,
    missingWarn: import.meta.env.DEV,
    fallbackWarn: false,
  })
}

export type AppI18n = ReturnType<typeof createAppI18n>
