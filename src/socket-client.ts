import { StreamLabsApi } from './api';
import { SOCKET_URL } from './constants';
import { pushDonation } from './dashboard-feed';

type WsConnection = Awaited<ReturnType<(typeof network.websocket)['connect']>>;

type StreamLabsEvent = {
  type: string;
  message?: Array<{
    id?: number;
    donation_id?: string;
    name?: string;
    message?: string;
    amount?: number;
    currency?: string;
    [key: string]: unknown;
  }>;
};

const RECONNECT_DELAY_MS = 5000;
const HANDSHAKE_TIMEOUT_MS = 15000;

const removePrefix = (raw: string, prefix: string) =>
  raw.startsWith(prefix) ? raw.slice(prefix.length) : null;

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

      const handshake = new Promise<void>((resolve, reject) => {
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

      await handshake;

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

          if (eventName === 'event' && eventData?.type === 'donation') {
            const donations = eventData.message ?? [];
            for (const msg of donations) {
              const rawAmount = msg.amount;
              const amount =
                typeof rawAmount === 'number'
                  ? rawAmount
                  : typeof rawAmount === 'string'
                    ? parseFloat(rawAmount)
                    : 0;
              void pushDonation({
                donation_id: String(msg.id ?? msg.donation_id ?? Date.now()),
                created_at: new Date().toISOString(),
                currency: msg.currency ?? 'USD',
                amount: isNaN(amount) ? 0 : amount,
                name: msg.name ?? 'Anonymous',
                message: msg.message ?? '',
              });
            }
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
