export const PLATFORM = 'streamlabs';

export const CLIENT_ID = '019f5725-54c9-724b-8f91-13f8788e9220';

export const DEFAULT_API_SERVER = 'https://rocketman-streams.com:443';
export const AUTH_SERVER_RU_URL = 'https://ru.rocketman-streams.com:443';
export const AUTH_SERVER_LOCAL_URL = 'https://local.rocketman-streams.com:443';

export const TWITCH_EVENTS = [
  { key: 'track_twitch_subscription', label: { en: 'Twitch: Paid subscriptions', ru: 'Twitch: Платные подписки', uk: 'Twitch: Платні підписки' } },
  { key: 'track_twitch_resubscription', label: { en: 'Twitch: Paid resubscriptions', ru: 'Twitch: Продление подписок', uk: 'Twitch: Продовження підписок' } },
  { key: 'track_twitch_follow', label: { en: 'Twitch: Follows', ru: 'Twitch: Подписчики', uk: 'Twitch: Підписники' } },
  { key: 'track_twitch_bits', label: { en: 'Twitch: Bits / Cheers', ru: 'Twitch: Bits / Cheers', uk: 'Twitch: Bits / Cheers' } },
  { key: 'track_twitch_raid', label: { en: 'Twitch: Raids', ru: 'Twitch: Рейды', uk: 'Twitch: Рейди' } },
  { key: 'track_twitch_host', label: { en: 'Twitch: Hosts', ru: 'Twitch: Хосты', uk: 'Twitch: Хости' } },
] as const;

export const YOUTUBE_EVENTS = [
  { key: 'track_youtube_subscription', label: { en: 'YouTube: Paid subscriptions', ru: 'YouTube: Платные подписки', uk: 'YouTube: Платні підписки' } },
  { key: 'track_youtube_resubscription', label: { en: 'YouTube: Paid resubscriptions', ru: 'YouTube: Продление подписок', uk: 'YouTube: Продовження підписок' } },
  { key: 'track_youtube_follow', label: { en: 'YouTube: Follows', ru: 'YouTube: Подписчики', uk: 'YouTube: Підписники' } },
] as const;

export const PLATFORM_AGNOSTIC_EVENTS = [
  { key: 'track_merch', label: { en: 'Merch', ru: 'Мерч', uk: 'Мерч' } },
] as const;

export const resolveApiServerUrl = (paramsApiServer?: string): string => {
  if (isDeveloperMode) {
    return paramsApiServer || DEFAULT_API_SERVER;
  }
  return isProxyMode ? AUTH_SERVER_RU_URL : DEFAULT_API_SERVER;
};

export const buildAuthServerSelectOptions = (includeLocalhost: boolean) => {
  const urlLabel = (url: string) => ({
    en: url,
    ru: url,
    uk: url,
  });
  const options = [
    { value: DEFAULT_API_SERVER, label: urlLabel(DEFAULT_API_SERVER) },
    { value: AUTH_SERVER_RU_URL, label: urlLabel(AUTH_SERVER_RU_URL) },
  ];
  if (includeLocalhost) {
    options.push({
      value: AUTH_SERVER_LOCAL_URL,
      label: urlLabel(AUTH_SERVER_LOCAL_URL),
    });
  }
  return options;
};

export const REDIRECT_URI = 'http://localhost:3000/addon/streamlabs/auth';

export const OAUTH_AUTHORIZE_URL = 'https://streamlabs.com/api/v2.0/authorize';

export const API_BASE = 'https://streamlabs.com/api/v2.0';

export const SCOPES = ['donations.read', 'socket.token', 'alerts.create'] as const;

export const SOCKET_URL = 'wss://sockets.streamlabs.com/socket.io';
