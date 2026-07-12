# StreamLabs

[English](#english) | [Русский](#русский) | [Українська](#українська)

## English

### For users

StreamLabs integration: OAuth login and donation alerts via API polling.

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
| Permissions | NETWORK_REQUEST, WEB_END_POINTS, DASHBOARD_EVENTS, STATUS, NOTIFY |

## Русский

### Для пользователей

Интеграция StreamLabs: OAuth-авторизация и донаты через API.

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
| Права | NETWORK_REQUEST, WEB_END_POINTS, DASHBOARD_EVENTS, STATUS, NOTIFY |

## Українська

### Для користувачів

Інтеграція StreamLabs: OAuth-авторизація та донати через API.

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
| Права | NETWORK_REQUEST, WEB_END_POINTS, DASHBOARD_EVENTS, STATUS, NOTIFY |
