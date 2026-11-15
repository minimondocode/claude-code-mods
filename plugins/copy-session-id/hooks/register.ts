import type { Register } from 'claude-code'

// /sid copies the session ID without ever touching the conversation.
//
// It is caught at prompt.submit and answered without `next`, so nothing enters
// the session: no prompt row, no command row, no output the model reads. This
// also covers /sid typed mid-turn (which would otherwise be queued and folded
// into the running turn as a prompt) and /sid typed before the command is
// registered (which would otherwise be sent as plain text).
const isSid = (text: string) => /^\s*\/sid\s*$/.test(text)

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    // Registered only so /sid shows in the typeahead and /help.
    await $.command.register({
      name: 'sid',
      description: 'Copy this session ID to the clipboard',
      immediate: true,
    })
    return next(e)
  })

  on('prompt.submit', async ($, e, next) => {
    if (!isSid(e.text)) return next(e)
    const id = await $.session.id()
    const copied = await $.ui.copy({ text: id })
    if (copied.isCopied) return { drop: `Copied session ID ${id}` }
    return { drop: `Session ID: ${id} (clipboard unavailable: ${copied.reason})` }
  })

  // Fallback if the command ever runs past prompt.submit: copy, and
  // return no text or context so nothing is recorded for the model.
  on('command.run', { command: 'sid' }, async $ => {
    const id = await $.session.id()
    await $.ui.copy({ text: id })
    return {}
  })
}
