import { nextTick } from 'vue'
import { describe, expect, it } from 'vitest'
import { mountApp } from './helpers'

function press(key: string, init: KeyboardEventInit = {}) {
  window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init }))
  return nextTick()
}

const saved = () => JSON.parse(localStorage.getItem('tcdb:game')!)

describe('page-wide keyboard controls', () => {
  it('answers with the arrow keys without focusing the deck', async () => {
    const { wrapper } = mountApp('en')
    await wrapper.find('[data-testid="btn-start"]').trigger('click')
    const [q1, q2] = saved().questionOrder

    await press('ArrowRight')
    expect(saved().answers[q1]).toBe('yes')
    await press('ArrowLeft')
    expect(saved().answers[q2]).toBe('no')
    expect(saved().currentQuestionIndex).toBe(2)
    wrapper.unmount()
  })

  it('undoes with the down arrow, Backspace, and Ctrl/Cmd+Z', async () => {
    const { wrapper } = mountApp('en')
    await wrapper.find('[data-testid="btn-start"]').trigger('click')
    await press('ArrowRight')
    await press('ArrowRight')
    await press('ArrowRight')
    expect(saved().currentQuestionIndex).toBe(3)

    await press('ArrowDown')
    expect(saved().currentQuestionIndex).toBe(2)
    await press('Backspace')
    expect(saved().currentQuestionIndex).toBe(1)
    await press('z', { metaKey: true })
    expect(saved().currentQuestionIndex).toBe(0)
    expect(wrapper.find('[data-testid="announcer"]').text()).toContain('Your last answer was removed')

    // Nothing left to undo: the key is a no-op.
    await press('ArrowDown')
    expect(saved().currentQuestionIndex).toBe(0)
    wrapper.unmount()
  })

  it('ignores auto-repeat from a held key', async () => {
    const { wrapper } = mountApp('en')
    await wrapper.find('[data-testid="btn-start"]').trigger('click')
    await press('ArrowRight')
    await press('ArrowRight', { repeat: true })
    await press('ArrowRight', { repeat: true })
    expect(saved().currentQuestionIndex).toBe(1)
    wrapper.unmount()
  })

  it('ignores keys with modifiers other than the undo shortcut', async () => {
    const { wrapper } = mountApp('en')
    await wrapper.find('[data-testid="btn-start"]').trigger('click')
    await press('ArrowRight', { altKey: true })
    await press('ArrowLeft', { ctrlKey: true })
    expect(saved().currentQuestionIndex).toBe(0)
    wrapper.unmount()
  })

  it('stops listening once the game screen is gone', async () => {
    const { wrapper } = mountApp('en')
    await wrapper.find('[data-testid="btn-start"]').trigger('click')
    await press('ArrowRight')
    await wrapper.find('.game__home').trigger('click')
    await new Promise((r) => setTimeout(r, 0))
    const before = saved().currentQuestionIndex
    await press('ArrowRight')
    expect(saved().currentQuestionIndex).toBe(before)
    wrapper.unmount()
  })
})

describe('bingo board keyboard navigation', () => {
  it('moves focus with the arrow keys inside the 5x5 grid', async () => {
    const { wrapper } = mountApp('en')
    await wrapper.find('[data-testid="btn-start"]').trigger('click')
    for (let i = 0; i < 24; i++) await press('ArrowRight')
    await new Promise((r) => setTimeout(r, 950))
    await nextTick()
    const cells = wrapper.findAll('[data-testid="bingo-cell"]')
    expect(cells).toHaveLength(25)
    ;(cells[0]!.element as HTMLElement).focus()
    await cells[0]!.trigger('keydown', { key: 'ArrowRight' })
    expect(document.activeElement).toBe(cells[1]!.element)
    await cells[1]!.trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement).toBe(cells[6]!.element)
    await cells[6]!.trigger('keydown', { key: 'End' })
    expect(document.activeElement).toBe(cells[9]!.element)
    await cells[9]!.trigger('keydown', { key: 'ArrowRight' })
    expect(document.activeElement).toBe(cells[9]!.element)
    wrapper.unmount()
  })
})
