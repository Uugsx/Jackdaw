<div align="center">

<img src="desktop/build/icon-jackdaw.png" width="120" alt="Jackdaw">

# Jackdaw

**Почта · Календарь · Контакты**

Desktop-клиент для Exchange / OWA и связанных протоколов.

[![License: EUPL-1.2](https://img.shields.io/badge/License-EUPL--1.2-blue.svg)](LICENSE)
![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux%20%7C%20iOS%20%7C%20Android-lightgrey)
![Stack](https://img.shields.io/badge/stack-Electron%20%7C%20Svelte%20%7C%20TypeScript-646cff)

[Русский](#-русский) · [English](#-english) · [Сайт](https://jackdaw.app)

</div>

---

## 🇷🇺 Русский

### О проекте

**Jackdaw** — независимый почтовый клиент с календарём и адресной книгой. Работает с корпоративной почтой через Exchange, OWA, EWS, ActiveSync и Graph, а также с IMAP/JMAP и CardDAV/CalDAV.

Приложение собрано как **Electron** (desktop) и **Capacitor** (mobile) поверх единой **Svelte + TypeScript** кодовой базы.

### Возможности

| Модуль | Что умеет |
|--------|-----------|
| **Почта** | Папки, поиск, теги/категории OWA, композер, тёмная тема писем, undo удаления |
| **Календарь** | События, приглашения, онлайн-встречи |
| **Контакты** | Личные и GAL-контакты, группы |
| **Файлы** | WebDAV / Nextcloud |
| **Meet** | Видеозвонки *(proprietary)* |

### Платформы

| Платформа | Статус |
|-----------|--------|
| macOS (arm64 / universal) | ✅ основная |
| Windows / Linux | ✅ desktop |
| iOS / Android | 🚧 mobile |

### Сборка (dev)

```bash
# зависимости
(cd app && npm install)
(cd desktop && npm install)
(cd desktop/backend && npm install)

# терминал 1 — UI
cd app && npm run dev

# терминал 2 — Electron
cd desktop && npm run dev
```

**Release (macOS):**

```bash
cd app && npm run build
cd desktop && npm run build:mac
```

Подробнее: [`docs/INSTALL.md`](docs/INSTALL.md) · [`docs/systems/desktop-build/`](docs/systems/desktop-build/)

### Структура репозитория

```
app/        — Svelte UI + бизнес-логика
desktop/    — Electron shell + backend
mobile/     — Capacitor (iOS / Android)
docs/       — документация по сборке и архитектуре
lib/        — общие библиотеки (JPC protocol)
```

### Лицензия

[EUPL-1.2](LICENSE). Отдельные модули (Exchange, WebMail, Meet) — proprietary, см. заголовок LICENSE.

### Контакты

- **Сайт:** [jackdaw.app](https://jackdaw.app)
- **Репозиторий:** [github.com/Uugsx/Jackdaw](https://github.com/Uugsx/Jackdaw)

---

## 🇬🇧 English

### About

**Jackdaw** is an independent mail client with calendar and contacts. It connects to corporate mail via Exchange, OWA, EWS, ActiveSync, and Graph, as well as IMAP/JMAP and CardDAV/CalDAV.

Built as **Electron** (desktop) and **Capacitor** (mobile) on a shared **Svelte + TypeScript** codebase.

### Features

| Module | Highlights |
|--------|------------|
| **Mail** | Folders, search, OWA categories/tags, composer, dark-mode email rendering, delete undo |
| **Calendar** | Events, invitations, online meetings |
| **Contacts** | Personal & GAL contacts, groups |
| **Files** | WebDAV / Nextcloud |
| **Meet** | Video calls *(proprietary)* |

### Platforms

| Platform | Status |
|----------|--------|
| macOS (arm64 / universal) | ✅ primary |
| Windows / Linux | ✅ desktop |
| iOS / Android | 🚧 mobile |

### Build (dev)

```bash
# install dependencies
(cd app && npm install)
(cd desktop && npm install)
(cd desktop/backend && npm install)

# terminal 1 — UI
cd app && npm run dev

# terminal 2 — Electron shell
cd desktop && npm run dev
```

**Release (macOS):**

```bash
cd app && npm run build
cd desktop && npm run build:mac
```

See also: [`docs/INSTALL.md`](docs/INSTALL.md) · [`docs/systems/desktop-build/`](docs/systems/desktop-build/)

### Repository layout

```
app/        — Svelte UI + business logic
desktop/    — Electron shell + backend
mobile/     — Capacitor (iOS / Android)
docs/       — build & architecture docs
lib/        — shared libraries (JPC protocol)
```

### License

[EUPL-1.2](LICENSE). Some modules (Exchange, WebMail, Meet) are proprietary — see LICENSE header.

### Links

- **Website:** [jackdaw.app](https://jackdaw.app)
- **Repository:** [github.com/Uugsx/Jackdaw](https://github.com/Uugsx/Jackdaw)

---

<div align="center">

<sub>Jackdaw · Private repository · Maintained by <a href="https://github.com/Uugsx">Uugsx</a></sub>

</div>
