import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import Markdown, { type Components } from 'react-markdown'
import { Link } from 'react-router'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'
import { useResolveKeys } from '../../../core/lore/api'
import { foldKey } from '../../../core/lore/normalize'
import { parseWikiLinks } from '../../../core/lore/wikilinks'
import styles from './MarkdownView.module.css'
import { remarkWikiLinks, WIKI_HREF_PREFIX } from './remarkWikiLinks'

interface ResolverValue {
  worldId: string
  resolved: Map<string, { id: string; title: string }> | undefined
}
const Resolver = createContext<ResolverValue | null>(null)

function WikiLink({ target, children }: { target: string; children: ReactNode }) {
  const ctx = useContext(Resolver)
  const { t } = useTranslation()
  if (!ctx) return <>{children}</>
  const hit = ctx.resolved?.get(foldKey(target))
  if (hit) {
    return (
      <Link to={`/w/${ctx.worldId}/p/${hit.id}`} className={styles.wikilink}>
        {children}
      </Link>
    )
  }
  return (
    <Link
      to={`/w/${ctx.worldId}/new?title=${encodeURIComponent(target)}`}
      className={styles.redlink}
      title={t('encyclopedia:link.missingTitle', { title: target })}
    >
      {children}
      <span className="visually-hidden"> ({t('encyclopedia:link.missingA11y')})</span>
    </Link>
  )
}

const components: Components = {
  a({ href, children }) {
    if (href?.startsWith(WIKI_HREF_PREFIX)) {
      return <WikiLink target={decodeURIComponent(href.slice(WIKI_HREF_PREFIX.length))}>{children}</WikiLink>
    }
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    )
  },
  table({ children }) {
    return (
      <div className={styles.tableWrap}>
        <table>{children}</table>
      </div>
    )
  },
}

interface MarkdownViewProps {
  markdown: string
  worldId: string
  /** Content language of the world, for hyphenation and screen readers. */
  lang: string
  className?: string
}

/** Renders page Markdown with wiki links resolved against the world. */
export function MarkdownView({ markdown, worldId, lang, className }: MarkdownViewProps) {
  const keys = useMemo(() => parseWikiLinks(markdown).map((l) => l.key), [markdown])
  const resolved = useResolveKeys(worldId, keys)
  const value = useMemo(() => ({ worldId, resolved }), [worldId, resolved])
  return (
    <Resolver.Provider value={value}>
      <div className={[styles.prose, className].filter(Boolean).join(' ')} lang={lang}>
        <Markdown remarkPlugins={[remarkGfm, remarkWikiLinks]} rehypePlugins={[rehypeSanitize]} components={components}>
          {markdown}
        </Markdown>
      </div>
    </Resolver.Provider>
  )
}
