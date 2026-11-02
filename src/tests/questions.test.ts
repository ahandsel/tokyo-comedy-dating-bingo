import { describe, expect, it } from 'vitest'
import { QUESTION_COUNT, QUESTION_IDS, getQuestionText, isQuestionId, questions } from '../data/questions'
import { DECK_SIZE } from '../utils/board'

describe('question dataset', () => {
  it('has 29 questions, enough to deal a full 24-card board', () => {
    expect(questions).toHaveLength(29)
    expect(QUESTION_COUNT).toBe(29)
    expect(DECK_SIZE).toBe(24)
  })

  it('has unique, stable IDs', () => {
    expect(new Set(QUESTION_IDS).size).toBe(QUESTION_COUNT)
    expect(QUESTION_IDS.every((id) => /^q\d{2}$/.test(id))).toBe(true)
  })

  it('has non-empty English and Japanese text for every question', () => {
    for (const q of questions) {
      expect(q.text.en.trim().length, q.id).toBeGreaterThan(0)
      expect(q.text.ja.trim().length, q.id).toBeGreaterThan(0)
    }
  })

  it('contains the corrected English labels', () => {
    const en = questions.map((q) => q.text.en)
    expect(en).toContain('Unsolicited dick pic')
    expect(en).toContain('Visited a military base')
  })

  it('adds the fan-made cards in both languages', () => {
    expect(getQuestionText('q25', 'en')).toBe('Not Japanese enough')
    expect(getQuestionText('q25', 'ja')).toBe('日本人らしさが足りない')
    expect(getQuestionText('q26', 'en')).toBe('Not foreign enough')
    expect(getQuestionText('q26', 'ja')).toBe('外国人らしさが足りない')
    expect(getQuestionText('q27', 'en')).toBe('Date ended up being a language lesson')
    expect(getQuestionText('q27', 'ja')).toBe('デートが語学レッスンになった')
    expect(getQuestionText('q28', 'en')).toBe('Date night at Tokyo Comedy Bar')
    expect(getQuestionText('q28', 'ja')).toBe('Tokyo Comedy Barでデートした')
    expect(getQuestionText('q29', 'en')).toBe('My date took me to Yurié’s stand-up show')
    expect(getQuestionText('q29', 'ja')).toBe('デートでユリエ コリンズを観に行った')
  })

  it('keeps 告白 and its romaji in the English label of q17 and renders it in Japanese', () => {
    expect(getQuestionText('q17', 'en')).toBe('Experienced 告白 (kokuhaku)')
    expect(getQuestionText('q17', 'ja')).toContain('告白')
  })

  it('looks up text by locale and falls back safely', () => {
    expect(getQuestionText('q12', 'en')).toBe('Unsolicited dick pic')
    expect(getQuestionText('q12', 'ja')).toBe('頼んでもいない下半身の写真が届いた')
    expect(getQuestionText('nope', 'en')).toBe('nope')
    expect(isQuestionId('q01')).toBe(true)
    expect(isQuestionId('free')).toBe(false)
  })
})
