import { Settings2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { LOCALES } from '../../core/i18n'
import { Menu, MenuOption, MenuSection } from '../../ui/Menu'
import { useTheme, type ThemePref } from '../theme'

const THEMES: ThemePref[] = ['system', 'light', 'dark']

/** Language and theme, reachable from every masthead. */
export function PreferencesMenu({ triggerClassName }: { triggerClassName: string }) {
  const { t, i18n } = useTranslation()
  const [theme, setTheme] = useTheme()
  const navigate = useNavigate()
  return (
    <Menu
      label={t('common:prefs.menuLabel')}
      triggerClassName={triggerClassName}
      trigger={
        <>
          <Settings2 aria-hidden="true" strokeWidth={1.75} />
          <span className="lang-code">{(i18n.resolvedLanguage ?? 'en').toUpperCase()}</span>
        </>
      }
    >
      {(close) => (
        <>
          <MenuSection title={t('common:prefs.language')}>
            {LOCALES.map((l) => (
              <MenuOption
                key={l.code}
                lang={l.code}
                selected={i18n.resolvedLanguage === l.code}
                onSelect={() => {
                  void i18n.changeLanguage(l.code)
                  close()
                }}
              >
                {l.nativeName}
              </MenuOption>
            ))}
          </MenuSection>
          <MenuSection title={t('common:prefs.theme')}>
            {THEMES.map((th) => (
              <MenuOption key={th} selected={theme === th} onSelect={() => setTheme(th)}>
                {t(`common:theme.${th}`)}
              </MenuOption>
            ))}
          </MenuSection>
          <MenuSection title={t('common:prefs.more')}>
            <MenuOption
              onSelect={() => {
                close()
                navigate('/settings')
              }}
            >
              {t('common:nav.appSettings')}
            </MenuOption>
          </MenuSection>
        </>
      )}
    </Menu>
  )
}
