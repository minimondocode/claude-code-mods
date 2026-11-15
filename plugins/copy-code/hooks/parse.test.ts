import { expect, test } from 'claude-code/testing'
import { codeBlocks, split } from './parse'

test('extracts fenced code exactly', async () => {
  const md = 'Run this:\n\n```bash\necho "hi"\n  indented\n```\n\nThen:\n~~~\nx\n~~~\ntail'
  expect(codeBlocks(md)).toEqual(['echo "hi"\n  indented', 'x'])
  expect(split(md).map(s => s.kind)).toEqual(['prose', 'code', 'prose', 'code', 'prose'])
})

test('strips list-nested fence indent', async () => {
  expect(codeBlocks('1. step\n   ```py\n   def f():\n       pass\n   ```')).toEqual(['def f():\n    pass'])
})

test('unclosed fence (streaming) yields no block', async () => {
  expect(codeBlocks('```js\nconst a = 1')).toEqual([])
})

test('longer fence contains shorter one', async () => {
  expect(codeBlocks('````md\n```\ninner\n```\n````')).toEqual(['```\ninner\n```'])
})

test('a hand-off prompt in an untagged fence copies whole', async () => {
  const md = 'Paste this into a fresh session (`~/src/app`):\n\n```\nDo the task.\nRead first: docs/a.md, docs/b.md.\n\n1. Check that `x` is empty.\n   - nested | pipes | kept\n2. Report.\n```\n\nThen tell me.'
  expect(codeBlocks(md)).toEqual(['Do the task.\nRead first: docs/a.md, docs/b.md.\n\n1. Check that `x` is empty.\n   - nested | pipes | kept\n2. Report.'])
})
