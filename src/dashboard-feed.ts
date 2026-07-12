import { PLATFORM } from './constants';
import type { StreamLabsDonation } from './api';

const userId = (name: string) => `streamlabs:${name.trim().toLowerCase()}`;

const buildMessage = (payload: StreamLabsDonation) => {
  return payload.message?.trim() || '';
};

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
      type: 'donation',
      platform: PLATFORM,
      from: profile.id,
      amount: [amount, currency],
      message: buildMessage(payload) || undefined,
    },
    profile,
    { trigger: { type: 'donation', key: currency, value: amount } }
  );
};
