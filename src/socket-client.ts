import { StreamLabsApi } from './api';
import { SOCKET_URL } from './constants';
import {
  pushBits,
  pushDonation,
  pushFollow,
  pushHost,
  pushMerch,
  pushRaid,
  pushResubscription,
  pushSubscription,
} from './dashboard-feed';

type WsConnection = Awaited<ReturnType<(typeof network.websocket)['connect']>>;

type EventMessage = Record<string, unknown> & {
  id?: number;
  name?: string;
  message?: string;
  amount?: number | string;
  months?: number;
  currency?: string;
  sub_plan?: string;
  sub_plan_name?: string;
  product?: string;
};

type StreamLabsEvent = {
  type: string;
  for?: string;
  message?: EventMessage[];
};

/** Delay between reconnect attempts after a dropped connection. */
const RECONNECT_DELAY_MS = 5000;

/** Max wait for the Socket.IO open/upgrade handshake. */
const HANDSHAKE_TIMEOUT_MS = 15000;

/**
 * Strips a known Socket.IO packet prefix when present.
 * @param raw Raw websocket frame.
 * @param prefix Expected packet prefix.
 * @returns Payload without the prefix, or `null` when the prefix does not match.
 * @example
 * removePrefix('42["event",{}]', '42'); // '["event",{}]'
 */
const removePrefix = (raw: string, prefix: string) =>
  raw.startsWith(prefix) ? raw.slice(prefix.length) : null;

/**
 * @param forField StreamLabs `for` field from the event payload.
 * @returns Whether the event targets a Twitch account.
 */
const isTwitch = (forField?: string) => forField === 'twitch_account';

/**
 * @param forField StreamLabs `for` field from the event payload.
 * @returns Whether the event targets a YouTube account.
 */
const isYoutube = (forField?: string) => forField === 'youtube_account';

/**
 * Reads which optional platform events are enabled in settings.
 * @returns Map of tracking toggles.
 * @example
 * const settings = await readTrackingSettings();
 */
const readTrackingSettings = async (): Promise<Record<string, boolean>> => {
  try {
    const params = await api.config.getParams<Record<string, unknown>>();
    return {
      track_twitch_subscription: params.track_twitch_subscription === true,
      track_twitch_resubscription: params.track_twitch_resubscription === true,
      track_twitch_follow: params.track_twitch_follow === true,
      track_twitch_bits: params.track_twitch_bits === true,
      track_twitch_raid: params.track_twitch_raid === true,
      track_twitch_host: params.track_twitch_host === true,
      track_youtube_subscription: params.track_youtube_subscription === true,
      track_youtube_resubscription:
        params.track_youtube_resubscription === true,
      track_youtube_follow: params.track_youtube_follow === true,
      track_merch: params.track_merch === true,
    };
  } catch {
    return {
      track_twitch_subscription: false,
      track_twitch_resubscription: false,
      track_twitch_follow: false,
      track_twitch_bits: false,
      track_twitch_raid: false,
      track_twitch_host: false,
      track_youtube_subscription: false,
      track_youtube_resubscription: false,
      track_youtube_follow: false,
      track_merch: false,
    };
  }
};

/**
 * Routes a StreamLabs socket event into dashboard feed helpers.
 * @param eventType StreamLabs event `type`.
 * @param forField Optional platform target (`twitch_account`, …).
 * @param messages Event message array from StreamLabs.
 * @example
 * await routeEvent('donation', undefined, messages);
 */
const routeEvent = async (
  eventType: string,
  forField: string | undefined,
  messages: EventMessage[]
) => {
  const settings = await readTrackingSettings();

  for (const msg of messages) {
    const rawAmount = msg.amount;

    switch (eventType) {
      case 'donation': {
        const amount =
          typeof rawAmount === 'number'
            ? rawAmount
            : typeof rawAmount === 'string'
              ? parseFloat(rawAmount)
              : 0;
        void pushDonation({
          donation_id: String(msg.id ?? Date.now()),
          created_at: new Date().toISOString(),
          currency: (msg.currency as string) ?? 'USD',
          amount: isNaN(amount) ? 0 : amount,
          name: msg.name ?? 'Anonymous',
          message: msg.message ?? '',
        });
        break;
      }
      case 'subscription': {
        const enabled = isTwitch(forField)
          ? settings.track_twitch_subscription
          : isYoutube(forField)
            ? settings.track_youtube_subscription
            : false;
        if (enabled) {
          void pushSubscription(msg as Parameters<typeof pushSubscription>[0]);
        }
        break;
      }
      case 'resubscription': {
        const enabled = isTwitch(forField)
          ? settings.track_twitch_resubscription
          : isYoutube(forField)
            ? settings.track_youtube_resubscription
            : false;
        if (enabled) {
          void pushResubscription(
            msg as Parameters<typeof pushResubscription>[0]
          );
        }
        break;
      }
      case 'follow': {
        const enabled = isTwitch(forField)
          ? settings.track_twitch_follow
          : isYoutube(forField)
            ? settings.track_youtube_follow
            : false;
        if (enabled) {
          void pushFollow(msg as Parameters<typeof pushFollow>[0]);
        }
        break;
      }
      case 'bits':
        if (isTwitch(forField) && settings.track_twitch_bits) {
          void pushBits(msg as Parameters<typeof pushBits>[0]);
        }
        break;
      case 'raid':
        if (isTwitch(forField) && settings.track_twitch_raid) {
          void pushRaid(msg as Parameters<typeof pushRaid>[0]);
        }
        break;
      case 'host':
        if (isTwitch(forField) && settings.track_twitch_host) {
          void pushHost(msg as Parameters<typeof pushHost>[0]);
        }
        break;
      case 'merch':
        if (settings.track_merch) {
          void pushMerch(msg as Parameters<typeof pushMerch>[0]);
        }
        break;
    }
  }
};

/**
 * Maintains a Socket.IO connection to StreamLabs realtime events.
 */
export class StreamLabsSocketClient {
  /** Active websocket connection. */
  private connection: WsConnection | null = null;

  /** When true, reconnects and handlers must no-op. */
  private destroyed = false;

  /** Pending reconnect timer handle. */
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Engine.IO v3 client→server ping interval (from the open packet).
   * Without these pings StreamLabs drops the socket after pingInterval+pingTimeout.
   */
  private pingTimer: ReturnType<typeof setInterval> | null = null;

  /** Ping interval in ms from the last Engine.IO open packet. */
  private pingIntervalMs = 10000;

  /**
   * Opens the socket and waits until the Socket.IO handshake completes.
   * @throws When the token is missing or the initial handshake fails.
   * @example
   * await client.start();
   */
  async start() {
    this.destroyed = false;
    await this.connect({ allowReconnect: false });
  }

  /**
   * Tears down the connection and cancels reconnects.
   * @example
   * client.stop();
   */
  stop() {
    this.destroyed = true;
    this.clearReconnectTimer();
    this.clearPingTimer();
    this.destroyConnection(this.connection);
    this.connection = null;
  }

  /**
   * Performs a Socket.IO connect + handshake against StreamLabs.
   * @param options.allowReconnect When true, failures schedule a silent reconnect instead of throwing.
   * @example
   * await this.connect({ allowReconnect: true });
   */
  private async connect(options: { allowReconnect: boolean }) {
    if (this.destroyed) {
      return;
    }

    this.clearPingTimer();

    try {
      const socketToken = await StreamLabsApi.getSocketToken();
      if (!socketToken) {
        throw new Error('StreamLabs socket token is missing');
      }

      const url = `${SOCKET_URL}/?token=${encodeURIComponent(socketToken)}&EIO=3&transport=websocket`;
      const ws = await network.websocket.connect(url, {});

      if (this.destroyed) {
        ws.Destroy();
        return;
      }

      this.destroyConnection(this.connection);
      this.connection = ws;

      /** Subscriptions created during handshake; removed once live handlers are attached. */
      const handshakeSubs: Array<{ Destroy: () => void }> = [];

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Socket.IO handshake timeout'));
        }, HANDSHAKE_TIMEOUT_MS);

        const fail = (message: string) => {
          clearTimeout(timeout);
          reject(new Error(message));
        };

        handshakeSubs.push(
          ws.On('message', (raw: string) => {
            if (this.destroyed || this.connection !== ws) {
              return;
            }

            try {
              // EIO4-style server ping (harmless if StreamLabs ever sends one).
              if (raw === '2') {
                ws.Send('3');
                return;
              }

              // Socket.IO ERROR (packet type 4) — usually bad / wrong token.
              const errorPayload = removePrefix(raw, '44');
              if (errorPayload !== null) {
                let detail = errorPayload;
                try {
                  const parsed = JSON.parse(errorPayload) as unknown;
                  detail =
                    typeof parsed === 'string'
                      ? parsed
                      : parsed &&
                          typeof parsed === 'object' &&
                          'message' in parsed &&
                          typeof (parsed as { message: unknown }).message ===
                            'string'
                        ? (parsed as { message: string }).message
                        : errorPayload;
                } catch {
                  // keep raw
                }
                fail(
                  `StreamLabs authentication failed: ${detail}. Use "Your Socket API Token" from StreamLabs → Settings → API Settings → API Tokens (not the legacy API Token).`
                );
                return;
              }

              if (raw.startsWith('41')) {
                fail(
                  'StreamLabs rejected the socket token. Copy "Your Socket API Token" from API Tokens.'
                );
                return;
              }

              // Server sends CONNECTED (`40`) on its own after Engine.IO open.
              // Do not reply with another `40` — that closes the socket.
              if (raw.startsWith('40')) {
                clearTimeout(timeout);
                resolve();
                return;
              }

              if (raw.startsWith('0')) {
                this.readPingInterval(raw.slice(1));
                return;
              }
            } catch {
              // ignore
            }
          })
        );

        handshakeSubs.push(
          ws.On('close', () => {
            fail('Socket closed during handshake');
          })
        );

        handshakeSubs.push(
          ws.On('error', () => {
            fail('Socket error during handshake');
          })
        );
      });

      for (const sub of handshakeSubs) {
        try {
          sub.Destroy();
        } catch {
          // ignore
        }
      }

      if (this.destroyed || this.connection !== ws) {
        return;
      }

      this.startPingTimer(ws);

      ws.On('message', (raw: string) => {
        if (this.destroyed || this.connection !== ws) {
          return;
        }

        try {
          // Server pong to our Engine.IO v3 ping, or rare server-initiated ping.
          if (raw === '3') {
            return;
          }
          if (raw === '2') {
            ws.Send('3');
            return;
          }

          const payload = removePrefix(raw, '42');
          if (payload === null) {
            return;
          }

          let parsed: unknown[];
          try {
            parsed = JSON.parse(payload) as unknown[];
          } catch {
            return;
          }

          if (!Array.isArray(parsed) || parsed.length < 2) {
            return;
          }

          const eventName = parsed[0];
          const eventData = parsed[1] as StreamLabsEvent;

          if (
            eventName === 'event' &&
            eventData?.type &&
            Array.isArray(eventData.message)
          ) {
            void routeEvent(eventData.type, eventData.for, eventData.message);
          }
        } catch {
          // ignore parse errors
        }
      });

      ws.On('close', () => {
        if (!this.destroyed && this.connection === ws) {
          this.scheduleReconnect();
        }
      });

      ws.On('error', () => {
        // will trigger close
      });
    } catch (error) {
      this.clearPingTimer();
      if (options.allowReconnect && !this.destroyed) {
        this.scheduleReconnect();
        return;
      }
      throw error;
    }
  }

  /**
   * Reads `pingInterval` from an Engine.IO open JSON payload.
   * @param openPayload Open packet body after the leading `0`.
   * @example
   * this.readPingInterval('{"sid":"x","pingInterval":10000}');
   */
  private readPingInterval(openPayload: string) {
    try {
      const parsed = JSON.parse(openPayload) as { pingInterval?: unknown };
      if (
        typeof parsed.pingInterval === 'number' &&
        parsed.pingInterval >= 1000 &&
        parsed.pingInterval <= 120000
      ) {
        this.pingIntervalMs = parsed.pingInterval;
      }
    } catch {
      // keep previous / default
    }
  }

  /**
   * Starts Engine.IO v3 client pings (`2`) so StreamLabs does not idle-drop the socket.
   * @param ws Live websocket that completed the Socket.IO handshake.
   * @example
   * this.startPingTimer(ws);
   */
  private startPingTimer(ws: WsConnection) {
    this.clearPingTimer();
    this.pingTimer = setInterval(() => {
      if (this.destroyed || this.connection !== ws) {
        this.clearPingTimer();
        return;
      }
      try {
        ws.Send('2');
      } catch {
        // send failed — close handler will reconnect
      }
    }, this.pingIntervalMs);
  }

  /**
   * Clears the Engine.IO ping interval if one is running.
   * @example
   * this.clearPingTimer();
   */
  private clearPingTimer() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  /**
   * Clears a pending reconnect timeout if one is scheduled.
   * @example
   * this.clearReconnectTimer();
   */
  private clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Schedules a background reconnect after a dropped live connection.
   * @example
   * this.scheduleReconnect();
   */
  private scheduleReconnect() {
    if (this.destroyed || this.reconnectTimer) {
      return;
    }

    this.clearPingTimer();
    this.destroyConnection(this.connection);
    this.connection = null;

    status.Update({
      current: 'connecting',
      message: {
        en: 'Reconnecting to StreamLabs...',
        ru: 'Переподключение к StreamLabs...',
        uk: 'Перепідключення до StreamLabs...',
      },
    });

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.connect({ allowReconnect: true })
        .then(() => {
          if (!this.destroyed) {
            status.Update({
              current: 'online',
              message: {
                en: 'StreamLabs',
                ru: 'StreamLabs',
                uk: 'StreamLabs',
              },
            });
          }
        })
        .catch(() => {
          // connect({ allowReconnect: true }) schedules another attempt
        });
    }, RECONNECT_DELAY_MS);
  }

  /**
   * Safely destroys a websocket connection.
   * @param connection Connection to destroy, if any.
   * @example
   * this.destroyConnection(this.connection);
   */
  private destroyConnection(connection: WsConnection | null) {
    if (!connection) {
      return;
    }
    try {
      connection.Destroy();
    } catch {
      // ignore
    }
  }
}
