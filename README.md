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

**Jackdaw** — почтовый клиент с календарём и адресной книгой для Exchange / OWA, EWS, ActiveSync, Graph, IMAP/JMAP и CardDAV/CalDAV.

**Electron** (desktop) + **Capacitor** (mobile), UI на **Svelte + TypeScript**.

### Происхождение

Jackdaw — **продолжение и переработка** open-source почтового клиента под [EUPL-1.2](LICENSE).

Исходная кодовая база — работа **Ben Bucksch**, **Beonex GmbH** и других участников. Проект **не писался с нуля**: взята существующая основа, исправлено то, что не работало, добавлены новые возможности.

**Сейчас Jackdaw развивает [uugsx](https://github.com/Uugsx)** — ребрендинг, стабилизация, UI, протоколы OWA.

> EUPL разрешает форк и доработку. При распространении нужно сохранять лицензию и указание авторов исходника — см. [LICENSE](LICENSE).

### Главная особенность Jackdaw

**Синхронизация дополнительных OWA-ящиков** (shared / delegated mailboxes): письма, категории, уведомления — для ящиков, к которым у тебя есть делегированный доступ. Это ключевая доработка Jackdaw поверх исходного клиента.

### Возможности

| Модуль | Что умеет |
|--------|-----------|
| **Почта** | Папки, поиск, теги/категории OWA, композер, тёмная тема писем, undo удаления, **shared OWA mailboxes** |
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

[EUPL-1.2](LICENSE) — форк и доработка разрешены. Копирайт исходных авторов (Ben Bucksch, Beonex GmbH) сохранён. Отдельные модули (Exchange, WebMail, Meet) — proprietary, см. LICENSE.

### Контакты

- **Maintainer:** [uugsx](https://github.com/Uugsx)
- **Сайт:** [jackdaw.app](https://jackdaw.app)
- **Репозиторий:** [github.com/Uugsx/Jackdaw](https://github.com/Uugsx/Jackdaw)

---

## 🇬🇧 English

### About

**Jackdaw** is a mail client with calendar and contacts for Exchange / OWA, EWS, ActiveSync, Graph, IMAP/JMAP, and CardDAV/CalDAV.

**Electron** (desktop) + **Capacitor** (mobile), **Svelte + TypeScript** UI.

### Origin

Jackdaw is a **continued fork and rework** of an open-source mail client under [EUPL-1.2](LICENSE).

The original codebase is the work of **Ben Bucksch**, **Beonex GmbH**, and other contributors. Jackdaw was **not written from scratch** — the existing foundation was taken forward, broken parts were fixed, and new features were added.

**Jackdaw is now maintained by [uugsx](https://github.com/Uugsx)** — rebranding, stabilization, UI, and OWA protocol work.

> EUPL allows forking and modification. Distribution requires keeping the license and upstream attribution — see [LICENSE](LICENSE).

### Jackdaw's key differentiator

**OWA shared mailbox synchronization** (delegated / additional mailboxes): messages, categories, and notifications for mailboxes you can access on behalf of others. This is Jackdaw-specific work on top of the original client.

### Features

| Module | Highlights |
|--------|------------|
| **Mail** | Folders, search, OWA categories/tags, composer, dark-mode email rendering, delete undo, **shared OWA mailboxes** |
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

[EUPL-1.2](LICENSE) — forking and modification allowed. Original authors' copyright (Ben Bucksch, Beonex GmbH) retained. Some modules (Exchange, WebMail, Meet) are proprietary — see LICENSE.

### Links

- **Maintainer:** [uugsx](https://github.com/Uugsx)
- **Website:** [jackdaw.app](https://jackdaw.app)
- **Repository:** [github.com/Uugsx/Jackdaw](https://github.com/Uugsx/Jackdaw)

---

<div align="center">

<sub>Jackdaw · EUPL fork, maintained by <a href="https://github.com/Uugsx">uugsx</a> · Private repository</sub>

</div>
