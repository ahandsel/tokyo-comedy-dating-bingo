import { nextTick } from 'vue'
import { describe, expect, it } from 'vitest'
import SwipeCard from '../components/SwipeCard.vue'
import { getQuestionText, questions } from '../data/questions'
import en from '../i18n/locales/en'
import type { Locale } from '../types/game'
import { flush, mountApp, mountWithI18n } from './helpers'

/** Every Lucide icon is decorative: the text next to it, or the control's label, carries the meaning. */
function expectIconsHidden(root: Element) {
  const icons = root.querySelectorAll('svg.lucide')
  expect(icons.length).toBeGreaterThan(0)
  icons.forEach((icon) => expect(icon.getAttribute('aria-hidden')).toBe('true'))
}

describe('Lucide icons', () => {
  it('stay hidden from assistive technology and add no text on the welcome and game screens', async () => {
    const { wrapper } = mountApp('en')
    expectIconsHidden(wrapper.element)
    const newTabLinks = wrapper.findAll('a[target="_blank"]')
    expect(newTabLinks.length).toBeGreaterThan(0)
    newTabLinks.forEach((link) => expect(link.find('svg.lucide-external-link').exists()).toBe(true))

    await wrapper.find('[data-testid="btn-start"]').trigger('click')
    expectIconsHidden(wrapper.element)
    expect(wrapper.find('[data-testid="btn-yes"]').text()).toBe('Yes')
    expect(wrapper.find('[data-testid="btn-no"]').text()).toBe('No')
    expect(wrapper.find('[data-testid="btn-undo"]').text()).toBe('Undo')
    wrapper.unmount()
  })

  it('mark each board square by state and stay hidden on the results screen and in the dialog', async () => {
    const { wrapper } = mountApp('en')
    await wrapper.find('[data-testid="btn-start"]').trigger('click')
    for (let i = 0; i < 24; i++) {
      const button = i % 2 === 0 ? 'btn-yes' : 'btn-no'
      await wrapper.find(`[data-testid="${button}"]`).trigger('click')
    }
    await new Promise((r) => setTimeout(r, 950))
    await nextTick()

    expectIconsHidden(wrapper.element)
    const newTabLinks = wrapper.findAll('a[target="_blank"]')
    expect(newTabLinks.length).toBeGreaterThan(0)
    newTabLinks.forEach((link) => expect(link.find('svg.lucide-external-link').exists()).toBe(true))
    expect(wrapper.find('[data-testid="btn-download"]').text()).toBe('Save image')
    expect(wrapper.find('[data-testid="btn-play-again"]').text()).toBe('Play again')

    // The icon, not only the color, tells a Yes square from a No square.
    const cells = wrapper.findAll('[data-testid="bingo-cell"]')
    cells.forEach((cell, index) => {
      if (index === 12) {
        expect(cell.find('svg.lucide-heart').exists()).toBe(true)
        return
      }
      const marked = cell.attributes('data-marked') === 'true'
      expect(cell.find('svg.lucide-check').exists()).toBe(marked)
      expect(cell.find('svg.lucide-x').exists()).toBe(!marked)
    })

    await cells[0]!.trigger('click')
    await nextTick()
    expectIconsHidden(wrapper.find('dialog[open]').element)
    expect(wrapper.find('[data-testid="detail-change"]').text()).toMatch(/^Change to (Yes|No)$/)
    wrapper.unmount()
  })

  it('give each status message and the restart confirmation a matching icon', async () => {
    const { wrapper } = mountApp('en')
    await wrapper.find('[data-testid="btn-start"]').trigger('click')
    for (let i = 0; i < 24; i++) await wrapper.find('[data-testid="btn-yes"]').trigger('click')
    await new Promise((r) => setTimeout(r, 950))
    await nextTick()
    const status = () => wrapper.find('[data-testid="results-status"]')

    await wrapper.findAll('[data-testid="bingo-cell"]')[0]!.trigger('click')
    await wrapper.find('[data-testid="detail-change"]').trigger('click')
    expect(status().find('svg.lucide-pencil').attributes('aria-hidden')).toBe('true')
    await wrapper.find('[data-testid="detail-close"]').trigger('click')

    // jsdom has no canvas, so the export fails and shows the warning icon.
    await wrapper.find('[data-testid="btn-download"]').trigger('click')
    await flush()
    expect(status().text()).toBe(en.results.exportError)
    expect(status().find('svg.lucide-triangle-alert').attributes('aria-hidden')).toBe('true')

    await wrapper.find('[data-testid="btn-play-again"]').trigger('click')
    expect(wrapper.find('dialog[open] svg.confirm__icon.lucide-triangle-alert').exists()).toBe(true)
    wrapper.unmount()
  })

  it('show the chosen artwork above the text of each swipe card', () => {
    // The Lucide class of each card's icon. q21, q25, and q26 have no icon.
    const cardIcons: Record<string, string> = {
      q01: 'lucide-face-expressionless',
      q02: 'lucide-hand-coins',
      q03: 'lucide-earth',
      q04: 'lucide-scan-face',
      q05: 'lucide-bed-double',
      q06: 'lucide-ghost',
      q07: 'lucide-venetian-mask',
      q08: 'lucide-martini',
      q09: 'lucide-house',
      q10: 'lucide-magnet',
      q11: 'lucide-gem',
      q12: 'lucide-banana',
      q13: 'lucide-anchor',
      q14: 'lucide-heart-handshake',
      q15: 'lucide-flame',
      q16: 'lucide-languages',
      q17: 'lucide-message-circle-heart',
      q18: 'lucide-door-open',
      q19: 'lucide-dog',
      q20: 'lucide-smartphone',
      q22: 'lucide-unlink',
      q23: 'lucide-thumbs-up',
      q24: 'lucide-origami',
      q27: 'lucide-graduation-cap',
    }
    const mountCard = (questionId: string, locale: Locale) =>
      mountWithI18n(SwipeCard, locale, { questionId, text: getQuestionText(questionId, locale), number: 1, total: 24 })
        .wrapper

    for (const locale of ['en', 'ja'] as const) {
      for (const { id } of questions) {
        const card = mountCard(id, locale)
        const icon = card.find('[data-testid="card-icon"]')
        if (cardIcons[id]) {
          expect(icon.classes()).toContain(cardIcons[id])
          expect(icon.attributes('aria-hidden')).toBe('true')
          expect(icon.element.nextElementSibling?.textContent).toBe(getQuestionText(id, locale))
        } else {
          expect(icon.exists()).toBe(false)
        }
        card.unmount()
      }
    }
  })
})
