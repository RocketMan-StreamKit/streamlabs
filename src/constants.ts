export const PLATFORM = 'streamlabs';

export const TWITCH_EVENTS = [
  {
    key: 'track_twitch_subscription',
    label: {
      en: 'Twitch: Paid subscriptions',
      ru: 'Twitch: Платные подписки',
      uk: 'Twitch: Платні підписки',
    },
  },
  {
    key: 'track_twitch_resubscription',
    label: {
      en: 'Twitch: Paid resubscriptions',
      ru: 'Twitch: Продление подписок',
      uk: 'Twitch: Продовження підписок',
    },
  },
  {
    key: 'track_twitch_follow',
    label: {
      en: 'Twitch: Follows',
      ru: 'Twitch: Подписчики',
      uk: 'Twitch: Підписники',
    },
  },
  {
    key: 'track_twitch_bits',
    label: {
      en: 'Twitch: Bits / Cheers',
      ru: 'Twitch: Bits / Cheers',
      uk: 'Twitch: Bits / Cheers',
    },
  },
  {
    key: 'track_twitch_raid',
    label: { en: 'Twitch: Raids', ru: 'Twitch: Рейды', uk: 'Twitch: Рейди' },
  },
  {
    key: 'track_twitch_host',
    label: { en: 'Twitch: Hosts', ru: 'Twitch: Хосты', uk: 'Twitch: Хости' },
  },
] as const;

export const YOUTUBE_EVENTS = [
  {
    key: 'track_youtube_subscription',
    label: {
      en: 'YouTube: Paid subscriptions',
      ru: 'YouTube: Платные подписки',
      uk: 'YouTube: Платні підписки',
    },
  },
  {
    key: 'track_youtube_resubscription',
    label: {
      en: 'YouTube: Paid resubscriptions',
      ru: 'YouTube: Продление подписок',
      uk: 'YouTube: Продовження підписок',
    },
  },
  {
    key: 'track_youtube_follow',
    label: {
      en: 'YouTube: Follows',
      ru: 'YouTube: Подписчики',
      uk: 'YouTube: Підписники',
    },
  },
] as const;

export const PLATFORM_AGNOSTIC_EVENTS = [
  { key: 'track_merch', label: { en: 'Merch', ru: 'Мерч', uk: 'Мерч' } },
] as const;

export const SOCKET_URL = 'wss://sockets.streamlabs.com/socket.io';
