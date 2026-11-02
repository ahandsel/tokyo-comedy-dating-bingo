import { Check, Heart, Star, X } from '@lucide/vue'
import { mount } from '@vue/test-utils'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { createAppI18n } from '../i18n'
import { getQuestionText } from '../data/questions'
import { drawBoardImage, EXPORT_ICON_PATHS, shareOrDownload, tokenize, wrapText, type ExportOptions } from '../utils/exportImage'
import { generateBoard } from '../utils/board'
import { evaluateBoard } from '../utils/bingo'
import { QUESTION_IDS } from '../data/questions'
import { seededRandom } from '../utils/shuffle'
import { SAMPLE_DECK, allAnswers } from './helpers'

const measure = (s: string) => s.length * 10

describe('text wrapping', () => {
  it('tokenizes English by words and Japanese by characters', () => {
    expect(tokenize('Paid for')).toEqual(['Paid', ' ', 'for'])
    expect(tokenize('東京で')).toEqual(['東', '京', 'で'])
    expect(tokenize('Experienced 告白')).toEqual(['Experienced', ' ', '告', '白'])
  })

  it('wraps English at word boundaries', () => {
    expect(wrapText('Paid for the whole date', 100, measure)).toEqual(['Paid for', 'the whole', 'date'])
  })

  it('wraps Japanese at any character', () => {
    expect(wrapText('デート代を全額払った', 50, measure)).toEqual(['デート代を', '全額払った'])
  })

  it('keeps Japanese kinsoku characters off the wrong end of a line', () => {
    expect(tokenize('「ハチ公前集合」と')).toEqual(['「ハ', 'チ', '公', '前', '集', '合」', 'と'])
    expect(tokenize('デート')).toEqual(['デー', 'ト'])
    expect(wrapText('「ハチ公前集合」と言われた', 60, measure)).toEqual(['「ハチ公前集', '合」と言われ', 'た'])
    const lines = QUESTION_IDS.flatMap((id) => wrapText(getQuestionText(id, 'ja'), 50, measure))
    expect(lines.filter((line) => /^[、。」ーっゃゅょ]/.test(line) || /「$/.test(line))).toEqual([])
  })

  it('splits words longer than the line', () => {
    expect(wrapText('Supercalifragilistic', 50, measure)).toEqual(['Super', 'calif', 'ragil', 'istic'])
  })

  it('splits a word longer than the line when it follows another word', () => {
    expect(wrapText('a Supercalifragilistic', 50, measure)).toEqual(['a', 'Super', 'calif', 'ragil', 'istic'])
  })
})

/** jsdom has no Path2D, so this stand-in only remembers the path data it was given. */
class FakePath2D {
  d: string
  constructor(d: string) {
    this.d = d
  }
}

function fakeContext() {
  const calls: { text: string; font: string }[] = []
  /** The path data of every icon path stroked, with the color it was stroked in. */
  const icons: { d: string; color: string }[] = []
  const canvas = { width: 0, height: 0 }
  const ctx = {
    canvas,
    font: '',
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    lineCap: 'butt',
    lineJoin: 'miter',
    textAlign: 'center',
    textBaseline: 'middle',
    createLinearGradient: () => ({ addColorStop: () => undefined }),
    fillRect: () => undefined,
    beginPath: () => undefined,
    moveTo: () => undefined,
    arcTo: () => undefined,
    closePath: () => undefined,
    save: () => undefined,
    restore: () => undefined,
    translate: () => undefined,
    scale: () => undefined,
    fill: () => undefined,
    stroke: (path?: FakePath2D) => {
      if (path) icons.push({ d: path.d, color: ctx.strokeStyle })
    },
    measureText: (s: string) => ({ width: s.length * 8 }),
    fillText: (text: string) => {
      calls.push({ text, font: ctx.font })
    },
  }
  return { ctx: ctx as unknown as CanvasRenderingContext2D, calls, icons, canvas }
}

beforeAll(() => {
  vi.stubGlobal('Path2D', FakePath2D)
})

afterAll(() => {
  vi.unstubAllGlobals()
})

function optionsFor(locale: 'en' | 'ja'): ExportOptions {
  const i18n = createAppI18n(locale)
  const t = i18n.global.t
  const board = generateBoard(SAMPLE_DECK, seededRandom(21))
  const answers = allAnswers('yes')
  const result = evaluateBoard(board, answers)
  return {
    board,
    answers,
    result,
    stats: { yes: 24, no: 0, winningLines: result.totalWinningLines },
    labels: {
      brand: t('app.brand'),
      bingoWord: t('app.bingo'),
      heading: t('results.bingoTitle'),
      subtitle: t('results.bingoSubtitle'),
      yesCount: t('results.yesCount'),
      noCount: t('results.noCount'),
      lineCount: t('results.lineCount'),
      freeSpace: t('results.freeSpace'),
      yesMark: t('results.markedYes'),
      noMark: t('results.markedNo'),
      footer: t('results.exportFooter', { url: 'https://example.test/' }),
    },
    getText: (id) => getQuestionText(id, locale),
    width: 1080,
  }
}

describe('drawBoardImage', () => {
  it('draws all 25 cells with English labels', () => {
    const { ctx, calls, canvas } = fakeContext()
    drawBoardImage(ctx, optionsFor('en'))
    const drawn = calls.map((c) => c.text).join('\n')
    expect(canvas.width).toBe(1080)
    expect(canvas.height).toBeGreaterThan(1080)
    expect(drawn).toContain('Tokyo Comedy Dating')
    expect(drawn).toContain('BINGO!')
    expect(drawn).toContain('FREE SPACE')
    expect(drawn).toContain('Yes answers')
    for (const id of SAMPLE_DECK) {
      const firstWord = getQuestionText(id, 'en').split(' ')[0]!
      expect(drawn, id).toContain(firstWord)
    }
  })

  it('draws Japanese labels when the locale is Japanese', () => {
    const { ctx, calls } = fakeContext()
    drawBoardImage(ctx, optionsFor('ja'))
    const drawn = calls.map((c) => c.text).join('')
    expect(drawn).toContain('フリー')
    expect(drawn).toContain('「はい」の数')
    expect(drawn).toContain('ビンゴ！')
    expect(drawn).toContain('外国人フェチ')
    expect(drawn).not.toContain('FREE SPACE')
    expect(calls.every((c) => c.font.includes('Noto Sans JP') || c.font.includes('Pacifico'))).toBe(true)
  })

  it('draws the board and stat marks as Lucide icons, not text glyphs', () => {
    const { ctx, calls, icons } = fakeContext()
    const options = optionsFor('en')
    options.answers[options.board.find((cell) => cell !== 'free')!] = 'no'
    options.result = evaluateBoard(options.board, options.answers)
    drawBoardImage(ctx, options)
    const count = (d: string) => icons.filter((icon) => icon.d === d).length

    // 23 Yes squares plus the Yes stat; 1 No square plus the No stat (an X has two paths).
    expect(count(EXPORT_ICON_PATHS.check[0])).toBe(24)
    expect(count(EXPORT_ICON_PATHS.x[0])).toBe(2)
    expect(count(EXPORT_ICON_PATHS.x[1])).toBe(2)
    expect(count(EXPORT_ICON_PATHS.heart[0])).toBe(1)
    const stars = icons.filter((icon) => icon.d === EXPORT_ICON_PATHS.star[0])
    expect(stars.filter((star) => star.color === '#F2B544')).toHaveLength(options.result.winningCellIndices.length)
    expect(stars.filter((star) => star.color === '#C98A12')).toHaveLength(1)
    expect(calls.map((c) => c.text).join('')).not.toMatch(/[✓✕❤★]/)
  })

  it('keeps the copied icon paths identical to the ones @lucide/vue renders', () => {
    const components = { check: Check, x: X, heart: Heart, star: Star }
    for (const [name, component] of Object.entries(components)) {
      const rendered = mount(component).findAll('path').map((path) => path.attributes('d'))
      expect(rendered, name).toEqual(EXPORT_ICON_PATHS[name as keyof typeof EXPORT_ICON_PATHS])
    }
  })
})

describe('shareOrDownload', () => {
  it('falls back to download when the Web Share API is unavailable', async () => {
    const clicks: string[] = []
    const origCreate = URL.createObjectURL
    const origRevoke = URL.revokeObjectURL
    URL.createObjectURL = () => 'blob:fake'
    URL.revokeObjectURL = () => undefined
    const origClick = HTMLAnchorElement.prototype.click
    HTMLAnchorElement.prototype.click = function () {
      clicks.push(this.download)
    }
    try {
      const outcome = await shareOrDownload(new Blob(['x']), 'card.png', { title: 't', text: 'x' }, {} as Navigator)
      expect(outcome).toBe('downloaded')
      expect(clicks).toEqual(['card.png'])
    } finally {
      URL.createObjectURL = origCreate
      URL.revokeObjectURL = origRevoke
      HTMLAnchorElement.prototype.click = origClick
    }
  })

  it('uses navigator.share when files are supported', async () => {
    const share = vi.fn(async () => undefined)
    const nav = { share, canShare: () => true } as unknown as Navigator
    const outcome = await shareOrDownload(new Blob(['x']), 'card.png', { title: 't', text: 'x' }, nav)
    expect(outcome).toBe('shared')
    expect(share).toHaveBeenCalledOnce()
  })
})
