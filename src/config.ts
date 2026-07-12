import { StreamLabsApi } from './api';
import {
  buildAuthServerSelectOptions,
  DEFAULT_API_SERVER,
  PLATFORM_AGNOSTIC_EVENTS,
  resolveApiServerUrl,
  TWITCH_EVENTS,
  YOUTUBE_EVENTS,
} from './constants';
import { buildLogoutLabel, formatAccountLabel, logoutFallback } from './locale';
import { mergeStreamLabsParams } from './params';
import { startStreamLabsTracking, stopStreamLabsTracking } from './tracking';

const anyEventEnabled = (events: ReadonlyArray<{ key: string; label: unknown }>, params: Record<string, unknown>) =>
  events.some(e => params[e.key] === true);

events.On('streamlabsTestDonation', async () => {
  const params = await api.config.getParams<{ user_name?: string }>();
  const donorName = params.user_name?.trim() || 'TestUser';
  const result = await StreamLabsApi.sendTestDonation(donorName);

  if (result.success) {
    notify.Send({
      id: 'streamlabs_test_donation',
      type: 'info',
      title: { en: 'StreamLabs', ru: 'StreamLabs', uk: 'StreamLabs' },
      message: {
        en: 'Test donation sent!',
        ru: 'Тестовый донат отправлен!',
        uk: 'Тестовий донат надіслано!',
      },
      temp: true,
    });
  } else {
    notify.Send({
      id: 'streamlabs_test_donation',
      type: 'error',
      title: { en: 'StreamLabs', ru: 'StreamLabs', uk: 'StreamLabs' },
      message: {
        en: `Test donation failed: ${result.message || 'Unknown error'}`,
        ru: `Тестовый донат не отправлен: ${result.message || 'Неизвестная ошибка'}`,
        uk: `Тестовий донат не надіслано: ${result.message || 'Невідома помилка'}`,
      },
      temp: true,
    });
  }
});

const clearStreamLabsAuth = () => {
  stopStreamLabsTracking();
  return mergeStreamLabsParams({
    access_token: '',
    token_expires_at: 0,
    user_name: '',
    user_id: '',
  }).then(() => {
    StreamLabsApi.accessToken = null;
    RegenerateConfig();
  });
};

const pushEventFields = (
  fields: Parameters<typeof GenerateConfig>[0],
  events: ReadonlyArray<{ key: string; label: Record<string, string> }>,
  sectionLabel: Record<string, string>,
  params: Record<string, unknown>
) => {
  fields.push({ type: 'info', key: `section_${sectionLabel.en}`, editor: { description: sectionLabel } });
  for (const ev of events) {
    fields.push({ key: ev.key, type: 'boolean', default: false, editor: { label: ev.label } });
  }
};

export const RegenerateConfig = () => {
  api.config.getParams().then(async params => {
    const access_token = params.access_token || '';
    const api_server = resolveApiServerUrl(params.api_server);
    let user_name =
      typeof params.user_name === 'string' ? params.user_name : '';
    let user_id = typeof params.user_id === 'string' ? params.user_id : '';

    StreamLabsApi.setApiServer(api_server);
    if (access_token) {
      StreamLabsApi.accessToken = access_token;
    }

    const effectiveToken = StreamLabsApi.accessToken;

    if (effectiveToken) {
      const ok = await StreamLabsApi.ensureAccessToken();
      if (!ok) {
        await clearStreamLabsAuth();
        return;
      }

      const user = await StreamLabsApi.getUser();
      if (user?.streamlabs) {
        const newName =
          user.streamlabs.display_name || user.streamlabs.name || user_name;
        const newId = String(user.streamlabs.id ?? user_id);
        if (newName !== user_name || newId !== user_id) {
          user_name = newName;
          user_id = newId;
          await mergeStreamLabsParams({ user_name, user_id });
        }
      }

      void startStreamLabsTracking();
    } else {
      stopStreamLabsTracking();
    }

    const fields: Parameters<typeof GenerateConfig>[0] = [];

    if (isDeveloperMode) {
      fields.push({
        key: 'api_server',
        type: 'select',
        default: DEFAULT_API_SERVER,
        options: buildAuthServerSelectOptions(isDeveloperMode),
        editor: {
          label: {
            en: 'API Server',
            ru: 'API сервер',
            uk: 'API сервер',
          },
          description: {
            en: 'Auth server URL (domain + port)',
            ru: 'URL сервера авторизации (домен + порт)',
            uk: 'URL сервера авторизації (домен + порт)',
          },
        },
      });
    }

    fields.push(
      {
        key: 'access_token',
        type: 'text',
        default: '',
      },
      {
        key: 'token_expires_at',
        type: 'number',
        default: 0,
      }
    );

    const hasToken = !!(
      (access_token || '').trim() || StreamLabsApi.accessToken
    );
    if (hasToken) {
      const account = formatAccountLabel(user_name, user_id);
      fields.push({
        type: 'button',
        key: 'logout',
        event: 'streamlabsLogout',
        editor: {
          label: account ? buildLogoutLabel(account) : logoutFallback,
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

      pushEventFields(fields, TWITCH_EVENTS, { en: 'Twitch events', ru: 'События Twitch', uk: 'Події Twitch' }, params);

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

      pushEventFields(fields, YOUTUBE_EVENTS, { en: 'YouTube events', ru: 'События YouTube', uk: 'Події YouTube' }, params);
      pushEventFields(fields, PLATFORM_AGNOSTIC_EVENTS, { en: 'Other events', ru: 'Другие события', uk: 'Інші події' }, params);
    } else {
      fields.push({
        type: 'button',
        key: 'login',
        event: 'streamlabsLogin',
        editor: {
          label: {
            en: 'Login via StreamLabs',
            ru: 'Войти через StreamLabs',
            uk: 'Увійти через StreamLabs',
          },
        },
      });
    }

    GenerateConfig(fields);
  });
};

RegenerateConfig();
