import { StreamLabsApi } from './api';
import { RegenerateConfig } from './config';
import { mergeStreamLabsParams } from './params';
import { stopStreamLabsTracking } from './tracking';

const API_SETTINGS_URL =
  'https://streamlabs.com/dashboard#/settings/api-settings';

/**
 * Clears stored StreamLabs credentials and rebuilds the settings UI.
 * @example
 * events.On('streamlabsLogout', clearStreamLabsAuth);
 */
events.On('streamlabsLogout', async () => {
  stopStreamLabsTracking();
  StreamLabsApi.accessToken = null;
  await mergeStreamLabsParams({
    access_token: '',
    token_expires_at: 0,
    user_name: '',
    user_id: '',
  });
  RegenerateConfig();
});

/**
 * Opens StreamLabs dashboard API settings so the user can copy the Socket API token.
 * @example
 * events.On('streamlabsOpenApiSettings', () => { ... });
 */
events.On('streamlabsOpenApiSettings', () => {
  api.openUrl(API_SETTINGS_URL);
});
