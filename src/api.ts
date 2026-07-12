import { API_BASE, DEFAULT_API_SERVER, REDIRECT_URI } from './constants';

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

export type StreamLabsDonation = {
  donation_id: string;
  created_at: string;
  currency: string;
  amount: number;
  name: string;
  message: string;
  is_animated_donation?: boolean;
  is_audiodonation?: boolean;
  recipient?: string;
};

export type StreamLabsUser = {
  socket_token?: string;
  streamlabs?: {
    id?: number | string;
    name?: string;
    display_name?: string;
    avatar?: string;
  };
  twitch?: {
    id?: string;
    name?: string;
    display_name?: string;
    avatar?: string;
  };
};

const normalizeApiServer = (value?: string | null) => {
  const trimmed = value?.trim() || DEFAULT_API_SERVER;
  return trimmed.replace(/\/+$/, '');
};

export const StreamLabsApi = new (class {
  accessToken: string | null = null;
  apiServer: string = DEFAULT_API_SERVER;
  setApiServer(value?: string | null) {
    this.apiServer = normalizeApiServer(value);
  }

  private postTokenEndpoint(
    path: string,
    body: Record<string, unknown>
  ): Promise<string> {
    return network.request.post(`${this.apiServer}${path}`, body);
  }

  private parseBody<T>(response: string, fallback: string) {
    if (!response?.trim()) {
      return { ok: false as const, message: fallback };
    }
    let body: T & { message?: string; error?: string };
    try {
      body = JSON.parse(response) as T & { message?: string; error?: string };
    } catch {
      return { ok: false as const, message: fallback };
    }
    const detail = (body as { detail?: unknown }).detail;
    const errorMessage =
      body.error || (typeof detail === 'string' ? detail : undefined);
    if (errorMessage) {
      return { ok: false as const, message: errorMessage };
    }
    return { ok: true as const, body };
  }

  async exchangeAuthorizationCode(code: string): Promise<{
    success: boolean;
    accessToken?: string;
    expiresIn?: number;
    message?: string;
  }> {
    try {
      const response = await this.postTokenEndpoint('/streamlabs/oauth/token', {
        code,
        redirect_uri: REDIRECT_URI,
      });
      console.log('[StreamLabs] Token exchange response:', response);
      const parsed = this.parseBody<TokenResponse>(
        response,
        'Failed to exchange authorization code'
      );
      if (!parsed.ok || !parsed.body.access_token) {
        const detail =
          parsed.ok === false
            ? parsed.message
            : parsed.body.error_description ||
              'StreamLabs did not return access token';
        console.error('[StreamLabs] Token exchange failed:', detail);
        return { success: false, message: detail };
      }
      return {
        success: true,
        accessToken: parsed.body.access_token,
        expiresIn: parsed.body.expires_in,
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'StreamLabs token exchange failed';
      console.error('StreamLabs token exchange failed:', error);
      return { success: false, message };
    }
  }

  async ensureAccessToken(): Promise<boolean> {
    return !!this.accessToken;
  }

  async getSocketToken(): Promise<string | null> {
    if (!this.accessToken) {
      return null;
    }

    try {
      const response = await network.request.get(
        `${API_BASE}/socket/token`,
        { Authorization: `Bearer ${this.accessToken}` }
      );
      const parsed = this.parseBody<{ socket_token?: string }>(
        response,
        'Failed to get socket token'
      );
      if (!parsed.ok || !parsed.body.socket_token) {
        return null;
      }
      return parsed.body.socket_token;
    } catch (error) {
      console.error('StreamLabs get socket token failed:', error);
      return null;
    }
  }

  async sendTestDonation(name: string): Promise<{
    success: boolean;
    message?: string;
    data?: StreamLabsDonation;
  }> {
    if (!this.accessToken) {
      return { success: false, message: 'Not authenticated' };
    }

    const identifier = name.toLowerCase().replace(/\s+/g, '');

    try {
      const response = await network.request.post(
        `${API_BASE}/donations`,
        {
          skip_alert: 'no',
          message: 'Test donation from StreamLabs integration',
          name,
          identifier,
          amount: 1,
          currency: 'USD',
        },
        {
          Authorization: `Bearer ${this.accessToken}`,
          accept: 'application/json',
          'content-type': 'application/json',
        }
      );
      const parsed = this.parseBody<{
        data?: StreamLabsDonation;
        donation?: StreamLabsDonation;
      }>(response, 'Failed to send test donation');
      if (!parsed.ok) {
        return { success: false, message: parsed.message };
      }
      const donation = parsed.body.donation || parsed.body.data;
      return { success: true, data: donation };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Test donation request failed';
      console.error('StreamLabs test donation failed:', error);
      return { success: false, message };
    }
  }

  async getUser(): Promise<StreamLabsUser | null> {
    if (!this.accessToken) {
      return null;
    }

    try {
      const response = await network.request.get(
        `${API_BASE}/user`,
        { Authorization: `Bearer ${this.accessToken}` }
      );
      console.log('[StreamLabs] /user response:', response?.slice(0, 500));
      const parsed = this.parseBody<Record<string, unknown>>(
        response,
        'Failed to load user profile'
      );
      if (!parsed.ok) {
        console.warn('[StreamLabs] /user parse failed, trying query param auth');
        const fallback = await network.request.get(
          `${API_BASE}/user?access_token=${this.accessToken}`
        );
        console.log('[StreamLabs] /user (query) response:', fallback?.slice(0, 500));
        const fallbackParsed = this.parseBody<Record<string, unknown>>(
          fallback,
          'Failed to load user profile'
        );
        if (!fallbackParsed.ok) {
          return null;
        }
        return fallbackParsed.body as unknown as StreamLabsUser;
      }
      return parsed.body as unknown as StreamLabsUser;
    } catch (error) {
      console.error('StreamLabs get user failed:', error);
      return null;
    }
  }
})();
