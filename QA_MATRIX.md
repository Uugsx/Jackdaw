# Матрица покрытия QA

| Feature | Test Case | Status | Bug |
|---------|-----------|--------|-----|
| Запуск desktop и cached mail | TC-001 | PASS (source runtime; packaged `.app` pending rebuild) | BUG-003 resolved |
| Frontend/backend handshake | TC-002 | BLOCKED | - |
| Навигация по папкам | TC-003 | PASS (ретест source catalog/build) | BUG-004 resolved |
| Дерево папок | TC-004 | PASS | - |
| Виды списка почты | TC-005 | PASS | - |
| Chat-like mail view | TC-006 | PASS | - |
| Меню быстрых фильтров | TC-007 | PASS | - |
| Фильтр без совпадений | TC-008 | PASS | BUG-001 resolved |
| Очистка фильтра | TC-009 | PASS | - |
| Сортировка по дате | TC-010 | PASS | - |
| Сортировка по отправителю | TC-011 | PASS | - |
| Открытие письма | TC-012 | PASS | - |
| HTML/plaintext | TC-013 | PASS | - |
| Внешний контент | TC-014 | BLOCKED | - |
| Поиск контактов Unicode/no-match | TC-015 | PASS | - |
| Навигация календаря | TC-016 | PASS | - |
| Виды календаря | TC-017 | PASS | - |
| Files empty-state | TC-018 | PASS | - |
| Выбор WebDAV protocol | TC-019 | PASS | - |
| Валидация WebDAV | TC-020 | PASS | BUG-002 resolved |
| WebDAV password visibility | TC-021 | PASS | - |
| Settings theme | TC-022 | PASS | - |
| Settings notifications/read/send | TC-023 | PASS | - |
| WebDAV integration suite | TC-024 | PASS (9/9) | TEST-INFRA-001 resolved |
| Frontend production build | TC-025 | PASS (warnings) | - |
| App svelte-check | TC-026 | FAIL | baseline blocker |
| Desktop typecheck | TC-027 | FAIL | baseline blocker |
| Full Vitest suite | TC-028 | FAIL | baseline blocker |
| Доступность DAV-форм | TC-029 | PASS | BUG-005 resolved |
| OWA live arrival in open list | TC-030 | PASS (source regression; packaged `.app` pending) | BUG-006 resolved |
| OWA удаление письма и reconciliation папок | TC-031 | PASS (source regression; packaged `.app` pending) | BUG-007 resolved |
