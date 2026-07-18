/** Helpers to build minimal valid Lexical editor state for seeding. */

type LexicalText = {
  type: 'text'
  detail: number
  format: number
  mode: 'normal'
  style: ''
  text: string
  version: 1
}

type LexicalNode = {
  type: string
  version: number
  [key: string]: unknown
}

const text = (value: string): LexicalText => ({
  type: 'text',
  detail: 0,
  format: 0,
  mode: 'normal',
  style: '',
  text: value,
  version: 1,
})

const paragraph = (value: string): LexicalNode => ({
  type: 'paragraph',
  format: '',
  indent: 0,
  version: 1,
  direction: 'ltr',
  textFormat: 0,
  textStyle: '',
  children: [text(value)],
})

const heading = (value: string, tag: 'h2' | 'h3' = 'h2'): LexicalNode => ({
  type: 'heading',
  tag,
  format: '',
  indent: 0,
  version: 1,
  direction: 'ltr',
  children: [text(value)],
})

export type RichTextBlockSpec =
  | { kind: 'p'; text: string }
  | { kind: 'h2'; text: string }
  | { kind: 'h3'; text: string }

/** Build a Lexical richText value from a flat list of headings/paragraphs. */
export const richText = (blocks: (string | RichTextBlockSpec)[]) => ({
  root: {
    type: 'root' as const,
    format: '' as const,
    indent: 0,
    version: 1,
    direction: 'ltr' as const,
    children: blocks.map((block) => {
      if (typeof block === 'string') return paragraph(block)
      if (block.kind === 'h2') return heading(block.text, 'h2')
      if (block.kind === 'h3') return heading(block.text, 'h3')
      return paragraph(block.text)
    }),
  },
})
