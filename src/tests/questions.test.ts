import { describe, expect, it } from 'vitest'
import { QUESTION_COUNT, QUESTION_IDS, getQuestionText, isQuestionId, questions } from '../data/questions'

describe('question dataset', () => {
  it('has exactly 24 questions', () => {
    expect(questions).toHaveLength(24)
    expect(QUESTION_COUNT).toBe(24)
  })

  it('has unique, stable IDs', () => {
    expect(new Set(QUESTION_IDS).size).toBe(24)
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
    expect(en).toContain('Unplanned visit to a military base')
  })

  it('keeps 告白 in the English label of q17 and renders it in Japanese', () => {
    expect(getQuestionText('q17', 'en')).toBe('Experienced 告白')
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
