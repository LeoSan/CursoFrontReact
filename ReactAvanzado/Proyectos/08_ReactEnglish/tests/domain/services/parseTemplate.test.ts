import { describe, it, expect } from 'vitest'
import { parseTemplate, type TemplatePart } from '@domain/services/parseTemplate'

const text = (value: string): TemplatePart => ({ kind: 'text', value })
const blank = (id: number): TemplatePart => ({ kind: 'blank', id })

describe('parseTemplate', () => {
  const cases: ReadonlyArray<readonly [string, string, readonly TemplatePart[]]> = [
    ['marker at the end', "It's half past {{1}}.", [text("It's half past "), blank(1), text('.')]],
    ['marker at the start', '{{1}} sheep', [blank(1), text(' sheep')]],
    [
      'marker between words',
      'TUESDAY, {{1}}, THURSDAY',
      [text('TUESDAY, '), blank(1), text(', THURSDAY')],
    ],
    [
      'two markers',
      'a {{1}} and {{2}} b',
      [text('a '), blank(1), text(' and '), blank(2), text(' b')],
    ],
    ['no markers', 'no markers', [text('no markers')]],
    ['adjacent markers', '{{1}}{{2}}', [blank(1), blank(2)]],
    ['repeated spaces preserved', '  a   {{1}}   b  ', [text('  a   '), blank(1), text('   b  ')]],
    ['multi-digit id', '{{12}}', [blank(12)]],
    ['markers in any order', '{{2}} then {{1}}', [blank(2), text(' then '), blank(1)]],
    ['repeated id', '{{1}} and {{1}}', [blank(1), text(' and '), blank(1)]],
  ]

  it.each(cases)('%s', (_name, template, expected) => {
    expect(parseTemplate(template)).toEqual(expected)
  })

  it('returns no parts for an empty template (never an empty text part)', () => {
    expect(parseTemplate('')).toEqual([])
  })

  it.each(['{{0}}', '{{01}}', '{{-1}}', '{{a}}', '{{}}', '{{ 1 }}', '{{1}', '{1}'])(
    'treats %s as plain text',
    (template) => {
      expect(parseTemplate(template)).toEqual([text(template)])
    }
  )

  it('never produces an empty text part', () => {
    const templates = ['{{1}}', '{{1}}{{2}}', 'a{{1}}', '{{1}}b', '{{1}}{{2}}{{3}}']
    for (const template of templates) {
      for (const part of parseTemplate(template)) {
        if (part.kind === 'text') expect(part.value).not.toBe('')
      }
    }
  })

  it('is stateless across calls (global regex lastIndex does not leak)', () => {
    expect(parseTemplate('a {{1}}')).toEqual(parseTemplate('a {{1}}'))
  })
})
