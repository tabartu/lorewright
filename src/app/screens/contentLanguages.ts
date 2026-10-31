/** Language tags offered as a world's content language. Names come from Intl.DisplayNames. */
export const CONTENT_LANGUAGES = [
  'en', 'tr', 'de', 'fr', 'es', 'it', 'pt', 'nl', 'sv', 'nb', 'da', 'fi', 'is', 'pl', 'cs', 'sk', 'hu', 'ro',
  'bg', 'el', 'ru', 'uk', 'sr', 'hr', 'lt', 'lv', 'et', 'ar', 'he', 'fa', 'ur', 'hi', 'bn', 'ja', 'ko', 'zh',
  'id', 'ms', 'vi', 'th', 'tl', 'sw', 'ka', 'hy', 'az', 'kk', 'eo', 'la',
]

export function nativeLanguageName(tag: string): string {
  try {
    return new Intl.DisplayNames([tag], { type: 'language' }).of(tag) ?? tag
  } catch {
    return tag
  }
}
