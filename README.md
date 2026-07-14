# StreamLabs

[English](#english) | [Русский](#русский) | [Українська](#українська)

## English

### For users

StreamLabs integration: paste your **Socket API Token** and receive donations / alerts in realtime.

1. Open [StreamLabs → Settings → API Settings → API Tokens](https://streamlabs.com/dashboard#/settings/api-settings)
2. Copy **Your Socket API Token** (not the legacy API Token)
3. Paste it into the addon settings (or use **Open API Settings** in the addon)

**Install:** Settings → Addons → Install from folder (or drag-and-drop the folder/zip into the app window).

### For developers

This addon is a **TypeScript worker** integration. Entry point: `src/index.ts` (compiled to `dist/index.js`).

**Local build**

```bash
npm install
npm run build
```

Install the `dist/` folder contents (or the release zip) via StreamKit+ settings.

**Dependencies**

- [`@rocketman-streamkit/types`](https://www.npmjs.com/package/@rocketman-streamkit/types) — sandbox API typings
- [Addon developer docs](https://github.com/RocketMan-StreamKit/types)

**Manifest**

| Field | Value |
| --- | --- |
| Type | `platform.donation` |
| Permissions | NETWORK_REQUEST, NETWORK_WEBSOCKET, DASHBOARD_EVENTS, STATUS, NOTIFY |

## Русский

### Для пользователей

Интеграция StreamLabs: вставьте **Socket API Token** и получайте донаты / алерты в реальном времени.

1. Откройте [StreamLabs → Settings → API Settings → API Tokens](https://streamlabs.com/dashboard#/settings/api-settings)
2. Скопируйте **Your Socket API Token** (не legacy API Token)
3. Вставьте его в настройки аддона (или нажмите **Открыть API Settings**)

**Установка:** Настройки → Аддоны → Установить из папки (или перетащите папку/zip в окно приложения).

### Для разработчиков

Аддон — **TypeScript worker**. Точка входа: `src/index.ts` (собирается в `dist/index.js`).

**Локальная сборка**

```bash
npm install
npm run build
```

Установите содержимое `dist/` (или zip из релиза) через настройки StreamKit+.

**Зависимости**

- [`@rocketman-streamkit/types`](https://www.npmjs.com/package/@rocketman-streamkit/types) — типы sandbox API
- [Документация для разработчиков](https://github.com/RocketMan-StreamKit/types)

**Манифест**

| Поле | Значение |
| --- | --- |
| Тип | `platform.donation` |
| Права | NETWORK_REQUEST, NETWORK_WEBSOCKET, DASHBOARD_EVENTS, STATUS, NOTIFY |

## Українська

### Для користувачів

Інтеграція StreamLabs: вставте **Socket API Token** і отримуйте донати / алерти в реальному часі.

1. Відкрийте [StreamLabs → Settings → API Settings → API Tokens](https://streamlabs.com/dashboard#/settings/api-settings)
2. Скопіюйте **Your Socket API Token** (не legacy API Token)
3. Вставте його в налаштування аддона (або натисніть **Відкрити API Settings**)

**Встановлення:** Налаштування → Аддони → Встановити з папки (або перетягніть папку/zip у вікно програми).

### Для розробників

Аддон — **TypeScript worker**. Вхідна точка: `src/index.ts` (збирається в `dist/index.js`).

**Локальна збірка**

```bash
npm install
npm run build
```

Встановіть вміст `dist/` (або zip з релізу) через налаштування StreamKit+.

**Залежності**

- [`@rocketman-streamkit/types`](https://www.npmjs.com/package/@rocketman-streamkit/types) — типи sandbox API
- [Документація для розробників](https://github.com/RocketMan-StreamKit/types)

**Маніфест**

| Поле | Значення |
| --- | --- |
| Тип | `platform.donation` |
| Права | NETWORK_REQUEST, NETWORK_WEBSOCKET, DASHBOARD_EVENTS, STATUS, NOTIFY |
