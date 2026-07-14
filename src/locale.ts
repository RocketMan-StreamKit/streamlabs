type LangKey = 'en' | 'ru' | 'uk';

export type LocalizedText = Record<LangKey, string>;

/**
 * Picks a localized string for the current UI language.
 * @param text Localized map with required English fallback.
 * @returns Resolved string for `LANG.current`, or English.
 * @example
 * pickLang({ en: 'Hi', ru: 'Привет' });
 */
export const pickLang = (text: Partial<LocalizedText> & { en: string }) =>
  text[LANG.current] || text.en;

/**
 * Default logout button label.
 */
export const logoutFallback: LocalizedText = {
  en: 'Clear token',
  ru: 'Очистить токен',
  uk: 'Очистити токен',
};

/**
 * Formats a user display label from name and/or id.
 * @param name Optional display name.
 * @param id Optional account id.
 * @returns Combined label, or empty string.
 * @example
 * formatAccountLabel('Alice', '123'); // 'Alice (123)'
 */
export const formatAccountLabel = (name?: string, id?: string) => {
  const trimmedName = name?.trim();
  const trimmedId = id?.trim();
  if (trimmedName && trimmedId) {
    return `${trimmedName} (${trimmedId})`;
  }
  if (trimmedName) {
    return trimmedName;
  }
  if (trimmedId) {
    return trimmedId;
  }
  return '';
};
