import { nextTick } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import SwipeCard from '../components/SwipeCard.vue'
import { QUESTION_IDS } from '../data/questions'
import { answerAll, firePointer, memoryStore, mountApp, mountWithI18n } from './helpers'

async function pointerSwipe(wrapper: ReturnType<typeof mountWithI18n>['wrapper'], dx: number) {
  const card = wrapper.find('[data-testid="swipe-card"]')
  Object.defineProperty(card.element, 'offsetWidth', { value: 320, configurable: true })
  await firePointer(card.element, 'pointerdown', { pointerId: 1, clientX: 100, clientY: 100 })
  await firePointer(card.element, 'pointermove', { pointerId: 1, clientX: 100 + dx / 2, clientY: 100 })
  await firePointer(card.element, 'pointermove', { pointerId: 1, clientX: 100 + dx, clientY: 100 })
  await firePointer(card.element, 'pointerup', { pointerId: 1, clientX: 100 + dx, clientY: 100 })
}

describe('SwipeCard gestures', () => {
  const props = { questionId: 'q01', text: 'Test', number: 1, total: 24, interactive: true }

  it('emits a left swipe for a drag past the threshold', async () => {
    const { wrapper } = mountWithI18n(SwipeCard, 'en', props)
    await pointerSwipe(wrapper, -200)
    expect(wrapper.emitted('swipe')).toEqual([['left']])
  })

  it('emits a right swipe for a drag past the threshold', async () => {
    const { wrapper } = mountWithI18n(SwipeCard, 'en', props)
    await pointerSwipe(wrapper, 200)
    expect(wrapper.emitted('swipe')).toEqual([['right']])
  })

  it('snaps back below the threshold without emitting', async () => {
    const { wrapper } = mountWithI18n(SwipeCard, 'en', props)
    await pointerSwipe(wrapper, 30)
    expect(wrapper.emitted('swipe')).toBeUndefined()
  })

  it('shows directional feedback while dragging', async () => {
    const { wrapper } = mountWithI18n(SwipeCard, 'en', props)
    const card = wrapper.find('[data-testid="swipe-card"]')
    Object.defineProperty(card.element, 'offsetWidth', { value: 320, configurable: true })
    await firePointer(card.element, 'pointerdown', { pointerId: 1, clientX: 100, clientY: 100 })
    await firePointer(card.element, 'pointermove', { pointerId: 1, clientX: 180, clientY: 100 })
    expect((card.element as HTMLElement).style.transform).toContain('rotate(4.8deg)')
    expect(wrapper.find('.card__stamp--yes').attributes('style')).toContain('opacity: 0.7')
    await firePointer(card.element, 'pointercancel', { pointerId: 1 })
    expect(wrapper.emitted('swipe')).toBeUndefined()
  })

  it('ignores gestures when not interactive', async () => {
    const { wrapper } = mountWithI18n(SwipeCard, 'en', { ...props, interactive: false })
    await pointerSwipe(wrapper, 300)
    expect(wrapper.emitted('swipe')).toBeUndefined()
  })
})

describe('game store answers', () => {
  it('records NO for left and YES for right via the store', () => {
    const { store } = memoryStore()
    store.start()
    const first = store.currentQuestionId.value!
    store.answer('no')
    const second = store.currentQuestionId.value!
    store.answer('yes')
    expect(store.state.answers[first]).toBe('no')
    expect(store.state.answers[second]).toBe('yes')
    expect(store.state.currentQuestionIndex).toBe(2)
  })

  it('shows every question exactly once in a game', () => {
    const { store } = memoryStore(7)
    store.start()
    expect([...store.state.questionOrder].sort()).toEqual([...QUESTION_IDS].sort())
    const seen: string[] = []
    answerAll(store, (id) => {
      seen.push(id)
      return 'yes'
    })
    expect(seen).toHaveLength(24)
    expect(new Set(seen).size).toBe(24)
  })

  it('undo restores the previous question and removes its answer', () => {
    const { store } = memoryStore()
    store.start()
    const first = store.currentQuestionId.value!
    store.answer('yes')
    expect(store.canUndo.value).toBe(true)
    expect(store.undo()).toBe(first)
    expect(store.currentQuestionId.value).toBe(first)
    expect(store.state.answers[first]).toBeUndefined()
    expect(store.state.currentQuestionIndex).toBe(0)
    expect(store.canUndo.value).toBe(false)
    expect(store.undo()).toBeNull()
  })

  it('re-answering after undo does not duplicate answers', () => {
    const { store } = memoryStore()
    store.start()
    const first = store.currentQuestionId.value!
    store.answer('yes')
    store.undo()
    store.answer('no')
    expect(store.state.answers[first]).toBe('no')
    expect(store.state.answerHistory).toEqual([first])
    expect(Object.keys(store.state.answers)).toHaveLength(1)
  })

  it('completes only after 24 answers', () => {
    const { store } = memoryStore()
    store.start()
    for (let i = 0; i < 23; i++) store.answer('yes')
    expect(store.state.phase).toBe('playing')
    expect(store.state.boardQuestionIds).toBeNull()
    store.answer('yes')
    expect(store.state.phase).toBe('results')
    expect(store.state.boardQuestionIds).toHaveLength(25)
    expect(store.answer('yes')).toBe(false)
  })
})

describe('swipe screen integration', () => {
  it('buttons, keyboard, and gestures produce equivalent answers', async () => {
    const { wrapper } = mountApp('en')
    await wrapper.find('[data-testid="btn-start"]').trigger('click')
    const saved = () => JSON.parse(localStorage.getItem('tcdb:game')!)

    const q1 = wrapper.find('[data-testid="swipe-card"]').attributes('data-question-id')!
    await wrapper.find('[data-testid="btn-no"]').trigger('click')
    expect(saved().answers[q1]).toBe('no')

    const q2 = saved().questionOrder[1]
    await wrapper.find('[data-testid="swipe-deck"]').trigger('keydown', { key: 'ArrowRight' })
    expect(saved().answers[q2]).toBe('yes')

    const q3 = saved().questionOrder[2]
    const topCard = wrapper.findAll('[data-testid="swipe-card"]').find((c) => c.attributes('data-question-id') === q3)!
    Object.defineProperty(topCard.element, 'offsetWidth', { value: 320, configurable: true })
    await firePointer(topCard.element, 'pointerdown', { pointerId: 2, clientX: 200, clientY: 100 })
    await firePointer(topCard.element, 'pointermove', { pointerId: 2, clientX: 20, clientY: 110 })
    await firePointer(topCard.element, 'pointerup', { pointerId: 2, clientX: 20, clientY: 110 })
    expect(saved().answers[q3]).toBe('no')
    expect(saved().currentQuestionIndex).toBe(3)
    expect(wrapper.find('[data-testid="progress-label"]').text()).toBe('Card 4 of 24')

    await wrapper.find('[data-testid="btn-undo"]').trigger('click')
    expect(saved().answers[q3]).toBeUndefined()
    expect(saved().currentQuestionIndex).toBe(2)
    expect(wrapper.find('[data-testid="progress-label"]').text()).toBe('Card 3 of 24')
    expect(wrapper.find('[data-testid="announcer"]').text()).toContain('Your last answer was removed')
    wrapper.unmount()
  })

  it('ignores a repeated swipe on the same card while it is leaving', async () => {
    const { wrapper } = mountApp('en')
    await wrapper.find('[data-testid="btn-start"]').trigger('click')
    const deck = wrapper.findComponent({ name: 'SwipeDeck' })
    const exposed = deck.vm as unknown as { swipe: (d: 'left' | 'right') => void }
    exposed.swipe('left')
    exposed.swipe('left')
    await nextTick()
    const saved = JSON.parse(localStorage.getItem('tcdb:game')!)
    // The second call arrives before the deck re-renders, so it targets the same card and is ignored.
    expect(saved.currentQuestionIndex).toBe(1)
    await nextTick()
    exposed.swipe('right')
    expect(JSON.parse(localStorage.getItem('tcdb:game')!).currentQuestionIndex).toBe(2)
    wrapper.unmount()
  })
})

describe('swipe animations', () => {
  it('keeps the same card element while it leaves, so the exit transition can run', async () => {
    const { wrapper } = mountApp('en')
    await wrapper.find('[data-testid="btn-start"]').trigger('click')
    const top = wrapper.find('[data-testid="swipe-card"]')
    const id = top.attributes('data-question-id')!
    const element = top.element

    await wrapper.find('[data-testid="btn-yes"]').trigger('click')

    expect(element.isConnected).toBe(true)
    expect(element.classList.contains('card--leaving-right')).toBe(true)
    expect(element.getAttribute('data-question-id')).toBe(id)
    const interactive = wrapper.findAll('[data-testid="swipe-card"]').filter((c) => c.classes('card--interactive'))
    expect(interactive).toHaveLength(1)
    expect(interactive[0]!.attributes('data-question-id')).not.toBe(id)

    await new Promise((r) => setTimeout(r, 350))
    await nextTick()
    expect(element.isConnected).toBe(false)
    wrapper.unmount()
  })

  it('brings a leaving card straight back when its answer is undone', async () => {
    const { wrapper } = mountApp('en')
    await wrapper.find('[data-testid="btn-start"]').trigger('click')
    const element = wrapper.find('[data-testid="swipe-card"]').element
    await wrapper.find('[data-testid="btn-no"]').trigger('click')
    expect(element.classList.contains('card--leaving-left')).toBe(true)

    await wrapper.find('[data-testid="btn-undo"]').trigger('click')
    expect(element.isConnected).toBe(true)
    expect(element.classList.contains('card--leaving-left')).toBe(false)
    expect(element.classList.contains('card--returning-left')).toBe(true)
    expect(element.classList.contains('card--interactive')).toBe(true)
    wrapper.unmount()
  })
})

describe('flick gestures', () => {
  it('commits a short but fast flick', async () => {
    vi.useFakeTimers()
    try {
      const { wrapper } = mountWithI18n(SwipeCard, 'en', { questionId: 'q01', text: 'Test', number: 1, total: 24, interactive: true })
      const card = wrapper.find('[data-testid="swipe-card"]')
      Object.defineProperty(card.element, 'offsetWidth', { value: 320, configurable: true })
      await firePointer(card.element, 'pointerdown', { pointerId: 1, clientX: 100, clientY: 100 })
      vi.advanceTimersByTime(16)
      await firePointer(card.element, 'pointermove', { pointerId: 1, clientX: 130, clientY: 100 })
      vi.advanceTimersByTime(16)
      await firePointer(card.element, 'pointermove', { pointerId: 1, clientX: 160, clientY: 100 })
      await firePointer(card.element, 'pointerup', { pointerId: 1, clientX: 160, clientY: 100 })
      expect(wrapper.emitted('swipe')).toEqual([['right']])
    } finally {
      vi.useRealTimers()
    }
  })

  it('snaps back after a slow short drag', async () => {
    vi.useFakeTimers()
    try {
      const { wrapper } = mountWithI18n(SwipeCard, 'en', { questionId: 'q01', text: 'Test', number: 1, total: 24, interactive: true })
      const card = wrapper.find('[data-testid="swipe-card"]')
      Object.defineProperty(card.element, 'offsetWidth', { value: 320, configurable: true })
      await firePointer(card.element, 'pointerdown', { pointerId: 1, clientX: 100, clientY: 100 })
      vi.advanceTimersByTime(300)
      await firePointer(card.element, 'pointermove', { pointerId: 1, clientX: 130, clientY: 100 })
      vi.advanceTimersByTime(300)
      await firePointer(card.element, 'pointermove', { pointerId: 1, clientX: 160, clientY: 100 })
      await firePointer(card.element, 'pointerup', { pointerId: 1, clientX: 160, clientY: 100 })
      expect(wrapper.emitted('swipe')).toBeUndefined()
    } finally {
      vi.useRealTimers()
    }
  })
})
