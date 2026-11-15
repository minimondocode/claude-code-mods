import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Note } from '../types'

const notes = atom({ plugin: 'focus-notes', key: 'notes' } as const, [] as Note[])
const isHidden = atom({ plugin: 'focus-notes', key: 'isHidden' } as const, false)

export const register: Register = on => {
  // A new prompt starts a fresh set of notes.
  on('prompt.submit', async ($, e, next) => {
    await update($, notes, () => [])
    await update($, isHidden, () => false)

    return next(e)
  }).catch(($, e, next) => next(e))

  // Text the main agent writes alongside tool calls is what focus mode hides;
  // the final answer (a step with no tool calls) is shown already.
  on('turn.step', async function* ($, e, next) {
    const response = yield* next(e)
    const text = response.answer.trim()

    if (e.agentId === undefined && text !== '' && response.toolUses.length > 0) {
      await update($, notes, list => [...list, { text }])
      $.ui.toast(text.slice(0, 300))
    }

    return response
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const list = await read($, notes)

    if (e.props.hasSurvey || list.length === 0 || (await read($, isHidden))) {
      return next(e)
    }

    const { Box, Button, Markdown, Text } = $.ui.resolve(e)

    return (
      <Box flexDirection="column">
        <Box>
          <Text dimColor>Claude, mid-turn ({list.length}) </Text>
          <Button key="hide" label="Hide" onPress={() => update($, isHidden, () => true)} />
        </Box>
        {list.map((note, i) => (
          <Markdown key={`note:${i}`} text={note.text} />
        ))}
      </Box>
    )
  })
}
