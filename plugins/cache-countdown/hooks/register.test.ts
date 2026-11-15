import { test, expect, mock } from 'claude-code/testing'

const MIN = 60 * 1000
const step = { turnId: 't', index: 0, model: 'm', messageCount: 1 }
const answered = { turnId: 't', index: 0, answer: '', toolUses: [], stopReason: 'end_turn', usage: null }

for (const [name, input, stamps] of [
  ['a main-thread step stamps the cache clock', step, 1],
  ['a subagent step leaves it alone', { ...step, agentId: 'a1' }, 0],
] as const) {
  test(name, async ($, on) => {
    mock.clock(on)
    const writes: { path: string; text: string }[] = []
    mock.env(on, { HOME: '/home/t' })
    on('session.id', () => ({ value: 'sess' }))
    on('ui.status', () => ({ value: undefined }))
    on('fs.write', ($, e) => { writes.push(e); return { value: undefined } })
    on('turn.step', async function* () { return answered as never })
    for await (const _ of $.turn.step(input)) {}
    expect(writes.length).toBe(stamps)
    if (stamps) {
      expect(writes[0]?.path).toBe('/home/t/.claude/state/cache-clock/sess')
      expect(Number(writes[0]?.text) >= 0).toBe(true)
    }
  })
}

test('the status line counts down from 60:00 and goes cold', async ($, on) => {
  const clock = mock.clock(on)
  const shown: (string | undefined)[] = []
  mock.env(on, { HOME: '/home/t' })
  on('session.id', () => ({ value: 'sess' }))
  on('fs.write', () => ({ value: undefined }))
  on('ui.status', ($, e) => { shown.push(e.text); return { value: undefined } })
  on('turn.step', async function* () { return answered as never })

  for await (const _ of $.turn.step(step)) {}
  expect(shown.at(-1)).toBe('⏱︎ 60:00')
  await clock.advance(5 * MIN + 30 * 1000)
  expect(shown.at(-1)).toBe('⏱︎ 54:30')
  await clock.advance(55 * MIN)
  expect(shown.at(-1)).toBe('⏱︎ cold')
})

test('showStatus off stamps the file but draws nothing', { options: { showStatus: false } }, async ($, on) => {
  mock.clock(on)
  const shown: (string | undefined)[] = []
  const writes: string[] = []
  mock.env(on, { HOME: '/home/t' })
  on('session.id', () => ({ value: 'sess' }))
  on('fs.write', ($, e) => { writes.push(e.path); return { value: undefined } })
  on('ui.status', ($, e) => { shown.push(e.text); return { value: undefined } })
  on('turn.step', async function* () { return answered as never })

  for await (const _ of $.turn.step(step)) {}
  expect(writes.length).toBe(1)
  expect(shown.length).toBe(0)
})
