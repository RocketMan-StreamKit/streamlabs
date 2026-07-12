type LangKey = 'en' | 'ru' | 'uk';

export type LocalizedText = Record<LangKey, string>;

export const pickLang = (text: Partial<LocalizedText> & { en: string }) =>
  text[LANG.current] || text.en;

export const buildLogoutLabel = (account: string): LocalizedText => ({
  en: `Logout (${account})`,
  ru: `Выйти (${account})`,
  uk: `Вийти (${account})`,
});

export const logoutFallback: LocalizedText = {
  en: 'Logout',
  ru: 'Выйти',
  uk: 'Вийти',
};

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

export const authMessages = {
  authFailed: (error: string): LocalizedText => ({
    en: `StreamLabs authorization failed: ${error}`,
    ru: `Ошибка авторизации StreamLabs: ${error}`,
    uk: `Помилка авторизації StreamLabs: ${error}`,
  }),
  missingCode: {
    en: 'Missing authorization code',
    ru: 'Отсутствует код авторизации',
    uk: 'Відсутній код авторизації',
  },
  tokenExchangeFailed: {
    en: 'Token exchange failed',
    ru: 'Не удалось обменять токен',
    uk: 'Не вдалося обміняти токен',
  },
  success: {
    en: 'Authorization successful. You can close this window.',
    ru: 'Авторизация успешна. Можно закрыть это окно.',
    uk: 'Авторизацію успішно завершено. Можна закрити це вікно.',
  },
};
