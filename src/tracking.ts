import { StreamLabsApi } from './api';
import { notifyConnectionStatus } from './status-notify';
import { StreamLabsSocketClient } from './socket-client';

/** Guards against overlapping start attempts. */
let starting = false;

/** Active Socket.IO client, if any. */
let socketClient: StreamLabsSocketClient | null = null;

/** Token that the active client was started with. */
let activeToken: string | null = null;

/**
 * Connects to StreamLabs sockets using the configured Socket API token.
 * Skips reconnect when already online with the same token.
 * @example
 * await startStreamLabsTracking();
 */
export const startStreamLabsTracking = async () => {
  const token = StreamLabsApi.accessToken?.trim() || '';
  if (!token) {
    return;
  }

  if (socketClient && activeToken === token && !starting) {
    return;
  }

  if (starting) {
    return;
  }

  starting = true;
  stopStreamLabsTracking({ notify: false });
  status.Update({
    current: 'connecting',
    message: {
      en: 'Connecting to StreamLabs...',
      ru: 'Подключение к StreamLabs...',
      uk: 'Підключення до StreamLabs...',
    },
  });

  try {
    socketClient = new StreamLabsSocketClient();
    activeToken = token;
    await socketClient.start();

    status.Update({
      current: 'online',
      message: { en: 'StreamLabs', ru: 'StreamLabs', uk: 'StreamLabs' },
    });
    notifyConnectionStatus('online');

    console.log('[StreamLabs] Socket tracking started');
  } catch (error) {
    console.error('StreamLabs tracking failed to start:', error);
    activeToken = null;
    status.Update({
      current: 'error',
      message: {
        en: 'Failed to connect to StreamLabs',
        ru: 'Не удалось подключиться к StreamLabs',
        uk: 'Не вдалося підключитися до StreamLabs',
      },
    });
    notifyConnectionStatus('error');
    stopStreamLabsTracking({ notify: false });
  } finally {
    starting = false;
  }
};

/**
 * Stops the Socket.IO client and marks the addon offline.
 * @param options.notify When `false`, skips the offline notification toast.
 * @example
 * stopStreamLabsTracking();
 */
export const stopStreamLabsTracking = (options?: { notify?: boolean }) => {
  socketClient?.stop();
  socketClient = null;
  activeToken = null;
  status.Update({ current: 'offline' });
  if (options?.notify !== false) {
    notifyConnectionStatus('offline');
  }
};
