import { nextTick } from 'vue'
import { describe, expect, it } from 'vitest'
import en from '../i18n/locales/en'
import { flush, mountApp } from './helpers'

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
})
