import { FREE, type Answers, type BingoResult, type BoardCellId, type GameStats } from '../types/game'
import { isCellMarked } from './bingo'
import { BOARD_SIZE, CELL_COUNT } from './board'

/** All user-facing strings for the export, already localized by the caller. */
export interface ExportLabels {
  brand: string
  bingoWord: string
  heading: string
  subtitle: string
  yesCount: string
  noCount: string
  lineCount: string
  freeSpace: string
  yesMark: string
  noMark: string
  footer: string
}

export interface ExportOptions {
  board: readonly BoardCellId[]
  answers: Answers
  result: BingoResult
  stats: GameStats
  labels: ExportLabels
  /** Localized label for a question ID. */
  getText: (id: string) => string
  /** Canvas width in pixels; height is derived. Default 1080. */
  width?: number
  /** BCP 47 tag used for the canvas `lang` so CJK glyph selection is correct. */
  lang?: string
}

export const EXPORT_FONT_STACK =
  '"Noto Sans JP", "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic", "Meiryo", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
export const EXPORT_SCRIPT_STACK = '"Pacifico", "Brush Script MT", "Segoe Script", cursive'

const COLORS = {
  blush: '#FCE4EC',
  rose: '#E97CA6',
  berry: '#A83F70',
  cream: '#FFF8F4',
  ink: '#261A21',
  inkSoft: '#5B4650',
  muted: '#EFE3E7',
  mutedText: '#8C7680',
  gold: '#F2B544',
  goldDeep: '#C98A12',
  white: '#FFFFFF',
}

/**
 * Lucide icon shapes (ISC license), copied from @lucide/vue because src/utils/ must not import Vue.
 * Each entry lists the SVG paths of one icon on Lucide's 24 by 24 grid.
 * Keep them in sync with the icons that BingoCell.vue and ResultSummary.vue render.
 */
export const EXPORT_ICON_PATHS = {
  check: ['M20 6 9 17l-5-5'],
  x: ['M18 6 6 18', 'm6 6 12 12'],
  heart: [
    'M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5',
  ],
  star: [
    'M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z',
  ],
} as const

type ExportIcon = keyof typeof EXPORT_ICON_PATHS

interface IconStyle {
  /** Stroke width on Lucide's 24-unit grid. */
  strokeWidth: number
  fill: boolean
}

/** The heavy check and cross of the board squares (`.cell__mark` in BingoCell.vue). */
const MARK_STYLE: IconStyle = { strokeWidth: 3, fill: false }
/** The filled heart of the free square and the filled winning star. */
const FILLED_STYLE: IconStyle = { strokeWidth: 2, fill: true }

/** Draw a Lucide icon of the given size, centered on (cx, cy). */
function drawIcon(ctx: CanvasRenderingContext2D, icon: ExportIcon, cx: number, cy: number, size: number, color: string, style: IconStyle) {
  ctx.save()
  ctx.translate(cx - size / 2, cy - size / 2)
  ctx.scale(size / 24, size / 24)
  ctx.lineWidth = style.strokeWidth
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = color
  ctx.fillStyle = color
  for (const d of EXPORT_ICON_PATHS[icon]) {
    const path = new Path2D(d)
    if (style.fill) ctx.fill(path)
    ctx.stroke(path)
  }
  ctx.restore()
}

/**
 * Draw an icon followed by text, centered as one group on (cx, cy).
 * The text uses the current font and fill style of the context.
 */
function drawIconText(
  ctx: CanvasRenderingContext2D,
  icon: ExportIcon,
  text: string,
  cx: number,
  cy: number,
  iconSize: number,
  iconColor: string,
  style: IconStyle,
) {
  const gap = iconSize * 0.25
  const left = cx - (iconSize + gap + ctx.measureText(text).width) / 2
  drawIcon(ctx, icon, left + iconSize / 2, cy, iconSize, iconColor, style)
  ctx.textAlign = 'left'
  ctx.fillText(text, left + iconSize + gap, cy)
  ctx.textAlign = 'center'
}

const CJK = /[⺀-⿟　-ヿ㐀-䶿一-鿿豈-﫿＀-￯]/

/** Japanese kinsoku: characters that must not start a line (closing marks, small kana, the long vowel mark). */
const NO_LINE_START = /[、。，．・：；？！ー」』）】〕〉》ぁぃぅぇぉっゃゅょゎァィゥェォッャュョヮヵヶ]/
/** Japanese kinsoku: characters that must not end a line (opening brackets). */
const NO_LINE_END = /[「『（【〔〈《]/

/**
 * Split text into tokens that may be placed on a line. CJK characters break
 * anywhere, except that kinsoku characters stay glued to their neighbor, so a
 * line never starts with "」" or "ー" and never ends with "「".
 */
export function tokenize(text: string): string[] {
  return applyKinsoku(splitTokens(text))
}

function applyKinsoku(tokens: string[]): string[] {
  const out: string[] = []
  let opening = ''
  for (const token of tokens) {
    const previous = out[out.length - 1]
    if (!opening && previous && previous !== ' ' && NO_LINE_START.test(token.charAt(0))) {
      out[out.length - 1] = previous + token
      continue
    }
    const merged = opening + token
    opening = ''
    if (NO_LINE_END.test(merged.charAt(merged.length - 1))) opening = merged
    else out.push(merged)
  }
  if (opening) out.push(opening)
  return out
}

function splitTokens(text: string): string[] {
  const tokens: string[] = []
  let word = ''
  for (const ch of text) {
    if (ch === ' ') {
      if (word) tokens.push(word)
      word = ''
      tokens.push(' ')
    } else if (CJK.test(ch)) {
      if (word) tokens.push(word)
      word = ''
      tokens.push(ch)
    } else {
      word += ch
    }
  }
  if (word) tokens.push(word)
  return tokens
}

/**
 * Greedy word/character wrapping. `measure` returns the pixel width of a string.
 * Works for English (word breaks) and Japanese (character breaks).
 * A word wider than the line is split by character wherever it falls.
 */
export function wrapText(text: string, maxWidth: number, measure: (s: string) => number): string[] {
  const lines: string[] = []
  let line = ''
  const push = () => {
    const trimmed = line.trim()
    if (trimmed) lines.push(trimmed)
    line = ''
  }
  for (const token of tokenize(text)) {
    if (token === ' ') {
      line += ' '
      continue
    }
    if (measure(line + token) > maxWidth && line.trim() !== '') push()
    if (measure(token) > maxWidth) {
      for (const ch of token) {
        if (measure(line + ch) > maxWidth && line.trim() !== '') push()
        line += ch
      }
    } else {
      line += token
    }
  }
  push()
  return lines
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** Background color of one board square: berry for the free square, rose for Yes, and muted for No. */
function cellFill(isFree: boolean, marked: boolean): string {
  if (isFree) return COLORS.berry
  return marked ? COLORS.rose : COLORS.muted
}

function fitLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
  startSize: number,
  minSize: number,
  weight: string,
): { lines: string[]; size: number } {
  let size = startSize
  while (size >= minSize) {
    ctx.font = `${weight} ${size}px ${EXPORT_FONT_STACK}`
    const lines = wrapText(text, maxWidth, (s) => ctx.measureText(s).width)
    if (lines.length <= maxLines) return { lines, size }
    size -= 2
  }
  ctx.font = `${weight} ${minSize}px ${EXPORT_FONT_STACK}`
  const lines = wrapText(text, maxWidth, (s) => ctx.measureText(s).width).slice(0, maxLines)
  const last = lines[maxLines - 1]
  if (last && lines.length === maxLines) lines[maxLines - 1] = `${last.slice(0, Math.max(0, last.length - 1))}…`
  return { lines, size: minSize }
}

async function ensureFontsLoaded(): Promise<void> {
  if (typeof document === 'undefined' || !('fonts' in document)) return
  try {
    await Promise.all([
      document.fonts.load(`700 40px ${EXPORT_FONT_STACK}`, '東京BINGO'),
      document.fonts.load(`900 40px ${EXPORT_FONT_STACK}`, 'BINGO'),
      document.fonts.load(`400 40px ${EXPORT_SCRIPT_STACK}`, 'Tokyo'),
      document.fonts.ready,
    ])
  } catch {
    /* fall back to whatever fonts are available */
  }
}

/** Draw the full card onto a 2D context. Exported for direct use with any canvas. */
export function drawBoardImage(ctx: CanvasRenderingContext2D, options: ExportOptions): void {
  const W = options.width ?? 1080
  const pad = Math.round(W * 0.055)
  const boardSize = W - pad * 2
  const gap = Math.round(W * 0.012)
  const cellSize = (boardSize - gap * (BOARD_SIZE - 1)) / BOARD_SIZE
  const headerH = Math.round(W * 0.375)
  const statsH = Math.round(W * 0.2)
  const footerH = Math.round(W * 0.07)
  const H = headerH + boardSize + statsH + footerH + pad
  const { labels } = options

  ctx.canvas.width = W
  ctx.canvas.height = H

  // Background
  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, COLORS.blush)
  bg.addColorStop(1, '#F8C8D8')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = COLORS.berry

  // Brand (script font) and BINGO word, set close together as one logo
  ctx.font = `400 ${Math.round(W * 0.06)}px ${EXPORT_SCRIPT_STACK}`
  ctx.fillText(labels.brand, W / 2, pad + W * 0.042)
  ctx.fillStyle = COLORS.rose
  ctx.font = `900 ${Math.round(W * 0.085)}px ${EXPORT_FONT_STACK}`
  ctx.fillText(labels.bingoWord, W / 2, pad + W * 0.128)

  // Heading and subtitle, with a wider gap above them than between them
  ctx.fillStyle = COLORS.berry
  ctx.font = `900 ${Math.round(W * 0.042)}px ${EXPORT_FONT_STACK}`
  ctx.fillText(labels.heading, W / 2, pad + W * 0.212)
  ctx.fillStyle = COLORS.inkSoft
  const sub = fitLines(ctx, labels.subtitle, W - pad * 2, 1, Math.round(W * 0.028), Math.round(W * 0.02), '700')
  ctx.font = `700 ${sub.size}px ${EXPORT_FONT_STACK}`
  ctx.fillText(sub.lines[0] ?? '', W / 2, pad + W * 0.265)

  // Board panel
  const boardTop = headerH
  roundRect(ctx, pad - gap, boardTop - gap, boardSize + gap * 2, boardSize + gap * 2, Math.round(W * 0.025))
  ctx.fillStyle = COLORS.white
  ctx.fill()

  const winning = new Set(options.result.winningCellIndices)
  for (let i = 0; i < CELL_COUNT; i++) {
    const cell = options.board[i]
    if (cell === undefined) continue
    const row = Math.floor(i / BOARD_SIZE)
    const col = i % BOARD_SIZE
    const x = pad + col * (cellSize + gap)
    const y = boardTop + row * (cellSize + gap)
    const isFree = cell === FREE
    const marked = isCellMarked(cell, options.answers)

    roundRect(ctx, x, y, cellSize, cellSize, Math.round(cellSize * 0.1))
    ctx.fillStyle = cellFill(isFree, marked)
    ctx.fill()
    if (winning.has(i)) {
      ctx.lineWidth = Math.max(4, cellSize * 0.04)
      ctx.strokeStyle = COLORS.goldDeep
      ctx.stroke()
      ctx.lineWidth = Math.max(2, cellSize * 0.02)
      ctx.strokeStyle = COLORS.gold
      ctx.stroke()
    }

    const textColor = marked ? COLORS.white : COLORS.inkSoft
    ctx.fillStyle = textColor

    // Mark line: the same icon as BingoCell.vue, plus the localized Yes or No
    const markSize = Math.round(cellSize * 0.13)
    const markIconSize = markSize * 1.15
    const markX = x + cellSize / 2
    const markY = y + cellSize * 0.16
    ctx.font = `900 ${markSize}px ${EXPORT_FONT_STACK}`
    if (isFree) drawIcon(ctx, 'heart', markX, markY, markIconSize, textColor, FILLED_STYLE)
    else if (marked) drawIconText(ctx, 'check', labels.yesMark, markX, markY, markIconSize, textColor, MARK_STYLE)
    else drawIconText(ctx, 'x', labels.noMark, markX, markY, markIconSize, textColor, MARK_STYLE)

    // Label
    const text = isFree ? labels.freeSpace : options.getText(cell)
    const inner = cellSize * 0.88
    const fitted = fitLines(ctx, text, inner, 4, Math.round(cellSize * 0.12), Math.round(cellSize * 0.085), '700')
    ctx.font = `700 ${fitted.size}px ${EXPORT_FONT_STACK}`
    const lineHeight = fitted.size * 1.2
    const blockTop = y + cellSize * 0.3
    const blockH = fitted.lines.length * lineHeight
    const startY = blockTop + (cellSize * 0.66 - blockH) / 2 + lineHeight / 2
    fitted.lines.forEach((line, li) => {
      ctx.fillText(line, x + cellSize / 2, startY + li * lineHeight)
    })

    if (winning.has(i)) {
      drawIcon(ctx, 'star', x + cellSize * 0.88, y + cellSize * 0.1, cellSize * 0.12, COLORS.gold, FILLED_STYLE)
    }
  }

  // Stats, with the same icons and icon colors as ResultSummary.vue
  const statsTop = boardTop + boardSize + gap * 2
  const statW = (W - pad * 2 - gap * 2) / 3
  const statItems: { label: string; value: number; icon: ExportIcon; color: string; style: IconStyle }[] = [
    { label: labels.yesCount, value: options.stats.yes, icon: 'check', color: COLORS.berry, style: MARK_STYLE },
    { label: labels.noCount, value: options.stats.no, icon: 'x', color: COLORS.berry, style: MARK_STYLE },
    { label: labels.lineCount, value: options.stats.winningLines, icon: 'star', color: COLORS.goldDeep, style: FILLED_STYLE },
  ]
  statItems.forEach(({ label, value, icon, color, style }, i) => {
    const x = pad + i * (statW + gap)
    roundRect(ctx, x, statsTop + gap, statW, statsH - gap * 2, Math.round(W * 0.02))
    ctx.fillStyle = 'rgba(255,255,255,0.8)'
    ctx.fill()
    ctx.fillStyle = COLORS.berry
    ctx.font = `900 ${Math.round(W * 0.06)}px ${EXPORT_FONT_STACK}`
    drawIconText(ctx, icon, String(value), x + statW / 2, statsTop + statsH * 0.42, W * 0.045, color, style)
    ctx.fillStyle = COLORS.inkSoft
    const lab = fitLines(ctx, label, statW - gap * 2, 2, Math.round(W * 0.022), Math.round(W * 0.016), '700')
    ctx.font = `700 ${lab.size}px ${EXPORT_FONT_STACK}`
    lab.lines.forEach((line, li) => {
      ctx.fillText(line, x + statW / 2, statsTop + statsH * 0.68 + li * lab.size * 1.2)
    })
  })

  // Footer
  ctx.fillStyle = COLORS.mutedText
  ctx.font = `700 ${Math.round(W * 0.022)}px ${EXPORT_FONT_STACK}`
  ctx.fillText(labels.footer, W / 2, H - pad / 2 - footerH / 2)
}

/** Render the board to a PNG Blob in the browser. */
export async function renderBoardImage(options: ExportOptions): Promise<Blob> {
  await ensureFontsLoaded()
  const canvas = document.createElement('canvas')
  canvas.lang = options.lang ?? 'en'
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context is unavailable')
  drawBoardImage(ctx, options)
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('toBlob returned null'))), 'image/png')
  })
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function canShareFiles(nav: Navigator = navigator): boolean {
  return typeof nav.share === 'function' && typeof nav.canShare === 'function'
}

/**
 * True on an iPhone or iPad, where a download lands in the Files app instead of Photos.
 * iPadOS reports a Mac user agent, so a Mac with a touch screen counts as an iPad.
 */
export function isAppleMobile(nav: Navigator = navigator): boolean {
  const userAgent = nav.userAgent ?? ''
  if (/iPhone|iPad|iPod/.test(userAgent)) return true
  return /Macintosh/.test(userAgent) && (nav.maxTouchPoints ?? 0) > 1
}

/**
 * Open the share sheet when it accepts this data.
 * Returns null when sharing is unsupported or fails for any reason other than the user dismissing the sheet.
 */
async function tryShare(data: ShareData, nav: Navigator): Promise<'shared' | 'cancelled' | null> {
  if (!canShareFiles(nav) || !nav.canShare(data)) return null
  try {
    await nav.share(data)
    return 'shared'
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled'
    return null
  }
}

function pngFile(blob: Blob, filename: string): File {
  return new File([blob], filename, { type: 'image/png' })
}

/**
 * Share via the Web Share API when files are supported; otherwise download.
 * Returns which path was taken, or "cancelled" if the user dismissed the share sheet.
 */
export async function shareOrDownload(
  blob: Blob,
  filename: string,
  payload: { title: string; text: string },
  nav: Navigator = navigator,
): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const outcome = await tryShare({ files: [pngFile(blob, filename)], title: payload.title, text: payload.text }, nav)
  if (outcome) return outcome
  downloadBlob(blob, filename)
  return 'downloaded'
}

/**
 * Save the image where the player keeps photos.
 * On an iPhone or iPad, open the share sheet with only the image, because its first action, "Save Image", adds it to Photos.
 * Sharing text along with the image can hide that action, so no title or text is sent.
 * Everywhere else, and when the share sheet is unavailable, download the file.
 */
export async function saveImage(
  blob: Blob,
  filename: string,
  nav: Navigator = navigator,
): Promise<'shared' | 'downloaded' | 'cancelled'> {
  if (isAppleMobile(nav)) {
    const outcome = await tryShare({ files: [pngFile(blob, filename)] }, nav)
    if (outcome) return outcome
  }
  downloadBlob(blob, filename)
  return 'downloaded'
}
