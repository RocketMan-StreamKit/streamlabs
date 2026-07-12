export const PLATFORM = 'streamlabs';

export const CLIENT_ID = '019f5725-54c9-724b-8f91-13f8788e9220';

export const DEFAULT_API_SERVER = 'https://rocketman-streams.com:443';
export const AUTH_SERVER_RU_URL = 'https://ru.rocketman-streams.com:443';
export const AUTH_SERVER_LOCAL_URL = 'https://local.rocketman-streams.com:443';

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

export const SCOPES = [
  'donations.read',
  'donations.create',
  'socket.token',
  'alerts.create',
] as const;

export const SOCKET_URL = 'wss://sockets.streamlabs.com/socket.io';
