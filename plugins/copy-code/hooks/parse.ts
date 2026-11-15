export type Segment =
  | { kind: 'prose'; text: string }
  | { kind: 'code'; text: string; code: string; lang: string }

const OPEN = /^( {0,3}|\s*)(`{3,}|~{3,})\s*([^`\s]*)[^`]*$/

/**
 * Splits markdown into prose and fenced code segments. `code` is the block's
 * contents exactly as the model wrote them, minus the fence's own indentation
 * (so a fence nested in a list copies flush-left). An unclosed fence (still
 * streaming) stays prose: it gets no copy link until it closes.
 */
export function split(markdown: string): Segment[] {
  const lines = markdown.split('\n')
  const out: Segment[] = []
  let prose: string[] = []
  const flush = () => {
    if (prose.length) out.push({ kind: 'prose', text: prose.join('\n') })
    prose = []
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ''
    const m = OPEN.exec(line)
    if (!m) {
      prose.push(line)
      continue
    }
    const indent = m[1] ?? ''
    const fence = m[2] ?? '```'
    const lang = m[3] ?? ''
    const close = new RegExp(`^\\s*${fence[0] === '`' ? '`' : '~'}{${fence.length},}\\s*$`)
    let j = i + 1
    while (j < lines.length && !close.test(lines[j] ?? '')) j++
    if (j >= lines.length) {
      prose.push(...lines.slice(i))
      break
    }
    const body = lines.slice(i + 1, j).map(l => (l.startsWith(indent) ? l.slice(indent.length) : l.trimStart()))
    flush()
    out.push({ kind: 'code', text: lines.slice(i, j + 1).join('\n'), code: body.join('\n'), lang })
    i = j
  }
  flush()
  return out
}

export function codeBlocks(markdown: string): string[] {
  return split(markdown).flatMap(s => (s.kind === 'code' ? [s.code] : []))
}
