import {
  CLIENT_ID,
  OAUTH_AUTHORIZE_URL,
  REDIRECT_URI,
  resolveApiServerUrl,
  SCOPES,
} from './constants';
import { StreamLabsApi } from './api';
import { RegenerateConfig } from './config';
import { authMessages, pickLang } from './locale';
import { mergeStreamLabsParams } from './params';
import { stopStreamLabsTracking } from './tracking';

const buildAuthUrl = () => {
  const query = new URLSearchParams();
  query.set('client_id', CLIENT_ID);
  query.set('redirect_uri', REDIRECT_URI);
  query.set('response_type', 'code');
  query.set('scope', SCOPES.join(' '));
  return `${OAUTH_AUTHORIZE_URL}?${query.toString()}`;
};

events.On('streamlabsLogin', () => {
  api.openUrl(buildAuthUrl());
});

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

network.endpoints.create('auth', 'GET', 'streamlabsAuthCallback');

events.On('streamlabsAuthCallback', async ({ query }) => {
  try {
    const error = typeof query.error === 'string' ? query.error : '';
    if (error) {
      return {
        redirect: ui.auth.generateFail(
          pickLang(authMessages.authFailed(error))
        ),
      };
    }

    const code = typeof query.code === 'string' ? query.code : '';
    if (!code) {
      return {
        redirect: ui.auth.generateFail(pickLang(authMessages.missingCode)),
      };
    }

    const params = await api.config.getParams<{ api_server?: string }>();
    StreamLabsApi.setApiServer(resolveApiServerUrl(params.api_server));

    const exchanged = await StreamLabsApi.exchangeAuthorizationCode(code);
    if (!exchanged.success || !exchanged.accessToken) {
      const message =
        exchanged.message || pickLang(authMessages.tokenExchangeFailed);
      return {
        redirect: ui.auth.generateFail(message),
      };
    }

    const expiresAt =
      typeof exchanged.expiresIn === 'number'
        ? Date.now() + exchanged.expiresIn * 1000
        : Date.now() + 3600 * 1000;

    StreamLabsApi.accessToken = exchanged.accessToken;

    await mergeStreamLabsParams({
      access_token: exchanged.accessToken,
      token_expires_at: expiresAt,
    });

    try {
      const user = await StreamLabsApi.getUser();
      if (user?.streamlabs) {
        await mergeStreamLabsParams({
          user_name: user.streamlabs.display_name || user.streamlabs.name || '',
          user_id: String(user.streamlabs.id ?? ''),
        });
      }
    } catch (e) {
      console.warn('[StreamLabs] Failed to fetch user after auth:', e);
    }

    RegenerateConfig();

    return {
      redirect: ui.auth.generateSuccess(pickLang(authMessages.success)),
    };
  } catch (e) {
    console.error('[StreamLabs] Auth callback error:', e);
    return {
      redirect: ui.auth.generateFail('Internal error during authorization'),
    };
  }
});
