import { StreamLabsApi } from './api';
import {
  PLATFORM_AGNOSTIC_EVENTS,
  TWITCH_EVENTS,
  YOUTUBE_EVENTS,
} from './constants';
import { pushDonation } from './dashboard-feed';
import { formatAccountLabel, logoutFallback } from './locale';
import { startStreamLabsTracking, stopStreamLabsTracking } from './tracking';

/**
 * Returns whether any toggle in the given event list is enabled.
 * @param events Event field definitions with boolean keys.
 * @param params Current addon params map.
 * @returns `true` when at least one event key is `true`.
 * @example
 * if (anyEventEnabled(TWITCH_EVENTS, params)) { ... }
 */
const anyEventEnabled = (
  events: ReadonlyArray<{ key: string; label: unknown }>,
  params: Record<string, unknown>
) => events.some(e => params[e.key] === true);

/**
 * Pushes a local test donation into the dashboard (no StreamLabs REST API).
 * @example
 * events.On('streamlabsTestDonation', () => { ... });
 */
events.On('streamlabsTestDonation', async () => {
  const params = await api.config.getParams<{ user_name?: string }>();
  const donorName = params.user_name?.trim() || 'TestUser';

  try {
    await pushDonation({
      donation_id: `test-${Date.now()}`,
      created_at: new Date().toISOString(),
      currency: 'USD',
      amount: 1,
      name: donorName,
      message: 'Test donation from StreamLabs integration',
    });
    notify.Send({
      id: 'streamlabs_test_donation',
      type: 'info',
      title: { en: 'StreamLabs', ru: 'StreamLabs', uk: 'StreamLabs' },
      message: {
        en: 'Test donation sent to dashboard!',
        ru: 'Тестовый донат отправлен на дашборд!',
        uk: 'Тестовий донат надіслано на дашборд!',
      },
      temp: true,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    notify.Send({
      id: 'streamlabs_test_donation',
      type: 'error',
      title: { en: 'StreamLabs', ru: 'StreamLabs', uk: 'StreamLabs' },
      message: {
        en: `Test donation failed: ${detail}`,
        ru: `Тестовый донат не отправлен: ${detail}`,
        uk: `Тестовий донат не надіслано: ${detail}`,
      },
      temp: true,
    });
  }
});

/**
 * Appends a section header and boolean toggles for a group of events.
 * @param fields Config field list being built.
 * @param events Event definitions with keys and labels.
 * @param sectionLabel Localized section title.
 * @example
 * pushEventFields(fields, TWITCH_EVENTS, { en: 'Twitch events', ru: '...', uk: '...' });
 */
const pushEventFields = (
  fields: Parameters<typeof GenerateConfig>[0],
  events: ReadonlyArray<{ key: string; label: Record<string, string> }>,
  sectionLabel: Record<string, string>
) => {
  fields.push({
    type: 'info',
    key: `section_${sectionLabel.en}`,
    editor: { description: sectionLabel },
  });
  for (const ev of events) {
    fields.push({
      key: ev.key,
      type: 'boolean',
      default: false,
      editor: { label: ev.label },
    });
  }
};

/**
 * Applies the current token, starts or stops socket tracking, and rebuilds settings UI.
 * @example
 * RegenerateConfig();
 */
/** Dedupes overlapping rebuilds from load + onParamsUpdated races. */
let regenerateSeq = 0;

export const RegenerateConfig = () => {
  const seq = ++regenerateSeq;
  api.config.getParams().then(async params => {
    if (seq !== regenerateSeq) {
      return;
    }

    const access_token =
      typeof params.access_token === 'string' ? params.access_token.trim() : '';
    const user_name =
      typeof params.user_name === 'string' ? params.user_name : '';
    const user_id = typeof params.user_id === 'string' ? params.user_id : '';

    StreamLabsApi.accessToken = access_token || null;

    if (access_token) {
      void startStreamLabsTracking();
    } else {
      stopStreamLabsTracking();
    }

    const fields: Parameters<typeof GenerateConfig>[0] = [];

    fields.push({
      key: 'access_token',
      type: 'hidden',
      default: '',
      editor: {
        label: {
          en: 'Socket API Token',
          ru: 'Socket API токен',
          uk: 'Socket API токен',
        },
        description: {
          en: 'Paste "Your Socket API Token" from StreamLabs → Settings → API Settings → API Tokens.\nDo NOT use the legacy API Token — only the Socket API Token works.',
          ru: 'Вставьте «Your Socket API Token» из StreamLabs → Settings → API Settings → API Tokens.\nНе используйте legacy API Token — нужен именно Socket API Token.',
          uk: 'Вставте «Your Socket API Token» з StreamLabs → Settings → API Settings → API Tokens.\nНе використовуйте legacy API Token — потрібен саме Socket API Token.',
        },
      },
    });

    // Kept for backward compatibility with previously stored OAuth params.
    fields.push({
      key: 'token_expires_at',
      type: 'number',
      default: 0,
    });

    fields.push({
      type: 'button',
      key: 'open_api_settings',
      event: 'streamlabsOpenApiSettings',
      editor: {
        label: {
          en: 'Open API Settings',
          ru: 'Открыть API Settings',
          uk: 'Відкрити API Settings',
        },
      },
    });

    const hasToken = !!access_token;
    if (hasToken) {
      if (user_name || user_id) {
        fields.push({
          type: 'info',
          key: 'account_info',
          editor: {
            description: {
              en: `Connected as: ${formatAccountLabel(user_name, user_id)}`,
              ru: `Подключено как: ${formatAccountLabel(user_name, user_id)}`,
              uk: `Підключено як: ${formatAccountLabel(user_name, user_id)}`,
            },
          },
        });
      }

      fields.push({
        type: 'button',
        key: 'logout',
        event: 'streamlabsLogout',
        editor: {
          label: logoutFallback,
        },
      });

      fields.push({
        type: 'button',
        key: 'test',
        event: 'streamlabsTestDonation',
        editor: {
          label: {
            en: 'Send test donation',
            ru: 'Отправить тестовый донат',
            uk: 'Надіслати тестовий донат',
          },
        },
      });

      pushEventFields(fields, TWITCH_EVENTS, {
        en: 'Twitch events',
        ru: 'События Twitch',
        uk: 'Події Twitch',
      });

      if (anyEventEnabled(TWITCH_EVENTS, params)) {
        fields.push({
          type: 'info',
          key: 'twitch_dup_warning',
          editor: {
            description: {
              en: 'If the Twitch addon is active, duplicate events may appear',
              ru: 'Если аддон Twitch активен, возможны дублирующие события',
              uk: 'Якщо аддон Twitch активний, можливі дублюючі події',
            },
          },
        });
      }

      pushEventFields(fields, YOUTUBE_EVENTS, {
        en: 'YouTube events',
        ru: 'События YouTube',
        uk: 'Події YouTube',
      });
      pushEventFields(fields, PLATFORM_AGNOSTIC_EVENTS, {
        en: 'Other events',
        ru: 'Другие события',
        uk: 'Інші події',
      });
    }

    GenerateConfig(fields);
  });
};

RegenerateConfig();

/**
 * Rebuilds config and reconnects when the user saves settings.
 * @example
 * // fired by StreamKit+ after settings edits
 * events.On('onParamsUpdated', () => RegenerateConfig());
 */
events.On('onParamsUpdated', () => {
  RegenerateConfig();
});
