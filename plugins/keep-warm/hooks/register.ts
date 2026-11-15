import type { EngineInterface, Register } from 'claude-code'

// Five minutes under the 1-hour cache TTL, so a ping lands before it lapses.
const PING_AFTER_MS = 55 * 60 * 1000
// Idle pings in a row before it gives up; real activity resets the count.
const DEFAULT_MAX_PINGS = 6

const enabledRef = { plugin: 'keep-warm', key: 'enabled' } as const
const maxPingsRef = { plugin: 'keep-warm', key: 'maxPings' } as const

let timer: { cancel: () => void } | undefined
let nextAt: number | undefined
let pings = 0

const clock = (ms: number) =>
  new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

const disarm = ($: EngineInterface) => {
  timer?.cancel()
  timer = undefined
  nextAt = undefined
  $.ui.status(undefined)
}

const arm = async ($: EngineInterface) => {
  timer?.cancel()
  nextAt = (await $.clock.now()) + PING_AFTER_MS
  $.ui.status(`ping ${clock(nextAt)}`)
  timer = $.clock.after(PING_AFTER_MS, () => void ping($))
}

const ping = async ($: EngineInterface) => {
  timer = undefined
  const { value: max = DEFAULT_MAX_PINGS } = await $.state.get(maxPingsRef)
  if (pings >= max) {
    disarm($)
    $.ui.toast(`idle for ${max} pings, stopped pinging`)
    return
  }
  const r = await $.model.fork({ prompt: 'Cache keep-alive ping. Reply with only: ok' })
  if (!r.isAnswered) {
    if (r.reason === 'nothing-to-fork') {
      // No conversation yet (or just /cleared): wait for the next real request.
      disarm($)
      return
    }
    $.ui.log(`ping failed (${r.reason})`, { to: 'debug' })
  } else {
    $.ui.log(
      `ping read ${r.usage.cache_read_input_tokens} cached tokens, wrote ${r.usage.cache_creation_input_tokens}`,
      { to: 'debug' },
    )
  }
  pings++
  await arm($)
}

const isEnabled = async ($: EngineInterface) => {
  const { value = false } = await $.state.get(enabledRef)
  return value
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'keep-warm',
      description: 'Keep the 1h prompt cache warm while idle: on [max pings] | off | status',
      argumentHint: 'on [max pings] | off | status',
    })
    // A reload cancels timers; pick up where the session left off.
    if (await isEnabled($)) await arm($)

    return next(e)
  })

  on('command.run', { command: 'keep-warm' }, async ($, e) => {
    const [word = '', count] = e.args.trim().split(/\s+/)
    const enabled = await isEnabled($)
    const mode = word === '' ? (enabled ? 'off' : 'on') : word.toLowerCase()

    if (mode === 'on') {
      const max = count === undefined ? DEFAULT_MAX_PINGS : Number(count)
      if (!Number.isInteger(max) || max < 1) {
        return { text: `max pings must be a whole number of at least 1, not "${count}"` }
      }
      await $.state.set(enabledRef, true)
      await $.state.set(maxPingsRef, max)
      pings = 0
      await arm($)
      return {
        text: `on, pings the cache ${PING_AFTER_MS / 60000} min after the last request (next ${clock(nextAt!)}), up to ${max} idle pings in a row.`,
      }
    }
    if (mode === 'off') {
      await $.state.set(enabledRef, false)
      disarm($)
      return { text: 'off' }
    }
    if (mode === 'status') {
      const { value: max = DEFAULT_MAX_PINGS } = await $.state.get(maxPingsRef)
      return {
        text: enabled
          ? `on, ${nextAt ? `next ping ${clock(nextAt)}` : 'waiting for the first request'}, ${pings}/${max} idle pings used.`
          : 'off',
      }
    }
    return { text: 'Usage: /keep-warm [on [max pings] | off | status]  (no argument toggles)' }
  })

  // Every main-thread model request refreshes the cache, so restart the clock.
  on('turn.step', async function* ($, e, next) {
    if (e.agentId === undefined && (await isEnabled($))) {
      pings = 0
      await arm($)
    }
    return yield* next(e)
  })

  on('session.end', async ($, e, next) => {
    disarm($)
    return next(e)
  })
}
