import type { Locale, Question } from '../types/game'

/**
 * The approved question pool. Each game deals 24 of them at random, one per board square.
 * English labels are final.
 * IDs are stable and are the only thing stored as answer keys.
 * q01 to q24 come from Yurié Collins and her show Tokyo Hoe Tales.
 * They belong to her and are not covered by the MIT License; see "Credits" in the README.
 */
export const questions: Question[] = [
  { id: 'q01', text: { en: 'Knew as soon as the date started that it was a NO', ja: '会った瞬間「ナシ」と思った' } },
  { id: 'q02', text: { en: 'Paid for the whole date', ja: 'デート代を全額払った' } },
  { id: 'q03', text: { en: 'Foreigner fetish', ja: '外国人フェチ' } },
  { id: 'q04', text: { en: 'Matched with someone I know', ja: '知り合いとマッチングした' } },
  { id: 'q05', text: { en: 'Went to a love hotel', ja: 'ラブホテルに行った' } },
  { id: 'q06', text: { en: 'I was ghosted', ja: '急に連絡が来なくなった' } },
  { id: 'q07', text: { en: 'Had an affair', ja: '浮気をした' } },
  { id: 'q08', text: { en: 'Met at the club', ja: 'クラブで出会った' } },
  { id: 'q09', text: { en: 'Still lives with their ex', ja: '相手がまだ元恋人と住んでいた' } },
  { id: 'q10', text: { en: 'Have a type I know is bad for me', ja: 'ダメなタイプと分かっていても惹かれる' } },
  { id: 'q11', text: { en: 'Found out my date was married', ja: '相手が既婚者だと後で知った' } },
  { id: 'q12', text: { en: 'Unsolicited dick pic', ja: '頼んでもいない下半身の写真が届いた' } },
  { id: 'q13', text: { en: 'Visited a military base', ja: '軍の基地に行った' } },
  { id: 'q14', text: { en: 'Friends with benefits', ja: 'セフレ関係になった' } },
  { id: 'q15', text: { en: 'Stayed because the sex was good', ja: 'セックスが良かったから関係を続けた' } },
  { id: 'q16', text: { en: 'My date didn’t speak my language', ja: '相手と言葉が通じなかった' } },
  { id: 'q17', text: { en: 'Experienced 告白 (kokuhaku)', ja: '告白を経験した' } },
  { id: 'q18', text: { en: 'Open relationship', ja: '恋人公認でほかの人ともデートした' } },
  { id: 'q19', text: { en: '“meet me in front of Hachiko”', ja: '「ハチ公前集合」と言われた' } },
  { id: 'q20', text: { en: 'Bumble date', ja: 'Bumbleで知り合った人とデートした' } },
  { id: 'q21', text: { en: 'Kissed in public in Tokyo', ja: '東京の街なかでキスした' } },
  { id: 'q22', text: { en: 'I was un-matched mid convo', ja: '会話の途中でマッチを解除された' } },
  { id: 'q23', text: { en: 'Accidentally liked an ex’s photo', ja: '元恋人の写真にうっかり「いいね」した' } },
  { id: 'q24', text: { en: 'Japanese fetish', ja: '日本人フェチ' } },
  // Fan additions written for this game, not taken from Tokyo Hoe Tales.
  { id: 'q25', text: { en: 'Not Japanese enough', ja: '日本人らしさが足りない' } },
  { id: 'q26', text: { en: 'Not foreign enough', ja: '外国人らしさが足りない' } },
  { id: 'q27', text: { en: 'Date ended up being a language lesson', ja: 'デートが語学レッスンになった' } },
]

export const QUESTION_COUNT = questions.length

export const QUESTION_IDS: readonly string[] = questions.map((q) => q.id)

const byId = new Map(questions.map((q) => [q.id, q]))

export function getQuestion(id: string): Question | undefined {
  return byId.get(id)
}

/** Localized label for a question ID. Falls back to English, then to the ID. */
export function getQuestionText(id: string, locale: Locale): string {
  const q = byId.get(id)
  if (!q) return id
  return q.text[locale] || q.text.en || id
}

export function isQuestionId(value: unknown): value is string {
  return typeof value === 'string' && byId.has(value)
}
