import './auth';
import './config';
import { PLATFORM } from './constants';
import { registerStreamLabsOverlayTriggers } from './triggers';

void dashboard.registerPlatform({
  id: PLATFORM,
  name: {
    en: 'StreamLabs',
    ru: 'StreamLabs',
    uk: 'StreamLabs',
  },
});

void registerStreamLabsOverlayTriggers();

status.OnClick(() => {
  api.restart();
});
