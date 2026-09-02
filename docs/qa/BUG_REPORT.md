# Отчёт о дефектах

## BUG-001 — Неверный empty-state при фильтре без результатов

Severity:

Major

Priority:

High

Status:

Resolved

Environment:

- macOS, установленный Jackdaw `0.9.38-dev`.
- Mail → Vertical view.
- Папка с сообщениями, не соответствующими фильтру.

Preconditions:

- В выбранной папке есть сообщения.
- Активирован быстрый фильтр `Непрочитанные`, но совпадений нет.

Steps to reproduce:

1. Открыть папку с прочитанными сообщениями.
2. Добавить и активировать `Непрочитанные`.
3. Проверить empty-state списка.

Expected:

- Сообщение о том, что ни одно письмо не соответствует фильтрам.
- Подсказка очистить фильтры.

Actual:

- Отображается `This folder is empty` и подсказка написать письмо/получить почту.
- После исправления list-компоненты получают явный признак результата фильтра и показывают состояние отсутствия совпадений.

Evidence:

- Accessibility tree desktop-клиента: `This folder is empty` после применения фильтра.
- В коде list-компонентов ветка выбирается по `messages?.length`; у пустого результата поиска длина равна 0.
- Регрессионный `app/test/frontend/Mail/emptyState.test.ts`: оба вида списка проверяют filter-empty-state и отдельно состояние пустой папки.
- Desktop-, mobile- и search-entry points передают признак активного результата фильтра в общий vertical list.

Probable cause:

- Компонент списка получает только результирующую коллекцию и не отличает пустую папку от пустой коллекции после фильтрации.

Affected code:

- `app/frontend/Mail/3pane/TableMessageList.svelte`
- `app/frontend/Mail/Vertical/VerticalMessageList.svelte`
- `app/frontend/Mail/3pane/3Pane.svelte`
- `app/frontend/Mail/Vertical/VerticalLayout.svelte`
- `app/frontend/Mail/Vertical/MessageListM.svelte`
- `app/frontend/Mail/Search/SearchM.svelte`
- `app/frontend/Mail/Search/SearchResultsM.svelte`

## BUG-002 — WebDAV «Далее» активируется для невалидного URL и пустого пароля

Severity:

Major

Priority:

High

Status:

Resolved

Environment:

- macOS, установленный Jackdaw `0.9.38-dev`.
- Files → Cloud storage → Add account → WebDAV.

Preconditions:

- Открыта форма WebDAV.

Steps to reproduce:

1. Ввести имя аккаунта.
2. Ввести `not-a-url` в Server URL.
3. Ввести username.
4. Оставить пароль пустым.

Expected:

- Кнопка `Далее` disabled до валидного `http/https` URL и заполнения пароля.

Actual:

- Кнопка `Далее` enabled.
- После исправления для невалидного URL или пустого пароля кнопка остаётся disabled; для HTTP(S) URL и заполненного пароля становится доступной.

Evidence:

- Accessibility state формы после заполнения безопасных тестовых значений показывает активную кнопку Next.
- `WebDAVSetup.svelte` проверяет только `name`, `url` и `username`.
- Source UI retest подтвердил disabled/enabled transitions; `app/test/frontend/Setup/validateServerURL.test.ts` — 10/10 проверок.

Probable cause:

- Валидация формы проверяет непустую строку, но не формат URL и не обязательное поле password.

Affected code:

- `app/frontend/Setup/Files/WebDAVSetup.svelte`
- `app/frontend/Setup/Calendar/CalDAVSetup.svelte`
- `app/frontend/Setup/Contacts/CardDAVSetup.svelte`
- `app/frontend/Setup/Shared/validateServerURL.ts`

## BUG-003 — Runtime-ошибка в состоянии почтового аккаунта

Severity:

Major

Priority:

High

Status:

Resolved in source; packaged `.app` pending rebuild/retest

Environment:

- macOS, source desktop runtime с cached OWA mail.
- Mail → Vertical view.
- Основной OWA-аккаунт и dependent shared account.
- До исправления установленный Jackdaw `0.9.38-dev` воспроизводил дефект.

Preconditions:

- В рабочем состоянии присутствует аккаунт, который не завершил синхронизацию.

Steps to reproduce:

1. Открыть Mail.
2. Переключить вид списка или дождаться обновления списка аккаунтов.
3. Проверить accessibility tree и состояние аккаунта.

Expected:

- Ошибка синхронизации представлена безопасным пользовательским сообщением, без необработанного JavaScript exception.

Actual:

- В исходном прогоне для dependent shared account отображалось сообщение
  `Cannot read properties of undefined (reading 'id')`.
- После исправления source runtime сообщение не появляется при старте, после
  фоновых циклов, ручного `Получить почту` и повторного наблюдения.

Evidence:

- Accessibility tree контейнера account list.
- Source DevTools stack: `OWAAccount.refreshAllFolderCounts`, fallback-ветка
  `rotating[index]`.
- `rotating` является `svelte-collections` `ArrayColl`; числовой доступ через
  `rotating[index]` не возвращает элемент, поэтому далее читался `.id` у
  `undefined`.
- Регрессионный тест на stale polling offset и fallback collection access
  проходит; OWA regression file: 3/3.
- Live source retest: raw TypeError не появился во всех проверенных циклах.

Probable cause:

- Fallback shared-folder polling обращался к `ArrayColl` как к обычному
  массиву. Дополнительно курсор нормализован на случай уменьшения иерархии
  папок между циклами.

Resolution:

- В `refreshAllFolderCounts()` используется `rotating.at(index)` и безопасно
  нормализуется polling offset.
- Добавлен регрессионный unit-тест, который воспроизводит stale offset и
  проверяет отсутствие runtime exception.

Affected code:

- `app/logic/Mail/OWA/OWAAccount.ts`
- `app/test/logic/Mail/OWA/listFolders.test.ts`

## BUG-004 — Новые empty-state строки не переведены на русский

Severity:

Minor

Priority:

Medium

Status:

Resolved

Environment:

- UI locale: Russian.
- Mail list empty-state.

Preconditions:

- Открыта пустая папка или список после фильтра.

Steps to reproduce:

1. Выбрать русский язык интерфейса.
2. Открыть пустую папку или применить фильтр без совпадений.

Expected:

- Заголовок и подсказка отображаются по-русски.

Actual:

- Видны английские строки `This folder is empty`, `Write a new email or get mail from the server.` и связанные новые empty-state сообщения.
- После исправления соответствующие IDs добавлены в English и Russian catalogs; русские значения проверены в source tree, а production build завершился успешно.

Evidence:

- Accessibility tree установленного клиента и локального frontend.
- В `app/l10n/locales/ru/messages.json` отсутствуют соответствующие message IDs на момент исходного прогона.
- В `app/l10n/locales/ru/messages.json` присутствуют русские значения `bFaFSm`, `gHGd4g`, `TIDZXO`, `b7iPqK`; в `messages.json` добавлены source English values.

Probable cause:

- Строки добавлены через `$t`, но не были добавлены в source/ru locale catalogs.

Affected code:

- `app/frontend/Mail/3pane/TableMessageList.svelte`
- `app/frontend/Mail/Vertical/VerticalMessageList.svelte`
- `app/l10n/locales/en/messages.json`
- `app/l10n/locales/ru/messages.json`

## Техническое замечание TEST-INFRA-001 — WebDAV test harness не соответствует API

Severity:

Major

Priority:

High

Status:

Resolved

Environment:

- Vitest в `app`.

Описание:

- Штатный WebDAV integration test проходит 4/9 проверок.
- Пять проверок не доходят до production assertions: test double не предоставляет `remoteApp.getFilesDir`, а тест вызывает `createSubdirectory`, тогда как production API называется `createSubDirectory`.

Решение:

- Harness исправлен минимально: добавлен безопасный временный файловый backend в test double и использовано актуальное имя production API.
- Повторный прогон `WebDAV.test.ts` прошёл 9/9; дефект production WebDAV implementation не подтверждён.

## BUG-005 — Подписи полей DAV-форм не связаны с контролами

Severity:

Minor

Priority:

Medium

Status:

Resolved

Environment:

- Source frontend: формы WebDAV, CalDAV и CardDAV.

Steps to reproduce:

1. Открыть любую DAV-форму.
2. Проверить `label[for]` и `id` у полей имени, URL, username и password.

Expected:

- Каждая подпись однозначно связана со своим полем; навигация и озвучивание поля доступны вспомогательным технологиям.

Actual:

- В исходном состоянии у CalDAV/CardDAV несколько подписей указывали на `for="name"`, а поля не имели соответствующих `id`.
- После исправления все три формы используют уникальные пары `label[for]`/`id`; компонент Password принимает и устанавливает переданный `id`.

Evidence:

- Source-аудит разметки форм.
- Source UI retest: поля распознаются по ожидаемым именам, а кнопка `Следующий` учитывает невалидный/валидный URL.
- `rtk npm run build` в `app` завершён успешно.

Affected code:

- `app/frontend/Setup/Shared/Password.svelte`
- `app/frontend/Setup/Files/WebDAVSetup.svelte`
- `app/frontend/Setup/Calendar/CalDAVSetup.svelte`
- `app/frontend/Setup/Contacts/CardDAVSetup.svelte`

## BUG-006 — Новое письмо не появляется в открытом списке до перезапуска

Severity:

Major

Priority:

High

Status:

Resolved in source; packaged `.app` pending rebuild/retest

Environment:

- macOS, source desktop runtime с OWA-аккаунтом.
- Открыта папка «Входящие».

Steps to reproduce:

1. Открыть «Входящие» и оставить папку открытой.
2. Доставить новое письмо на этот почтовый адрес.
3. Дождаться обновления счётчика непрочитанных/общего количества.
4. Проверить верхнюю часть списка писем без перезапуска приложения.

Expected:

- Новое письмо появляется в открытом списке сразу после синхронизации.

Actual:

- Счётчик обновляется, но новое письмо добавляется в конец списка и не видно
  в текущей области списка. После переоткрытия приложения письмо становится
  видимым, потому что локальная загрузка заново сортирует коллекцию.

Evidence:

- Source runtime воспроизвёл рассинхронизацию: счётчик и длина локальной
  коллекции увеличились, а верхний элемент списка остался прежним.
- `EMailCollection` наследует `SortedCollection`: `addAll()` вставляет элементы
  по сортировке, а унаследованный `add()` просто дописывает элемент в конец.
- Регрессионный тест `app/test/logic/Mail/OWA/messageCollection.test.ts`
  проверяет сортировку нового письма и защиту от повторного ItemId.

Probable cause:

- `OWAFolder.addMessagesIfAbsent()` использовал `messages.add()` для новых
  писем, обходя сортированную вставку коллекции.

Resolution:

- Новые OWA-письма собираются в один batch и добавляются через
  `messages.addAll()`, поэтому они сразу попадают на правильную позицию.
- Повторяющиеся ItemId внутри одного ответа отфильтровываются до вставки.

Affected code:

- `app/logic/Mail/OWA/OWAFolder.ts`
- `app/test/logic/Mail/OWA/messageCollection.test.ts`

## BUG-007 — Письмо, удалённое в OWA, остаётся во «Входящих»

Severity:

Major

Priority:

High

Status:

Resolved in source; packaged `.app` pending rebuild/retest

Environment:

- macOS, OWA-аккаунт в Jackdaw.
- Одно и то же почтовое хранилище открыто в OWA и в Jackdaw.

Steps to reproduce:

1. Открыть в Jackdaw папку «Входящие».
2. Удалить письмо этого аккаунта в OWA.
3. Дождаться обновления счётчиков в Jackdaw.
4. Проверить «Входящие» и «Корзину» без перезапуска приложения.

Expected:

- Письмо исчезает из «Входящих».
- Письмо появляется в «Корзине».
- Счётчики обеих папок соответствуют серверу.

Actual:

- Счётчики обновлялись корректно, а письмо оставалось в локальном списке
  «Входящих» и одновременно появлялось в «Корзине».
- После перезапуска локальный список пересобирался и устаревшая запись исчезала.

Probable cause:

- При уменьшении серверного `TotalCount` быстрый OWA-sync выполнял только
  просмотр последних писем. Удаления из этого окна не обнаруживались, а флаг
  уменьшения счётчика терялся из-за проверки `dirty` раньше reconciliation.
- Уже сохранённое рассинхронизированное состояние также не проверяло случай,
  когда локальных писем больше серверного счётчика.

Resolution:

- При уменьшении счётчика или обнаружении избытка локальных писем выполняется
  полный `FindItem` reconciliation, который удаляет отсутствующие на сервере
  записи из коллекции и локального хранилища.
- Быстрый unread-fetch не обходится, если одновременно требуется удалить
  локальную запись.

Evidence:

- `app/test/logic/Mail/OWA/deletionSync.test.ts` — 2 регрессионных теста:
  живое уменьшение счётчика и восстановление уже сохранённого stale-состояния.
- Targeted OWA suite: 6/6 тестов прошли.
- Frontend build завершился успешно.

Affected code:

- `app/logic/Mail/OWA/OWAFolder.ts`
- `app/test/logic/Mail/OWA/deletionSync.test.ts`
