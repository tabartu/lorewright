import { createHashRouter, type RouteObject } from 'react-router'
import { MODULES } from '../modules/registry'
import { AppFrame } from './shell/AppFrame'
import { WorldLayout } from './shell/WorldLayout'
import { AppSettings } from './screens/AppSettings'
import { NotFound } from './screens/NotFound'
import { WorldCreate } from './screens/WorldCreate'
import { WorldSettings } from './screens/WorldSettings'
import { WorldsShelf } from './screens/WorldsShelf'

function moduleRoutes(): RouteObject[] {
  return MODULES.flatMap((m) =>
    m.basePath ? [{ path: m.basePath, children: m.worldRoutes }] : m.worldRoutes,
  )
}

/** Hash routing keeps deep links working on static hosts such as GitHub Pages. */
export const router = createHashRouter([
  {
    element: <AppFrame />,
    // Lazy routes (editor, timeline, graph) render nothing while their code loads.
    HydrateFallback: () => null,
    children: [
      { index: true, element: <WorldsShelf /> },
      { path: 'worlds/new', element: <WorldCreate /> },
      { path: 'settings', element: <AppSettings /> },
      {
        path: 'w/:worldId',
        element: <WorldLayout />,
        children: [...moduleRoutes(), { path: 'settings', element: <WorldSettings /> }, { path: '*', element: <NotFound /> }],
      },
      { path: '*', element: <NotFound /> },
    ],
  },
])
