# Тест-кейсы Jackdaw

Исходный прогон и ретест выполнены 27.08.2026 на macOS в установленном `Jackdaw.app` версии `0.9.38-dev` и в локальном frontend-dev-сервере на порту `5456`. Для проверки UI использовался доступный тестовый аккаунт с уже закэшированными данными. Отправка писем, удаление, перемещение, добавление аккаунтов и другие необратимые действия не выполнялись.

## TC-001 — Запуск desktop-клиента и отображение почты

Priority: High  
Type: Functional / Integration

Preconditions:

- Установленный desktop-клиент запущен.
- В приложении есть локально закэшированное состояние почты.

Steps:

1. Получить состояние окна Jackdaw.
2. Проверить app bar, список аккаунтов/папок и область списка сообщений.

Expected Result:

- Приложение открывается без блокирующего экрана.
- Почтовый интерфейс и закэшированные данные отображаются.

Actual Result:

- В исходном прогоне почта отображалась, но у shared-account появлялась ошибка
  `Cannot read properties of undefined (reading 'id')`.
- После исправления source runtime открывается с cached mail без этой ошибки;
  она не появилась после двух фоновых циклов, ручного `Получить почту` и
  дополнительного наблюдения.
- Отдельно наблюдалось сообщение авторизации `Пожалуйста, войдите в систему`;
  оно не является BUG-003 и требует отдельного решения по сессии аккаунта.

Status:

PASS (BUG-003 исправлен в source runtime; установленный `.app` требует пересборки и повторной установки)

## TC-002 — Запуск frontend без JPC-secret

Priority: Medium  
Type: Negative / Integration

Preconditions:

- Локальный frontend запущен без hash-параметра JPC-secret.

Steps:

1. Открыть `http://localhost:5456/#/mail`.
2. Проверить состояние приложения и уведомления.

Expected Result:

- Пользователь получает понятное сообщение о необходимости desktop/backend-соединения.
- Приложение не падает.

Actual Result:

- Shell отображается, но показывается сообщение `No JPC secret was passed in the frontend URL`.
- Проверка полноценного mail-flow в этом контуре невозможна.

Status:

BLOCKED (ограничение локального окружения, не дефект desktop-конфигурации)

## TC-003 — Переключение почтовых папок

Priority: High  
Type: Functional / UI

Preconditions:

- Desktop-клиент открыт в разделе Mail.

Steps:

1. Выбрать доступную папку с сообщениями.
2. Выбрать пустую папку.
3. Вернуться в папку с сообщениями.

Expected Result:

- Список и заголовок соответствуют выбранной папке.
- Выбранное сообщение сбрасывается при смене папки.

Actual Result:

- Навигация работает, содержимое меняется.
- В исходном прогоне в пустой папке отображался empty-state с английским текстом.
- Ретест: русские значения для empty-state добавлены в source locale catalog, frontend build проходит; ранее проверенная навигация по папкам остаётся рабочей. Полный mail-flow обновлённого desktop-артефакта в локальном frontend-контуре ограничен отсутствием JPC-secret.

Status:

PASS (ретест source catalog и build; runtime обновлённого desktop-артефакта ограничен окружением)

## TC-004 — Разворачивание и сворачивание дерева папок

Priority: Medium  
Type: UI

Preconditions:

- Открыта почта с несколькими папками.

Steps:

1. Нажать кнопку разворачивания списка папок.
2. Проверить дополнительные папки.
3. Свернуть список.

Expected Result:

- Дерево раскрывается и закрывается без потери выбранной папки.

Actual Result:

- Сценарий выполнен успешно.

Status:

PASS

## TC-005 — Переключение видов списка почты

Priority: High  
Type: Functional / UI

Preconditions:

- Открыта папка с сообщениями.

Steps:

1. Переключить `Вертикальный вид`.
2. Переключить `Широкий табличный вид`.
3. Переключить `Классический 3-панельный вид`.

Expected Result:

- Каждый вид отображает список и область просмотра без потери данных.

Actual Result:

- Все три вида открываются, строки и область просмотра отображаются.

Status:

PASS

## TC-006 — Режим «Вид чата» для почты

Priority: Medium  
Type: Functional / UI

Preconditions:

- В аккаунте есть сообщения с контактами.

Steps:

1. Нажать `Вид чата`.
2. Проверить список контактов и отсутствие блокирующего исключения.

Expected Result:

- Отображаются группы/контакты, приложение остаётся интерактивным.

Actual Result:

- Список контактов отображается; правая область ожидает выбор контакта.

Status:

PASS

## TC-007 — Открытие меню быстрых фильтров

Priority: High  
Type: Functional / UI

Preconditions:

- Открыта папка с сообщениями.

Steps:

1. Нажать `+` в панели быстрых фильтров.
2. Проверить пункты `Непрочитанные`, `С ответом`, `По отправителю`, `По теме`, `Сбросить фильтры`.
3. Добавить и удалить фильтр.

Expected Result:

- Меню открывается, фильтр добавляется в панель и удаляется без ошибки.

Actual Result:

- Меню и операции добавления/удаления работают.

Status:

PASS

## TC-008 — Фильтр без совпадений

Priority: High  
Type: Functional / Negative / UI

Preconditions:

- Выбрана папка, в которой есть только прочитанные сообщения.

Steps:

1. Добавить фильтр `Непрочитанные`.
2. Активировать фильтр.
3. Проверить empty-state списка и доступность очистки фильтра.

Expected Result:

- Показано `Нет сообщений, соответствующих этим фильтрам` и подсказка очистить фильтры.

Actual Result:

- В исходном прогоне при нулевом результате показывалось `This folder is empty` и предложение написать письмо/получить почту.
- Ретест: в desktop-, mobile- и search-entry points добавлено явное различение пустой папки и пустого результата фильтра. Регрессионный component test подтверждает заголовок о несовпадении фильтров и подсказку очистить фильтры для обоих list-компонентов.

Status:

PASS

## TC-009 — Очистка быстрого фильтра

Priority: High  
Type: Functional / Regression

Preconditions:

- Активен фильтр `Непрочитанные`.

Steps:

1. Нажать `Очистить`.
2. Проверить список сообщений.

Expected Result:

- Все сообщения исходной папки снова доступны.
- Активный фильтр снят.

Actual Result:

- Список возвращается, кнопка очистки исчезает.

Status:

PASS

## TC-010 — Сортировка по дате

Priority: High  
Type: Functional / UI

Preconditions:

- Открыта папка с несколькими сообщениями.

Steps:

1. Выбрать `Старые`.
2. Проверить порядок видимых строк.
3. Выбрать `Новые`.

Expected Result:

- Сначала отображаются самые старые, затем самые новые сообщения соответственно.

Actual Result:

- Порядок меняется на возрастающий и обратно на убывающий.

Status:

PASS

## TC-011 — Сортировка по отправителю

Priority: Medium  
Type: Functional / UI

Preconditions:

- Открыта папка с сообщениями нескольких отправителей.

Steps:

1. Добавить/активировать `По отправителю`.
2. Проверить порядок видимого диапазона.

Expected Result:

- Видимый диапазон упорядочен по имени/адресу контакта, без runtime-ошибки.

Actual Result:

- Видимый диапазон упорядочен, переключение не приводит к падению списка.

Status:

PASS

## TC-012 — Открытие письма из списка

Priority: High  
Type: Functional / UI

Preconditions:

- В папке есть отправленное прочитанное сообщение.

Steps:

1. Выбрать сообщение.
2. Проверить заголовок, тело и toolbar.

Expected Result:

- Письмо открывается, данные не повреждаются, доступны действия просмотра.

Actual Result:

- Письмо открылось и отобразилось.

Status:

PASS

## TC-013 — Переключение HTML/plaintext при просмотре письма

Priority: Medium  
Type: Functional / Security

Preconditions:

- Открыто письмо с телом.

Steps:

1. Выбрать `Plaintext`.
2. Проверить отображение.
3. Вернуться к `Форматированному` виду.

Expected Result:

- Режим меняется без потери тела письма.

Actual Result:

- Оба режима переключаются и отображают тело.

Status:

PASS

## TC-014 — Внешний контент письма

Priority: High  
Type: Security / Negative

Preconditions:

- Открыто письмо, потенциально содержащее внешний контент.

Steps:

1. Проверить переключатель внешнего контента.
2. Не активировать загрузку внешних ресурсов в production-данных.

Expected Result:

- Режим можно оценить в изолированном тестовом письме без передачи telemetry/IP третьей стороне.

Actual Result:

- Полный сценарий заблокирован отсутствием изолированного письма; действие, которое может загрузить внешний ресурс, не выполнялось.

Status:

BLOCKED

## TC-015 — Поиск контакта с Unicode и отсутствующим результатом

Priority: Medium  
Type: Negative / UI

Preconditions:

- Открыт раздел Contacts.

Steps:

1. Ввести безопасную строку `___qa-no-match-☃___`.
2. Проверить empty-state.
3. Очистить поиск.

Expected Result:

- Спецсимволы принимаются, отсутствие результата не вызывает исключения, очистка возвращает список.

Actual Result:

- Сценарий выполнен успешно.

Status:

PASS

## TC-016 — Навигация календаря по дням

Priority: High  
Type: Functional / UI

Preconditions:

- Открыт Calendar.

Steps:

1. Нажать предыдущий день.
2. Нажать следующий день.
3. Нажать `Сегодня`.

Expected Result:

- Диапазон дат меняется и возвращается к текущему дню.

Actual Result:

- Навигация работает, исключений не обнаружено.

Status:

PASS

## TC-017 — Переключение вида календаря

Priority: Medium  
Type: Functional / UI

Preconditions:

- Открыт Calendar.

Steps:

1. Открыть меню вида.
2. Выбрать `Месяц`.
3. Проверить сетку календаря.

Expected Result:

- Меню содержит доступные виды, выбранный вид отображается корректно.

Actual Result:

- Меню открывается, месячная сетка отображается.

Status:

PASS

## TC-018 — Files без настроенных аккаунтов

Priority: Medium  
Type: Functional / Empty state

Preconditions:

- В Files нет настроенных cloud-аккаунтов.

Steps:

1. Открыть Files.
2. Открыть Cloud storage.
3. Проверить empty-state и кнопку добавления аккаунта.

Expected Result:

- Показано понятное состояние отсутствия аккаунтов и доступна настройка.

Actual Result:

- Empty-state и `Добавить аккаунт…` отображаются.

Status:

PASS

## TC-019 — Выбор протокола файлового аккаунта

Priority: Medium  
Type: Functional / UI

Preconditions:

- Открыта форма добавления Files-аккаунта.

Steps:

1. Проверить Nextcloud по умолчанию.
2. Переключить WebDAV.
3. Перейти далее.

Expected Result:

- Выбор протокола меняется, открывается соответствующая форма.

Actual Result:

- WebDAV выбирается, форма WebDAV открывается.

Status:

PASS

## TC-020 — Валидация WebDAV URL и обязательных полей

Priority: High  
Type: Negative / Security / UI

Preconditions:

- Открыта форма WebDAV.

Steps:

1. Ввести безопасное имя аккаунта и username.
2. Ввести `not-a-url` в Server URL.
3. Оставить пароль пустым.
4. Проверить кнопку `Далее`.

Expected Result:

- Переход невозможен до ввода URL с поддерживаемой схемой и пароля.

Actual Result:

- В исходном прогоне кнопка `Далее` становилась активной уже при заполнении имени, URL и username.
- Ретест source UI: для `not-a-url` и пустого пароля кнопка остаётся disabled; после валидного HTTPS URL и заполнения пароля становится active. Unit test валидатора URL: 10/10.

Status:

PASS

## TC-021 — Показать/скрыть пароль WebDAV

Priority: Medium  
Type: Functional / UI

Preconditions:

- Открыта форма WebDAV.

Steps:

1. Нажать кнопку показа пароля.
2. Проверить смену label на `Скрыть пароль`.

Expected Result:

- Значение переключается между скрытым и видимым режимами.

Actual Result:

- Label и режим поля меняются.

Status:

PASS

## TC-022 — Переключение темы и возврат к System

Priority: Low  
Type: UI / Regression

Preconditions:

- Открыты Settings → Appearance.

Steps:

1. Выбрать Dark.
2. Проверить визуальное состояние.
3. Вернуть System.

Expected Result:

- Тема меняется и возвращается к системной.

Actual Result:

- Переключение работает.

Status:

PASS

## TC-023 — Настройки уведомлений, чтения и отправки

Priority: Medium  
Type: UI / Regression

Preconditions:

- Открыты соответствующие категории Settings.

Steps:

1. Открыть Notifications, Read, Send.
2. Переключить доступные checkbox/radio.
3. Вернуть исходные значения.

Expected Result:

- Элементы интерактивны, состояние сохраняется без ошибок.

Actual Result:

- Переключатели работают, исходные значения восстановлены.

Status:

PASS

## TC-024 — WebDAV integration test: файловый CRUD-flow

Priority: High  
Type: Integration / Regression

Preconditions:

- Запускается штатный `app/test/logic/Files/WebDAV/WebDAV.test.ts`.

Steps:

1. Запустить тест с `--run`.
2. Проверить sync, upload, download, create directory, move, copy, overwrite и delete.

Expected Result:

- Все сценарии выполняются на in-process WebDAV-сервере.

Actual Result:

- В исходном прогоне прошли 4 из 9 проверок.
- Ретест после исправления test double `remoteApp` и имени production API: 9 из 9 проверок прошли.

Status:

PASS

## TC-025 — Production build frontend

Priority: High  
Type: Build / Regression

Preconditions:

- Установлены зависимости app.

Steps:

1. Выполнить `rtk npm run build` в `app`.

Expected Result:

- Сборка завершается с кодом 0.

Actual Result:

- Сборка успешна.
- Финальный прогон: 3699 модулей, код завершения 0.
- Сохраняются предупреждения генератора sourcemap для legacy decorators, неразрешённого `./asset/logo.svg`, крупных chunks, динамических импортов и отсутствующего Sentry auth token.

Status:

PASS (с предупреждениями)

## TC-026 — Svelte type/check gate

Priority: High  
Type: Build / Regression

Preconditions:

- Установлены зависимости app.

Steps:

1. Выполнить `rtk npm run check` в `app`.

Expected Result:

- Нет ошибок typecheck/svelte-check.

Actual Result:

- `svelte-check` сообщает 335 ошибок и 102 предупреждения в 187 файлах текущего рабочего дерева.

Status:

FAIL (базовый blocker текущего рабочего дерева)

## TC-027 — Desktop typecheck gate

Priority: High  
Type: Build / Regression

Preconditions:

- Установлены зависимости desktop.

Steps:

1. Выполнить `rtk npm run typecheck` в `desktop`.

Expected Result:

- Node и Svelte typecheck проходят.

Actual Result:

- Обнаружены многочисленные ошибки типов в backend/main и зависимых legacy-модулях.

Status:

FAIL (базовый blocker текущего рабочего дерева)

## TC-028 — Полный Vitest suite

Priority: High  
Type: Regression / Integration

Preconditions:

- Установлены зависимости app.

Steps:

1. Выполнить `rtk npm run test -- --run --reporter=dot` в `app`.

Expected Result:

- Все тесты проходят.

Actual Result:

- Suite завершается с ошибками: 51 test files failed, 77 passed; 39 tests failed, 418 passed, 6 skipped (128 files, 463 tests).
- Причины включают отсутствие `JPC_SECRET`, несовпадения legacy API/ожиданий тестов, ошибки S/MIME/remoteApp и окружения.

Status:

FAIL (базовый blocker текущего рабочего дерева)

## TC-029 — Доступность полей DAV-форм

Priority: Medium  
Type: Accessibility / UI

Preconditions:

- Открыта форма добавления WebDAV, CalDAV или CardDAV аккаунта.

Steps:

1. Проверить связь каждой подписи с соответствующим полем имени, URL, username и password.
2. Перемещаться по полям с клавиатуры.

Expected Result:

- У каждого поля есть уникальный `id`, а `label[for]` указывает на него.
- Поля доступны в предсказуемом порядке.

Actual Result:

- Исходный source-аудит выявил отсутствующие/неверные связи label-control.
- Ретест: для трёх DAV-форм добавлены уникальные `id` и корректные `label[for]`; password-компонент поддерживает переданный `id`.
- Source UI retest: поля доступны по ожидаемым именам; при `not-a-url` кнопка `Следующий` disabled, при `https://example.com` и заполненных обязательных полях — enabled.

Status:

PASS

## TC-030 — Новое OWA-письмо появляется без перезапуска приложения

Priority: High  
Type: Functional / Integration / Regression

Preconditions:

- Открыта папка «Входящие» OWA-аккаунта.
- Список писем уже загружен и остаётся открытым.

Steps:

1. Доставить новое письмо на адрес открытого OWA-аккаунта.
2. Дождаться обновления счётчика непрочитанных или общего количества.
3. Проверить верхнюю часть списка без переоткрытия приложения.

Expected Result:

- Новое письмо отображается в списке сразу после синхронизации и находится в
  правильном порядке по дате.

Actual Result:

- До исправления счётчик обновлялся, но письмо добавлялось в конец
  сортированной коллекции и становилось видно только после перезапуска.
- Добавлен regression test, проверяющий сортированную вставку и дедупликацию
  нового OWA-письма; тест проходит.

Status:

PASS (source regression test; packaged `.app` pending rebuild/retest)

## TC-031 — Удаление письма в OWA синхронизируется со «Входящими» и «Корзиной»

Priority: High  
Type: Functional / Integration / Regression

Preconditions:

- В Jackdaw открыт OWA-аккаунт и папка «Входящие».
- В OWA доступно письмо этого же аккаунта.

Steps:

1. Удалить письмо в OWA.
2. Дождаться обновления счётчиков в Jackdaw.
3. Проверить «Входящие» и «Корзину» без перезапуска приложения.

Expected Result:

- Письмо исчезает из «Входящих» и отображается в «Корзине».
- Счётчики обеих папок обновлены.

Actual Result:

- До исправления счётчики обновлялись, но письмо оставалось в локальном списке
  «Входящих» и одновременно появлялось в «Корзине».
- Регрессионные тесты проверяют полное reconciliation после уменьшения
  серверного счётчика и очистку ранее сохранённой stale-записи.

Status:

PASS (source regression tests 2/2; packaged `.app` pending rebuild/retest)
