import '@fontsource-variable/literata/opsz.css'
import '@fontsource-variable/literata/opsz-italic.css'
import '@fontsource-variable/archivo/wdth.css'
import './ui/tokens.css'
import './ui/base.css'
import './core/i18n'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import { migrateFromOldName } from './core/db/migrateName'

// Move data saved under the app's former name before anything reads it.
void migrateFromOldName().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
