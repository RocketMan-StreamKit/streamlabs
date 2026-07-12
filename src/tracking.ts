import { StreamLabsApi } from './api';
import { notifyConnectionStatus } from './status-notify';
import { StreamLabsSocketClient } from './socket-client';

let starting = false;
let socketClient: StreamLabsSocketClient | null = null;

export const startStreamLabsTracking = async () => {
  if (starting || !StreamLabsApi.accessToken) {
    return;
  }

  starting = true;
  stopStreamLabsTracking();
  status.Update({ current: 'connecting' });

  try {
    socketClient = new StreamLabsSocketClient();
    await socketClient.start();

    status.Update({
      current: 'online',
      message: { en: 'StreamLabs' },
    });
    notifyConnectionStatus('online');

    console.log('[StreamLabs] Socket tracking started');
  } catch (error) {
    console.error('StreamLabs tracking failed to start:', error);
    status.Update({ current: 'error' });
    notifyConnectionStatus('error');
    stopStreamLabsTracking();
  } finally {
    starting = false;
  }
};

export const stopStreamLabsTracking = (options?: { notify?: boolean }) => {
  socketClient?.stop();
  socketClient = null;
  status.Update({ current: 'offline' });
  if (options?.notify !== false) {
    notifyConnectionStatus('offline');
  }
};
