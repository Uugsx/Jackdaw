# QA-отчёт — исходный прогон, исправления и ретест

Дата: 27.08.2026
Контур: macOS, установленный `Jackdaw.app` `0.9.38-dev`, локальный frontend на `5456`
Режим: exploratory, negative, integration, UI/UX, security-safe review

## 1. Итог

`QA RESULT: NOT READY`

В ходе аудита исправлены BUG-001, BUG-002, BUG-003, BUG-004, BUG-005, BUG-006 и BUG-007, а также TEST-INFRA-001. BUG-003 локализован в fallback shared-folder polling, BUG-006 — в сортированной вставке новых OWA-сообщений, BUG-007 — в неполном reconciliation после уменьшения серверного счётчика. Исправления подтверждены source-тестами/runtime. Общий статус остаётся `NOT READY`: установленный `.app` ещё не пересобран после исправлений, а quality gate текущего рабочего дерева не проходит из-за baseline-ошибок `svelte-check`, desktop typecheck и полного Vitest suite.

## 2. Покрытие и статистика

- Test cases: 31.
- Исходный прогон: PASS 18, FAIL 8, BLOCKED 2; BUG-006 добавлен по отдельному воспроизведению.
- Финальный ретест: PASS 24 + отдельные regression tests BUG-006 и BUG-007, FAIL 3, BLOCKED 2.
- Продуктовые дефекты: 7; все исправлены в source, packaged desktop artifact pending retest.
- Дефекты test harness: 1; исправлен.
- Деструктивные и внешние действия не выполнялись.

Полная матрица покрытия находится в [QA_MATRIX.md](./QA_MATRIX.md), пошаговые сценарии — в [TEST_CASES.md](./TEST_CASES.md), карточки дефектов — в [BUG_REPORT.md](./BUG_REPORT.md).

## 3. Что протестировано

- Desktop startup и cached mail: папки, дерево, три вида списка, chat-like view, фильтры, сортировка, открытие письма, HTML/plaintext.
- Contacts: Unicode-поиск и отсутствие совпадений.
- Calendar: навигация по датам и выбор вида.
- Files: empty-state, выбор протокола, формы WebDAV, пароль и негативная валидация.
- Settings: Appearance, Notifications, Read, Send, Categories.
- Автоматические проверки frontend build, Svelte check, desktop typecheck, полного Vitest и WebDAV integration suite.

## 4. Выполненные исправления

- BUG-001: desktop-, mobile- и search-entry points передают list-компонентам явный `emptyDueToFilter`, поэтому пустая папка и пустой результат поиска показывают разные состояния. Добавлен компонентный regression test для table и vertical видов.
- BUG-002: добавлен общий валидатор HTTP(S) URL с trimming; для WebDAV, CalDAV и CardDAV обязательны имя, URL, username и пароль. Добавлены 10 unit-проверок URL и выполнен source UI retest disabled/enabled transitions.
- BUG-004: добавлены source English и Russian значения новых empty-state message IDs.
- BUG-005: DAV-формы получили корректные и уникальные label/control associations; общий Password-компонент поддерживает переданный `id`.
- BUG-003: fallback shared-folder polling обращался к `ArrayColl` через
  `rotating[index]`, что давало `undefined` и последующий runtime TypeError.
  Использован `rotating.at(index)`, polling offset нормализуется после
  изменения размера иерархии, добавлен regression test.
- BUG-006: `OWAFolder.addMessagesIfAbsent()` добавлял новые письма через
  `SortedCollection.add()`, который дописывает элемент в конец и не применяет
  сортировку. Новые письма теперь вставляются batch-операцией `addAll()`, а
  повторные ItemId отбрасываются; добавлен `messageCollection.test.ts`.
- BUG-007: при уменьшении серверного `TotalCount` быстрый sync теперь выполняет
  полный `FindItem` reconciliation и удаляет из локальной коллекции/хранилища
  письмо, исчезнувшее из «Входящих». Также обрабатывается уже сохранённый
  случай, когда локальных писем больше серверного счётчика; unread-fetch не
  обходит обязательное удаление. Добавлен `deletionSync.test.ts`.
- TEST-INFRA-001: test double получил безопасный временный файловый backend; исправлено имя `createSubDirectory`. WebDAV suite после этого прошёл полностью.

## 5. Результаты ретеста

- Targeted regression suite: 8 файлов, 46/47 тестов прошли; единственный сбой
  — существующий `galSearch.test.ts` для альтернативного EWS-адреса, не
  связанный с OWA-синхронизацией.
  - `app/test/logic/Mail/OWA/listFolders.test.ts` — 3 теста, включая BUG-003.
  - `app/test/frontend/Setup/validateServerURL.test.ts` — 10 тестов.
  - `app/test/frontend/Mail/emptyState.test.ts` — 3 теста.
  - `app/test/logic/Files/WebDAV/WebDAV.test.ts` — 9 тестов.
  - OWA/EWS contacts and shared-mailbox regression tests — 18/19 тестов;
    один старый `galSearch`-сценарий падает на альтернативном EWS-адресе.
- BUG-006 focused regression: `app/test/logic/Mail/OWA/messageCollection.test.ts` — 1/1 тест прошёл; вместе с ранее проверенной OWA-регрессией покрытие этого участка составляет 4/4 теста.
- BUG-007 focused regression: `app/test/logic/Mail/OWA/deletionSync.test.ts` — 2/2 теста прошли; полный OWA regression suite — 6/6.
- `rtk npm run build` в `app`: PASS; преобразовано 3699 модулей. Сохраняются предупреждения legacy decorators/sourcemap, asset resolution, динамических импортов, крупных chunks и отсутствующего Sentry auth token.
- `rtk npm run build` в `desktop`: PASS; Electron main/preload/renderer собраны. Сохраняются предупреждения legacy decorators/sourcemap, динамических импортов и отсутствующего Sentry auth token.
- Source desktop runtime через JPC с cached OWA mail: BUG-003 не воспроизведён после старта, двух фоновых циклов, ручного `Получить почту` и дополнительного наблюдения.
- `rtk npm run check` в `app`: FAIL — 340 ошибок и 102 предупреждения в 188 файлах текущего рабочего дерева.
- `rtk npm run typecheck` в `desktop`: FAIL — многочисленные ошибки в backend/main и legacy-библиотеках.
- Полный Vitest: FAIL — 51 test files failed, 77 passed; 39 tests failed, 418 passed, 6 skipped (128 files, 463 tests). Оставшиеся падения относятся к baseline/окружению (ICal serialization, EWS GAL, S/MIME remoteApp и другие существующие сценарии), новые OWA-тесты проходят.
- `rtk git diff --check` для всех затронутых QA-файлов: PASS. Полная проверка dirty tree завершилась кодом 2 без диагностического вывода, поэтому не засчитывается как PASS.
- В `app` нет отдельных scripts `lint`/`format`; безопасный отдельный Prettier check не доступен в установленном runtime. Write-mode форматирование всего dirty tree не выполнялось.

## 6. Открытые риски и ограничения

- Установленный `.app` до фикса воспроизводил BUG-003 и BUG-006; BUG-007 подтверждён сообщением пользователя и source regression tests. После фиксов packaged desktop artifact нужно пересобрать, установить и повторить TC-001, TC-030 и TC-031.
- В source runtime остаётся отдельное состояние `Пожалуйста, войдите в систему` для OWA-сессии; это не raw TypeError BUG-003 и не смешивается с ним в отчёте.
- Прямой запуск frontend без JPC-secret остаётся заблокирован ожидаемым handshake-ограничением; полноценный source desktop runtime с JPC-secret для BUG-003 проверен отдельно.
- External-content сценарий намеренно заблокирован: его запуск на production-письме мог бы передать сетевые метаданные третьей стороне.
- Установленный `.app` не был пересобран и поэтому не использовался как доказательство отображения новых source locale после фикса; это компенсировано source component test, проверкой каталогов и успешной сборкой.
- Большой dirty working tree содержит сторонние baseline-изменения; они не откатывались и не форматировались массово.

## 7. Рекомендации перед READY

1. Пересобрать desktop-артефакт, установить его и повторить TC-001 для финального подтверждения packaged `.app`.
2. Разобрать baseline-ошибки `svelte-check`, desktop typecheck и полный Vitest suite либо зафиксировать совместимый профиль зависимостей/окружения.
3. Отдельно проверить восстановление OWA-сессии и ожидаемое UX-поведение сообщения `Пожалуйста, войдите в систему`.

QA RESULT:

NOT READY
