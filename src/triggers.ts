const currencyOption = (code: string) => ({
  value: code,
  label: { en: code, ru: code, uk: code },
});

const STREAMLABS_CURRENCY_OPTIONS = [
  'AUD',
  'BRL',
  'CAD',
  'CHF',
  'EUR',
  'GBP',
  'INR',
  'JPY',
  'MXN',
  'NOK',
  'NZD',
  'PLN',
  'RUB',
  'SEK',
  'TRY',
  'UAH',
  'USD',
  'ZAR',
].map(currencyOption);

export const registerStreamLabsOverlayTriggers = () => {
  return dashboard.registerTriggers([
    {
      type: 'donation',
      label: {
        en: 'Donation',
        ru: 'Донат',
        uk: 'Донат',
      },
      valueType: 'number',
      keyOptions: STREAMLABS_CURRENCY_OPTIONS,
      keyLabel: {
        en: 'Currency',
        ru: 'Валюта',
        uk: 'Валюта',
      },
      valueHint: {
        en: 'Donation amount',
        ru: 'Сумма доната',
        uk: 'Сума донату',
      },
    },
  ]);
};
