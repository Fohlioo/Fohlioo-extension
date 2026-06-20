import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, test } from 'vitest'

import { FASHION_CONTENT_SCRIPT_MATCHES } from '../sites/content-script-matches'

function extractCaptureMatches (): string[] {
  const src = readFileSync(
    resolve(__dirname, '../../contents/capture.ts'),
    'utf8'
  )
  const block = src.match(/matches:\s*\[([\s\S]*?)\],/)?.[1] ?? ''
  return [...block.matchAll(/'([^']+)'/g)].map((match) => match[1])
}

describe('content script matches', () => {
  test('capture.ts literal matches stay in sync with content-script-matches.ts', () => {
    expect(extractCaptureMatches()).toEqual([
      ...FASHION_CONTENT_SCRIPT_MATCHES,
    ])
  })
})
