import type { EngineInterface, Register } from 'claude-code'

// The prompt cache lives an hour from the last request that used it.
const CACHE_TTL_MS = 60 * 60 * 1000

let showStatus = true
let lastAt: number | undefined
let ticker: { cancel: () => void } | undefined

const formatLeft = (ms: number) => {
  if (ms <= 0) return '⏱︎ cold'
  const secs = Math.ceil(ms / 1000)
  return `⏱︎ ${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`
}

const stop = () => {
  ticker?.cancel()
  ticker = undefined
}

const tick = async ($: EngineInterface) => {
  if (lastAt === undefined) return
  const left = lastAt + CACHE_TTL_MS - (await $.clock.now())
  $.ui.status(formatLeft(left))
  if (left <= 0) stop()
}

const start = async ($: EngineInterface) => {
  if (!showStatus) return
  await tick($)
  ticker ??= $.clock.every(1000, () => void tick($))
}

const stampPath = async ($: EngineInterface) => {
  const [home, session] = await Promise.all([$.env.get('HOME'), $.session.id()])
  return home ? `${home}/.claude/state/cache-clock/${session}` : undefined
}

// Every main-thread request refreshes the prompt cache's TTL. Count down to
// its expiry in the mod's status line, and stamp the send time in
// ~/.claude/state/cache-clock/<session> for a status line script to read.
export const register: Register = (on, options) => {
  showStatus = options.showStatus !== false
  lastAt = undefined
  stop()

  // A reload or a resumed session picks the clock up from the stamp.
  on('session.start', async ($, e, next) => {
    const path = await stampPath($)
    if (path) {
      const ms = Number(await $.fs.read(path).catch(() => ''))
      if (Number.isFinite(ms) && ms > 0) {
        lastAt = ms
        await start($)
      }
    }
    return next(e)
  })

  on('turn.step', async function* ($, e, next) {
    if (e.agentId === undefined) {
      lastAt = await $.clock.now()
      await start($)
      const path = await stampPath($)
      if (path) $.fs.write(path, String(lastAt)).catch(() => {})
    }
    return yield* next(e)
  })

  on('session.end', async ($, e, next) => {
    stop()
    lastAt = undefined
    $.ui.status(undefined)
    return next(e)
  })
}
