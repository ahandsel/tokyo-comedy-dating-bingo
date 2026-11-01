import { beforeEach } from 'vitest'
import { resetGameStore } from '../composables/useGame'

// jsdom has no 2D canvas; returning null keeps the confetti guard quiet
// and lets the export code path report a clean "unavailable" instead of logging.
HTMLCanvasElement.prototype.getContext = (() => null) as unknown as HTMLCanvasElement['getContext']

beforeEach(() => {
  localStorage.clear()
  resetGameStore()
})
