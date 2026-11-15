import type { Register } from 'claude-code'

import { codeBlocks, split } from './parse'

export const register: Register = on => {
  // Blocks of the last finished reply, for /copycode.
  let lastBlocks: string[] = []

  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'copycode',
      description: 'Copy a code block from the last reply: /copycode [n] (default: the last block)',
    })
    return next(e)
  })

  // Copy links only appear under fenced blocks, so ask the model to fence
  // everything the person is meant to copy: commands and prompts alike.
  on('prompt.compose', async ($, e, next) => {
    const composed = await next(e)
    if (e.surfaces.length === 0) return composed
    return {
      sections: [
        ...composed.sections,
        {
          id: 'copy-code:fence-copyables',
          scope: 'session',
          text: [
            '# Copyable text',
            'The user\'s interface adds a one-click copy link under every fenced code block, and copying from the terminal by hand garbles formatting. So whenever you give the user something they are meant to copy and use elsewhere, put it in its own fenced code block, exactly as it should be pasted:',
            '- shell commands they should run (one block per command or per sequence meant to run together; no `$ ` prompt prefix, no commentary inside the block)',
            '- prompts or messages for them to paste into another agent, chat, email or tool (use ```text; if the prompt itself contains ``` fences, wrap it in a longer fence such as ````text)',
            '- config snippets, env vars, URLs to paste, and code',
            'Keep explanations outside the block. Inline code stays fine for names and paths mentioned in passing.',
          ].join('\n'),
        },
      ],
    }
  })

  on('turn.complete', async ($, e, next) => {
    if (!e.agentId) {
      const blocks = codeBlocks(e.answer)
      if (blocks.length) lastBlocks = blocks
    }
    return next(e)
  })

  on('command.run', { command: 'copycode' }, async ($, e) => {
    if (!lastBlocks.length) return { text: 'No code blocks in recent replies.' }
    const n = e.args.trim() ? parseInt(e.args.trim(), 10) : lastBlocks.length
    const code = lastBlocks[n - 1]
    if (!code && code !== '') return { text: `Pick 1–${lastBlocks.length}.` }
    const r = await $.ui.copy({ text: code })
    return { text: r.isCopied ? `Copied block ${n} of ${lastBlocks.length} (${code.split('\n').length} lines).` : `Copy failed: ${r.reason}` }
  })

  on('ui.render', { component: 'AssistantMessage' }, async ($, e, next) => {
    if (e.props.isSummary) return next(e)
    const segments = split(e.props.text)
    if (!segments.some(s => s.kind === 'code')) return next(e)

    const { Box, Button, Markdown, Text } = $.ui.resolve(e)
    const copy = async (code: string, surface: typeof e.surface) => {
      const r = await $.ui.copy({ text: code, surface })
      $.ui.toast(r.isCopied ? `Copied ${code.split('\n').length} lines` : `Copy failed: ${r.reason}`)
    }

    // Group each code block with the prose before it; the first group goes
    // through the engine so the reply keeps its bullet and native look.
    const groups: { text: string; code?: string }[] = []
    let buf: string[] = []
    for (const s of segments) {
      buf.push(s.text)
      if (s.kind === 'code') {
        groups.push({ text: buf.join('\n'), code: s.code })
        buf = []
      }
    }
    if (buf.join('').trim()) groups.push({ text: buf.join('\n') })

    let block = 0
    const link = (code: string) => {
      block += 1
      const k = `copy-${block}`
      return (
        <Box paddingLeft={2} marginBottom={1}>
          <Button key={k} plain label="Copy code" onPress={press => copy(code, press.surface)}>
            <Text color="claude">⧉</Text>
          </Button>
        </Box>
      )
    }

    const [first, ...rest] = groups
    if (!first) return next(e)
    const head = await next({ ...e, props: { ...e.props, text: first.text } })

    return (
      <Box flexDirection="column">
        {head}
        {first.code !== undefined && link(first.code)}
        {rest.map(g => (
          <Box flexDirection="column">
            <Box paddingLeft={2}>
              <Markdown text={g.text} />
            </Box>
            {g.code !== undefined && link(g.code)}
          </Box>
        ))}
      </Box>
    )
  })
}
