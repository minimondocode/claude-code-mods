import { expect, test } from 'claude-code/testing'

const MSG = (text: string) =>
  ({
    plugin: 'copy-code',
    component: 'AssistantMessage',
    props: { text, isFirstOfReply: true },
  }) as const

test('each code block gets a copy button that copies the raw code', async ($, on) => {
  const copied: string[] = []
  on('ui.copy', (_, e) => {
    copied.push(e.text)
    return { value: { isCopied: true } }
  })
  on('ui.toast', () => ({ value: undefined }))
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })

  const md = 'Try:\n\n```bash\necho "a b"\n\tTAB\n```\n\nand\n\n```py\nprint(1)\n```\nbye'
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ ...MSG(md), surface })
    await ui.press({ key: 'copy-1' })
    await ui.press({ key: 'copy-2' })
    await ui.unmount()
  }
  expect(copied).toEqual(['echo "a b"\n\tTAB', 'print(1)', 'echo "a b"\n\tTAB', 'print(1)'])
})

test('a message without code goes untouched to the engine', async ($, on) => {
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })
  const ui = await $.ui.mount({ ...MSG('just prose'), surface: 'terminal' })
  expect(await ui.find({ key: 'copy-1' })).toBeUndefined()
  await ui.unmount()
})

test('the system prompt asks for fenced commands and prompts', async ($, on) => {
  on('prompt.compose', () => ({ sections: [{ id: 'intro', text: 'hi', scope: 'shared' }] }))
  const r = await $.prompt.compose({ surfaces: ['terminal'], model: 'claude-opus-5-5', promptModel: 'claude-opus-5-5', tools: [], outputStyle: null, traits: [] } as never)
  const added = r.sections.find(s => s.id === 'copy-code:fence-copyables')
  expect(added?.text).toContain('prompts or messages')
})
