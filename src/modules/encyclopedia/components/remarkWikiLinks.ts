import type { Link, PhrasingContent, Root, Text } from 'mdast'
import { visit } from 'unist-util-visit'
import { tokenizeWikiLinks } from '../../../core/lore/wikilinks'

/** URL prefix the renderer recognises as an internal wiki link. */
export const WIKI_HREF_PREFIX = '#wiki:'

/**
 * remark plugin: turns `[[Target]]` / `[[Target|label]]` in text nodes into
 * link nodes with an internal href. Code and inline code are separate node
 * types, so links inside them are untouched.
 */
export function remarkWikiLinks() {
  return (tree: Root) => {
    visit(tree, 'text', (node: Text, index, parent) => {
      if (!parent || index === undefined || !node.value.includes('[[')) return
      const tokens = tokenizeWikiLinks(node.value)
      if (tokens.length === 1 && tokens[0].type === 'text') return
      const replacement: PhrasingContent[] = tokens.map((tok) =>
        tok.type === 'text'
          ? ({ type: 'text', value: tok.value } satisfies Text)
          : ({
              type: 'link',
              url: WIKI_HREF_PREFIX + encodeURIComponent(tok.target),
              children: [{ type: 'text', value: tok.label }],
            } satisfies Link),
      )
      parent.children.splice(index, 1, ...replacement)
      return index + replacement.length
    })
  }
}
