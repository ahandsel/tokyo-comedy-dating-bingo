import { TriangleAlert } from '@lucide/vue'
import { nextTick } from 'vue'
import { describe, expect, it } from 'vitest'
import CellDetailModal from '../components/CellDetailModal.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import ModalDialog from '../components/ModalDialog.vue'
import { mountApp, mountWithI18n } from './helpers'

describe('CellDetailModal copy', () => {
  const props = { open: true, text: 'Test', isFree: false, answer: 'yes', winning: true }

  it('labels the answer and the winning line in English', async () => {
    const { wrapper } = mountWithI18n(CellDetailModal, 'en', props)
    await nextTick()
    expect(wrapper.text()).toContain('Your answer:')
    expect(wrapper.find('[data-testid="detail-winning"]').text()).toContain('This square is part of a Bingo line.')
    expect(wrapper.find('[data-testid="detail-change"]').text()).toContain('Change to No')
  })

  it('labels the answer and the winning line in Japanese', async () => {
    const { wrapper } = mountWithI18n(CellDetailModal, 'ja', props)
    await nextTick()
    expect(wrapper.text()).toContain('あなたの回答：')
    expect(wrapper.find('[data-testid="detail-winning"]').text()).toContain('このマスはビンゴのライン上にあります。')
    expect(wrapper.find('[data-testid="detail-change"]').text()).toContain('「いいえ」に変える')
  })

  // jsdom has no showModal(), so these tests pin the autofocus attribute that real browsers follow.
  it('gives the initial focus to Close, so a repeated Enter cannot change the answer', async () => {
    const { wrapper } = mountWithI18n(CellDetailModal, 'en', props)
    await nextTick()
    expect(wrapper.find('[data-testid="detail-close"]').attributes()).toHaveProperty('autofocus')
    expect(wrapper.find('[data-testid="detail-change"]').attributes()).not.toHaveProperty('autofocus')
  })
})

describe('ConfirmDialog', () => {
  it('shows the optional icon without exposing it to screen readers', async () => {
    const { wrapper } = mountWithI18n(ConfirmDialog, 'en', { open: true, message: 'Sure?', confirmLabel: 'OK', cancelLabel: 'Cancel', icon: TriangleAlert })
    await nextTick()
    expect(wrapper.find('svg.confirm__icon.lucide-triangle-alert').attributes('aria-hidden')).toBe('true')
    expect(wrapper.find('#confirm-title').text()).toBe('Sure?')
  })

  it('gives the initial focus to Cancel, not to the destructive action', async () => {
    const { wrapper } = mountWithI18n(ConfirmDialog, 'en', { open: true, message: 'Sure?', confirmLabel: 'OK', cancelLabel: 'Cancel' })
    await nextTick()
    expect(wrapper.find('[data-testid="confirm-cancel"]').attributes()).toHaveProperty('autofocus')
    expect(wrapper.find('[data-testid="confirm-ok"]').attributes()).not.toHaveProperty('autofocus')
  })
})

describe('ModalDialog', () => {
  it('opens and closes the native dialog with the open prop', async () => {
    const { wrapper } = mountWithI18n(ModalDialog, 'en', { open: false, titleId: 't' })
    const dialog = wrapper.find('dialog').element as HTMLDialogElement
    expect(dialog.open).toBe(false)
    await wrapper.setProps({ open: true })
    await nextTick()
    expect(dialog.open).toBe(true)
    await wrapper.setProps({ open: false })
    await nextTick()
    expect(dialog.open).toBe(false)
  })

  it('asks to close on Escape (cancel) and on a backdrop click', async () => {
    const { wrapper } = mountWithI18n(ModalDialog, 'en', { open: true, titleId: 't' })
    await nextTick()
    await wrapper.find('dialog').trigger('cancel')
    expect(wrapper.emitted('close')).toHaveLength(1)
    await wrapper.find('dialog').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(2)
  })
})

describe('welcome screen start-over confirmation', () => {
  it('asks before discarding a paused game and keeps it on cancel', async () => {
    const { wrapper } = mountApp('en')
    await wrapper.find('[data-testid="btn-start"]').trigger('click')
    await wrapper.find('[data-testid="btn-yes"]').trigger('click')
    await wrapper.find('.game__home').trigger('click')
    await new Promise((r) => setTimeout(r, 0))
    expect(wrapper.find('[data-testid="resume-hint"]').exists()).toBe(true)
    const order = JSON.parse(localStorage.getItem('tcdb:game')!).questionOrder

    await wrapper.find('[data-testid="btn-start"]').trigger('click')
    expect(wrapper.find('[data-testid="confirm-cancel"]').exists()).toBe(true)
    await wrapper.find('[data-testid="confirm-cancel"]').trigger('click')
    expect(JSON.parse(localStorage.getItem('tcdb:game')!).questionOrder).toEqual(order)
    expect(JSON.parse(localStorage.getItem('tcdb:game')!).phase).toBe('welcome')

    await wrapper.find('[data-testid="btn-start"]').trigger('click')
    await wrapper.find('[data-testid="confirm-ok"]').trigger('click')
    const fresh = JSON.parse(localStorage.getItem('tcdb:game')!)
    expect(fresh.phase).toBe('playing')
    expect(fresh.currentQuestionIndex).toBe(0)
    wrapper.unmount()
  })

  it('labels the start button "New game" when a game is saved, in both languages', async () => {
    const { wrapper } = mountApp('en')
    await wrapper.find('[data-testid="btn-start"]').trigger('click')
    await wrapper.find('[data-testid="btn-yes"]').trigger('click')
    await wrapper.find('.game__home').trigger('click')
    await new Promise((r) => setTimeout(r, 0))
    expect(wrapper.find('[data-testid="btn-start"]').text()).toContain('New game')
    expect(wrapper.find('[data-testid="btn-resume"]').text()).toContain('Continue game')
    await wrapper.find('[data-locale="ja"]').trigger('click')
    expect(wrapper.find('[data-testid="btn-start"]').text()).toContain('最初から遊ぶ')
    expect(wrapper.find('[data-testid="btn-resume"]').text()).toContain('続きから遊ぶ')
    wrapper.unmount()
  })

  it('starts immediately when nothing is saved', async () => {
    const { wrapper } = mountApp('en')
    expect(wrapper.find('[data-testid="btn-start"]').text()).toContain('Start swiping')
    await wrapper.find('[data-testid="btn-start"]').trigger('click')
    expect(wrapper.find('[data-testid="confirm-ok"]').exists()).toBe(false)
    expect(JSON.parse(localStorage.getItem('tcdb:game')!).phase).toBe('playing')
    wrapper.unmount()
  })

  it('shows a notice when saved data was unreadable', async () => {
    localStorage.setItem('tcdb:game', '{"version":1,')
    const { wrapper } = mountApp('en')
    expect(wrapper.find('[data-testid="corrupted-notice"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('drops the unreadable-data notice once a new game is saved, in both languages', async () => {
    localStorage.setItem('tcdb:game', '{"version":1,')
    const { wrapper } = mountApp('en')
    await wrapper.find('[data-testid="btn-start"]').trigger('click')
    await wrapper.find('[data-testid="btn-yes"]').trigger('click')
    await wrapper.find('.game__home').trigger('click')
    await new Promise((r) => setTimeout(r, 0))
    expect(wrapper.find('[data-testid="resume-hint"]').text()).toContain('1 of 24 cards answered')
    expect(wrapper.find('[data-testid="corrupted-notice"]').exists()).toBe(false)
    await wrapper.find('[data-locale="ja"]').trigger('click')
    expect(wrapper.find('[data-testid="resume-hint"]').text()).toContain('24問中1問')
    expect(wrapper.find('[data-testid="corrupted-notice"]').exists()).toBe(false)
    wrapper.unmount()
  })
})
