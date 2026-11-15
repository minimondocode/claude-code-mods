import { expect, mock, test } from 'claude-code/testing'

const MIN = 60 * 1000
const usage = {
  input_tokens: 10,
  output_tokens: 1,
  cache_read_input_tokens: 50000,
  cache_creation_input_tokens: 0,
}

test('pings 55 minutes after the last request, and a request resets the clock', async ($, on) => {
  const clock = mock.clock(on)
  let forks = 0
  on('command.register', () => ({ value: { command: 'keep-warm' } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('model.fork', () => {
    forks++
    return { value: { isAnswered: true, text: 'ok', usage } }
  })
  on('ui.status', () => ({ value: undefined }))
  on('ui.toast', () => ({ value: undefined }))
  on('ui.log', () => ({ value: undefined }))
  on('turn.step', async function* (_, e) {
    return { turnId: e.turnId, index: e.index, answer: '', toolUses: [] }
  })

  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  const reply = await $.command.run({ command: 'keep-warm', args: 'on 2' })
  expect(reply.text).toMatch(/^on, /)

  await clock.advance(30 * MIN)
  for await (const _ of $.turn.step({ turnId: 't', index: 0, model: 'opus', messageCount: 3 })) void _
  await clock.advance(30 * MIN)
  expect(forks).toBe(0)
  await clock.advance(26 * MIN)
  expect(forks).toBe(1)

  // Capped at 2 idle pings in a row.
  await clock.advance(55 * MIN)
  await clock.advance(55 * MIN)
  expect(forks).toBe(2)

  expect((await $.command.run({ command: 'keep-warm', args: 'off' })).text).toBe('off')
})
