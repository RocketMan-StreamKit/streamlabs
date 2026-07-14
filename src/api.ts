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

export const StreamLabsApi = new (class {
  /**
   * Dashboard Socket API token used for realtime events.
   */
  accessToken: string | null = null;

  /**
   * Returns whether a token is currently configured.
   * @returns `true` when a non-empty token is stored.
   * @example
   * if (await StreamLabsApi.ensureAccessToken()) { ... }
   */
  async ensureAccessToken(): Promise<boolean> {
    return !!this.accessToken?.trim();
  }

  /**
   * Returns the configured dashboard Socket API token.
   * @returns Socket token string, or `null` when unavailable.
   * @example
   * const token = await StreamLabsApi.getSocketToken();
   */
  async getSocketToken(): Promise<string | null> {
    const token = this.accessToken?.trim();
    return token || null;
  }
})();
