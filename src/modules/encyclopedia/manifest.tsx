import { BookOpen } from 'lucide-react'
import type { LorewrightModule } from '../types'

/** The editor pulls in CodeMirror, so it loads on demand. */
const editor = { lazy: async () => ({ Component: (await import('./screens/PageEditor')).PageEditor }) }
import { CategoryIndex } from './screens/CategoryIndex'
import { ChapterFields } from './screens/ChapterFields'
import { ChaptersManage } from './screens/ChaptersManage'
import { PageReader } from './screens/PageReader'
import { WorldHome } from './screens/WorldHome'

export const encyclopediaModule: LorewrightModule = {
  id: 'encyclopedia',
  nameKey: 'encyclopedia:module.name',
  icon: BookOpen,
  basePath: '',
  worldRoutes: [
    { index: true, element: <WorldHome /> },
    { path: 'c/:categoryId', element: <CategoryIndex /> },
    { path: 'p/:pageId', element: <PageReader /> },
    { path: 'p/:pageId/edit', ...editor },
    { path: 'new', ...editor },
    { path: 'chapters', element: <ChaptersManage /> },
    { path: 'chapters/:categoryId', element: <ChapterFields /> },
  ],
}
