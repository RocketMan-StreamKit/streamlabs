import { StreamLabsApi } from './api';
import { SOCKET_URL } from './constants';
import { pushBits, pushDonation, pushFollow, pushHost, pushMerch, pushRaid, pushResubscription, pushSubscription } from './dashboard-feed';

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

const RECONNECT_DELAY_MS = 5000;
const HANDSHAKE_TIMEOUT_MS = 15000;

const removePrefix = (raw: string, prefix: string) =>
  raw.startsWith(prefix) ? raw.slice(prefix.length) : null;

const isTwitch = (forField?: string) => forField === 'twitch_account';
const isYoutube = (forField?: string) => forField === 'youtube_account';

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
      track_youtube_resubscription: params.track_youtube_resubscription === true,
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

const routeEvent = async (eventType: string, forField: string | undefined, messages: EventMessage[]) => {
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
          void pushResubscription(msg as Parameters<typeof pushResubscription>[0]);
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

export class StreamLabsSocketClient {
  private connection: WsConnection | null = null;
  private destroyed = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  async start() {
    this.destroyed = false;
    await this.connect();
  }

  stop() {
    this.destroyed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.destroyConnection(this.connection);
    this.connection = null;
  }

  private async connect() {
    if (this.destroyed) {
      return;
    }

    try {
      const socketToken = await StreamLabsApi.getSocketToken();
      if (!socketToken) {
        this.scheduleReconnect();
        return;
      }

      const url = `${SOCKET_URL}/?token=${socketToken}&EIO=3&transport=websocket`;
      const ws = await network.websocket.connect(url, {});

      if (this.destroyed) {
        ws.Destroy();
        return;
      }

      this.destroyConnection(this.connection);
      this.connection = ws;

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Socket.IO handshake timeout'));
        }, HANDSHAKE_TIMEOUT_MS);

        ws.On('message', (raw: string) => {
          if (this.destroyed || this.connection !== ws) {
            return;
          }

          try {
            const openPayload = removePrefix(raw, '0');
            if (openPayload !== null) {
              ws.Send('2probe');
              return;
            }

            if (raw === '3probe') {
              ws.Send('5');
              return;
            }

            if (raw.startsWith('40')) {
              clearTimeout(timeout);
              resolve();
              return;
            }
          } catch {
            // ignore
          }
        });
      });

      ws.On('message', (raw: string) => {
        if (this.destroyed || this.connection !== ws) {
          return;
        }

        try {
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

          if (eventName === 'event' && eventData?.type && Array.isArray(eventData.message)) {
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
    } catch {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.destroyed || this.reconnectTimer) {
      return;
    }

    this.destroyConnection(this.connection);
    this.connection = null;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.connect();
    }, RECONNECT_DELAY_MS);
  }

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
