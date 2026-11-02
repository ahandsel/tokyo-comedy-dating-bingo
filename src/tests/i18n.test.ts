import { nextTick } from 'vue'
import { describe, expect, it } from 'vitest'
import en from '../i18n/locales/en'
import ja from '../i18n/locales/ja'
import {
  PREFERENCES_KEY,
  createAppI18n,
  detectLocale,
  readSavedPreferences,
  resolveInitialLocale,
  writeSavedPreferences,
} from '../i18n'
import { createMemoryStorage } from '../composables/useGameStorage'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'
import { getQuestionText } from '../data/questions'
import { mountApp, mountWithI18n } from './helpers'

function flattenKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' ? flattenKeys(v as Record<string, unknown>, `${prefix}${k}.`) : [`${prefix}${k}`],
  )
}

describe('locale detection', () => {
  it('selects English for unsupported browser locales', () => {
    expect(detectLocale(['fr-FR', 'de'])).toBe('en')
    expect(detectLocale([])).toBe('en')
    expect(detectLocale(undefined)).toBe('en')
  })

  it('selects Japanese for Japanese browser locales', () => {
    expect(detectLocale(['ja'])).toBe('ja')
    expect(detectLocale(['ja-JP', 'en-US'])).toBe('ja')
    expect(detectLocale(['fr', 'ja-JP'])).toBe('ja')
  })

  it('lets a saved preference override browser detection', () => {
    const storage = createMemoryStorage()
    writeSavedPreferences(storage, { locale: 'en' })
    expect(resolveInitialLocale(storage, { languages: ['ja-JP'], language: 'ja-JP' })).toBe('en')
    writeSavedPreferences(storage, { locale: 'ja' })
    expect(resolveInitialLocale(storage, { languages: ['en-US'], language: 'en-US' })).toBe('ja')
  })

  it('ignores corrupted preferences and falls back to detection', () => {
    const storage = createMemoryStorage()
    storage.setItem(PREFERENCES_KEY, '{not json')
    expect(readSavedPreferences(storage)).toBeNull()
    expect(resolveInitialLocale(storage, { languages: ['ja'], language: 'ja' })).toBe('ja')
    storage.setItem(PREFERENCES_KEY, JSON.stringify({ locale: 'xx' }))
    expect(resolveInitialLocale(storage, { languages: ['en'], language: 'en' })).toBe('en')
  })

  it('uses navigator.language when languages is empty', () => {
    expect(resolveInitialLocale(undefined, { languages: [] as unknown as readonly string[], language: 'ja' })).toBe('ja')
  })
})

describe('message catalogues', () => {
  it('has every English key in Japanese and vice versa', () => {
    const enKeys = flattenKeys(en).sort()
    const jaKeys = flattenKeys(ja as unknown as Record<string, unknown>).sort()
    expect(jaKeys).toEqual(enKeys)
    expect(enKeys.length).toBeGreaterThan(50)
  })

  it('has no empty messages in either language', () => {
    for (const catalogue of [en, ja]) {
      const walk = (obj: Record<string, unknown>) => {
        for (const v of Object.values(obj)) {
          if (typeof v === 'string') expect(v.trim().length).toBeGreaterThan(0)
          else walk(v as Record<string, unknown>)
        }
      }
      walk(catalogue as unknown as Record<string, unknown>)
    }
  })

  it('keeps the brand and BINGO unchanged in Japanese', () => {
    expect(ja.app.brand).toBe('Tokyo Comedy Dating')
    expect(ja.app.bingo).toBe('BINGO')
  })

  it('falls back to English for a missing key', () => {
    const i18n = createAppI18n('ja')
    i18n.global.mergeLocaleMessage('en', { extra: { onlyEnglish: 'English only' } })
    expect(i18n.global.t('extra.onlyEnglish')).toBe('English only')
  })

  it('formats progress text in both languages', () => {
    const i18n = createAppI18n('en')
    expect(i18n.global.t('game.progress', { current: 8, total: 24 })).toBe('Card 8 of 24')
    i18n.global.locale.value = 'ja'
    expect(i18n.global.t('game.progress', { current: 8, total: 24 })).toBe('24問中8問目')
  })
})

describe('LanguageSwitcher', () => {
  it('renders English | 日本語 and switches the locale', async () => {
    const { wrapper, i18n } = mountWithI18n(LanguageSwitcher, 'en')
    expect(wrapper.text()).toContain('English')
    expect(wrapper.text()).toContain('日本語')
    await wrapper.find('[data-locale="ja"]').trigger('click')
    expect(i18n.global.locale.value).toBe('ja')
    expect(wrapper.find('[data-locale="ja"]').attributes('aria-pressed')).toBe('true')
  })
})

describe('language switching in the app', () => {
  it('updates the welcome screen without touching game state', async () => {
    const { wrapper, i18n } = mountApp('en')
    expect(wrapper.text()).toContain('Start swiping')
    await wrapper.find('[data-locale="ja"]').trigger('click')
    expect(wrapper.text()).toContain('スワイプ開始')
    expect(wrapper.text()).toContain('あなたの恋愛、どれくらい波乱万丈？')
    expect(i18n.global.locale.value).toBe('ja')
    expect(document.documentElement.lang).toBe('ja')
    expect(JSON.parse(localStorage.getItem(PREFERENCES_KEY)!)).toEqual({ locale: 'ja' })
    wrapper.unmount()
  })

  it('changes the current question text but keeps ID, answers, and order during play', async () => {
    const { wrapper } = mountApp('en')
    await wrapper.find('[data-testid="btn-start"]').trigger('click')
    for (let i = 0; i < 7; i++) {
      await wrapper.find('[data-testid="btn-yes"]').trigger('click')
    }
    const before = wrapper.find('[data-testid="swipe-card"]:not([aria-hidden])')
    const id = before.attributes('data-question-id')!
    expect(before.text()).toContain(getQuestionText(id, 'en'))
    expect(wrapper.find('[data-testid="progress-label"]').text()).toBe('Card 8 of 24')
    const savedBefore = localStorage.getItem('tcdb:game')

    await wrapper.find('[data-locale="ja"]').trigger('click')
    await nextTick()

    const after = wrapper.find('[data-testid="swipe-card"]:not([aria-hidden])')
    expect(after.attributes('data-question-id')).toBe(id)
    expect(after.text()).toContain(getQuestionText(id, 'ja'))
    expect(wrapper.find('[data-testid="progress-label"]').text()).toBe('24問中8問目')
    expect(wrapper.find('[data-testid="btn-yes"]').text()).toContain('はい')
    expect(wrapper.find('[data-testid="btn-no"]').text()).toContain('いいえ')
    expect(wrapper.find('[data-testid="btn-undo"]').text()).toContain('取り消す')
    expect(localStorage.getItem('tcdb:game')).toBe(savedBefore)
    wrapper.unmount()
  })

  it('updates results text and board labels without reshuffling', async () => {
    const { wrapper } = mountApp('en')
    await wrapper.find('[data-testid="btn-start"]').trigger('click')
    for (let i = 0; i < 24; i++) await wrapper.find('[data-testid="btn-no"]').trigger('click')
    await new Promise((r) => setTimeout(r, 950))
    await nextTick()
    expect(wrapper.find('[data-testid="result-title"]').text()).toBe('No Bingo!')
    const saved = JSON.parse(localStorage.getItem('tcdb:game')!)
    const cellsBefore = wrapper.findAll('[data-testid="bingo-cell"]').map((c) => c.text())
    expect(cellsBefore[12]).toContain('FREE SPACE')

    await wrapper.find('[data-locale="ja"]').trigger('click')
    await nextTick()
    expect(wrapper.find('[data-testid="result-title"]').text()).toBe('ビンゴならず！')
    expect(wrapper.find('[data-testid="result-subtitle"]').text()).toBe('でも、なかなか濃い恋愛遍歴！')
    expect(wrapper.find('[data-testid="btn-play-again"]').text()).toContain('もう一度プレイ')
    const cellsAfter = wrapper.findAll('[data-testid="bingo-cell"]').map((c) => c.text())
    expect(cellsAfter[12]).toContain('フリー')
    saved.boardQuestionIds.forEach((id: string, i: number) => {
      if (id === 'free') return
      expect(cellsBefore[i]).toContain(getQuestionText(id, 'en'))
      expect(cellsAfter[i]).toContain(getQuestionText(id, 'ja'))
    })
    expect(JSON.parse(localStorage.getItem('tcdb:game')!).boardQuestionIds).toEqual(saved.boardQuestionIds)
    wrapper.unmount()
  })

  it('preserves the language preference across a restart and a reload', async () => {
    const { wrapper } = mountApp('en')
    await wrapper.find('[data-locale="ja"]').trigger('click')
    await wrapper.find('[data-testid="btn-start"]').trigger('click')
    for (let i = 0; i < 24; i++) await wrapper.find('[data-testid="btn-yes"]').trigger('click')
    await new Promise((r) => setTimeout(r, 950))
    await nextTick()
    await wrapper.find('[data-testid="btn-play-again"]').trigger('click')
    await wrapper.find('[data-testid="confirm-ok"]').trigger('click')
    expect(wrapper.text()).toContain('スワイプ開始')
    expect(localStorage.getItem('tcdb:game')).toBeNull()
    wrapper.unmount()

    expect(resolveInitialLocale(localStorage, { languages: ['en-US'], language: 'en-US' })).toBe('ja')
  })
})

describe('language preference persistence', () => {
  it('does not save a merely detected locale, only an explicit choice', async () => {
    const { wrapper } = mountApp('ja')
    await nextTick()
    expect(localStorage.getItem(PREFERENCES_KEY)).toBeNull()
    expect(document.documentElement.lang).toBe('ja')
    await wrapper.find('[data-locale="en"]').trigger('click')
    expect(JSON.parse(localStorage.getItem(PREFERENCES_KEY)!)).toEqual({ locale: 'en' })
    wrapper.unmount()
  })
})

describe('credits', () => {
  it('credits Yurié Collins and links out from the welcome screen in both languages', async () => {
    const { wrapper } = mountApp('en')
    expect(wrapper.find('[data-testid="credit"]').text()).toContain(
      'A fan-made game inspired by the comedy of Yurié Collins. The Bingo idea and most of the questions come from her show Tokyo Hoe Tales.',
    )
    expect(wrapper.find('[data-testid="unofficial-notice"]').text()).toContain(
      'Unofficial fan game. Not affiliated with Tokyo Comedy Bar.',
    )
    const artist = wrapper.find('[data-testid="credit-artist-link"]')
    expect(artist.attributes('href')).toBe('https://linktr.ee/babypinkhaus')
    expect(artist.attributes('target')).toBe('_blank')
    expect(artist.attributes('rel')).toBe('noopener noreferrer')
    expect(artist.attributes('aria-label')).toBe('Yurié Collins (opens in a new tab)')
    expect(wrapper.find('[data-testid="credit"] [data-testid="credit-venue-link"]').exists()).toBe(false)
    const venue = wrapper.find('[data-testid="unofficial-notice"] [data-testid="credit-venue-link"]')
    expect(venue.attributes('href')).toBe('https://www.tokyocomedybar.com/')
    expect(venue.attributes('target')).toBe('_blank')
    expect(venue.attributes('rel')).toBe('noopener noreferrer')
    expect(venue.attributes('aria-label')).toBe('Tokyo Comedy Bar (opens in a new tab)')

    await wrapper.find('[data-locale="ja"]').trigger('click')
    expect(wrapper.find('[data-testid="credit"]').text()).toContain(
      'ユリエ コリンズのコメディに着想を得たファンメイドのゲームです。ビンゴのアイデアと質問の多くは、彼女のショー「Tokyo Hoe Tales」が元になっています。',
    )
    expect(wrapper.find('[data-testid="unofficial-notice"]').text()).toContain(
      '非公式のファンゲームです。Tokyo Comedy Barとは提携していません。',
    )
    expect(wrapper.find('[data-testid="credit-artist-link"]').attributes('aria-label')).toBe(
      'ユリエ コリンズ（新しいタブで開きます）',
    )
    expect(
      wrapper.find('[data-testid="unofficial-notice"] [data-testid="credit-venue-link"]').attributes('aria-label'),
    ).toBe('Tokyo Comedy Bar（新しいタブで開きます）')
    wrapper.unmount()
  })

  it('gives Yurié Collins and Tokyo Comedy Bar a shoutout on the results screen in both languages', async () => {
    const { wrapper } = mountApp('en')
    await wrapper.find('[data-testid="btn-start"]').trigger('click')
    for (let i = 0; i < 24; i++) await wrapper.find('[data-testid="btn-no"]').trigger('click')
    expect(wrapper.find('[data-testid="shoutout"]').exists()).toBe(false)
    await new Promise((r) => setTimeout(r, 950))
    await nextTick()

    const shoutout = wrapper.find('[data-testid="shoutout"]')
    expect(shoutout.text()).toContain(
      'Your dating life is already a comedy show. See the real thing: Yurié Collins live, and stand-up in English and Japanese at Tokyo Comedy Bar in Shibuya.',
    )
    const artist = shoutout.find('[data-testid="credit-artist-link"]')
    expect(artist.attributes('href')).toBe('https://linktr.ee/babypinkhaus')
    expect(artist.attributes('target')).toBe('_blank')
    expect(artist.attributes('rel')).toBe('noopener noreferrer')
    expect(artist.attributes('aria-label')).toBe('Yurié Collins (opens in a new tab)')
    const venue = shoutout.find('[data-testid="credit-venue-link"]')
    expect(venue.attributes('href')).toBe('https://www.tokyocomedybar.com/')
    expect(venue.attributes('target')).toBe('_blank')
    expect(venue.attributes('rel')).toBe('noopener noreferrer')
    expect(venue.attributes('aria-label')).toBe('Tokyo Comedy Bar (opens in a new tab)')

    await wrapper.find('[data-locale="ja"]').trigger('click')
    await nextTick()
    expect(wrapper.find('[data-testid="shoutout"]').text()).toContain(
      'あなたの恋愛はもうコメディ。本物の笑いは、ユリエ コリンズのライブと、渋谷のTokyo Comedy Barで楽しめる英語と日本語のスタンドアップで！',
    )
    expect(wrapper.find('[data-testid="shoutout"] [data-testid="credit-artist-link"]').attributes('aria-label')).toBe(
      'ユリエ コリンズ（新しいタブで開きます）',
    )
    expect(wrapper.find('[data-testid="shoutout"] [data-testid="credit-venue-link"]').attributes('aria-label')).toBe(
      'Tokyo Comedy Bar（新しいタブで開きます）',
    )
    wrapper.unmount()
  })

  it('credits Tokyo Hoe Tales and links to the game in the share text in both languages', () => {
    const i18n = createAppI18n('en')
    const url = 'https://example.com/tokyo-comedy-dating-bingo/'
    expect(i18n.global.t('results.shareText', { yes: 10, no: 14, lines: 2, verdict: 'BINGO!', url })).toBe(
      'My Tokyo Comedy Dating Bingo: Yes 10, No 14, Bingo lines 2. BINGO! A fan-made game inspired by Tokyo Hoe Tales, the comedy show by Yurié Collins. Play at https://example.com/tokyo-comedy-dating-bingo/',
    )
    i18n.global.locale.value = 'ja'
    expect(i18n.global.t('results.shareText', { yes: 10, no: 14, lines: 2, verdict: 'ビンゴ達成！', url })).toBe(
      '私のTokyo Comedy Dating Bingo：はい10、いいえ14、ビンゴ2。ビンゴ達成！ユリエ コリンズのコメディショー「Tokyo Hoe Tales」に着想を得たファンメイドゲーム。プレイはこちら：https://example.com/tokyo-comedy-dating-bingo/',
    )
  })
})
