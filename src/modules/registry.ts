import { encyclopediaModule } from './encyclopedia/manifest'
import type { WorldledgerModule } from './types'

/** Every installed module. Add new modules here; the router and navigation pick them up. */
export const MODULES: WorldledgerModule[] = [encyclopediaModule]
