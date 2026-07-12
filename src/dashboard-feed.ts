import { PLATFORM } from './constants';
import type { StreamLabsDonation } from './api';

const userId = (name: string) => `streamlabs:${name.trim().toLowerCase()}`;

export const pushDonation = async (payload: StreamLabsDonation) => {
  const donorName = payload.name?.trim() || 'Anonymous';
  const currency = payload.currency?.trim() || 'USD';
  const amount = payload.amount;

  const profile = {
    id: userId(donorName),
    name: donorName,
    avatar: '',
    platform: PLATFORM,
  };

  return dashboard.addRecord(
    {
      id: `streamlabs:donation:${payload.donation_id}`,
      type: 'donation' as const,
      platform: PLATFORM,
      from: profile.id,
      amount: [amount, currency],
      message: payload.message?.trim() || undefined,
    },
    profile,
    { trigger: { type: 'donation', key: currency, value: amount } }
  );
};

const generateId = (prefix: string, name: string, suffix?: number | string) =>
  `streamlabs:${prefix}:${name.trim().toLowerCase()}${suffix != null ? `:${suffix}` : ''}`;

type EventUser = { name?: string };

export const pushSubscription = async (msg: EventUser & { months?: number; sub_plan?: string; sub_plan_name?: string; message?: string }) => {
  const name = msg.name?.trim() || 'Anonymous';
  const profile = { id: userId(name), name, avatar: '', platform: PLATFORM };
  return dashboard.addRecord(
    { id: generateId('sub', name), type: 'subscribe' as const, platform: PLATFORM, from: profile.id, message: msg.message?.trim() || undefined },
    profile,
    { trigger: { type: 'subscribe', key: 'sub', value: 1 } }
  );
};

export const pushResubscription = async (msg: EventUser & { months?: number; message?: string }) => {
  const name = msg.name?.trim() || 'Anonymous';
  const months = typeof msg.months === 'number' ? msg.months : 1;
  const profile = { id: userId(name), name, avatar: '', platform: PLATFORM };
  return dashboard.addRecord(
    { id: generateId('resub', name), type: 'subscribe' as const, platform: PLATFORM, from: profile.id, amount: [months, 'months'], message: msg.message?.trim() || undefined },
    profile,
    { trigger: { type: 'subscribe', key: 'resub', value: months } }
  );
};

export const pushFollow = async (msg: EventUser) => {
  const name = msg.name?.trim() || 'Anonymous';
  const profile = { id: userId(name), name, avatar: '', platform: PLATFORM };
  return dashboard.addRecord(
    { id: generateId('follow', name), type: 'follow' as const, platform: PLATFORM, from: profile.id },
    profile,
    { trigger: { type: 'follow', key: 'follow', value: 1 } }
  );
};

export const pushBits = async (msg: EventUser & { amount?: number; message?: string }) => {
  const name = msg.name?.trim() || 'Anonymous';
  const amount = typeof msg.amount === 'number' ? msg.amount : parseInt(String(msg.amount), 10) || 0;
  const profile = { id: userId(name), name, avatar: '', platform: PLATFORM };
  return dashboard.addRecord(
    { id: generateId('bits', name, amount), type: 'donation' as const, platform: PLATFORM, from: profile.id, amount: [amount, 'bits'], message: msg.message?.trim() || undefined },
    profile,
    { trigger: { type: 'donation', key: 'bits', value: amount } }
  );
};

export const pushRaid = async (msg: EventUser & { amount?: number }) => {
  const name = msg.name?.trim() || 'Anonymous';
  const viewers = typeof msg.amount === 'number' ? msg.amount : parseInt(String(msg.amount), 10) || 0;
  const profile = { id: userId(name), name, avatar: '', platform: PLATFORM };
  return dashboard.addRecord(
    { id: generateId('raid', name), type: 'custom' as const, platform: PLATFORM, from: profile.id, amount: [viewers, 'viewers'], message: `${viewers} viewers` },
    profile,
    { trigger: { type: 'custom', key: 'raid', value: viewers } }
  );
};

export const pushHost = async (msg: EventUser & { amount?: number }) => {
  const name = msg.name?.trim() || 'Anonymous';
  const viewers = typeof msg.amount === 'number' ? msg.amount : parseInt(String(msg.amount), 10) || 0;
  const profile = { id: userId(name), name, avatar: '', platform: PLATFORM };
  return dashboard.addRecord(
    { id: generateId('host', name), type: 'custom' as const, platform: PLATFORM, from: profile.id, amount: [viewers, 'viewers'], message: `${viewers} viewers` },
    profile,
    { trigger: { type: 'custom', key: 'host', value: viewers } }
  );
};

export const pushMerch = async (msg: EventUser & { product?: string; amount?: number; message?: string }) => {
  const name = msg.name?.trim() || 'Anonymous';
  const product = msg.product?.trim() || 'Merch';
  const price = typeof msg.amount === 'number' ? msg.amount : parseFloat(String(msg.amount)) || 0;
  const profile = { id: userId(name), name, avatar: '', platform: PLATFORM };
  return dashboard.addRecord(
    { id: generateId('merch', name, product), type: 'donation' as const, platform: PLATFORM, from: profile.id, amount: [price, 'USD'], message: product },
    profile,
    { trigger: { type: 'donation', key: 'merch', value: price } }
  );
};
