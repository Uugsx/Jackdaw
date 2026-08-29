# OWA notification capture для shared mailbox

Дата захвата: 2026-08-27  
OWA: https://cas.smartds.ru/owa/  
Shared mailbox: integrators@smartds.ru  
Exchange: 2019 on-prem

## Краткий результат

При открытом shared-виде integrators OWA отправляет folder-level подписки:

- HierarchyNotification;
- RowNotification;
- отдельный batch из четырёх RowNotification.

Все folder-level подписки вернули HTTP 200 и SuccessfullyCreated: true.

SuiteNotification отправляется отдельно как глобальная подписка и возвращает:

~~~text
SubscribeToSuiteNotification is only supported through Broker not in OwaMapiNotificationManager.
~~~

В релевантных запросах не обнаружены:

~~~yaml
x-anchormailbox: отсутствует
x-owa-explicitlogonuser: отсутствует
x-customowascenariodata: отсутствует
~~~

В shared-виде OWA использует FolderId из store с префиксом AAMkADBm... и ChannelId, а не explicit-logon заголовок.

## Общие заголовки SubscribeToNotification

Ниже общий набор заголовков для запросов #1–#3. Динамические поля указаны отдельно в каждом запросе.

~~~yaml
:authority: cas.smartds.ru
:method: POST
:scheme: https
Accept: */*
Accept-Encoding: gzip, deflate, br, zstd
Accept-Language: ru,en;q=0.9
Action: SubscribeToNotification
Origin: https://cas.smartds.ru
Priority: u=1, i
Sec-Ch-Ua: "Not=A?Brand";v="99", "Google Chrome";v="151", "Chromium";v="151"
Sec-Ch-Ua-Mobile: ?0
Sec-Ch-Ua-Platform: "macOS"
Sec-Fetch-Dest: empty
Sec-Fetch-Mode: cors
Sec-Fetch-Site: same-origin
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36
X-OWA-ActionName: SubscribeToNotificationAction
X-OWA-Attempt: 1
X-OWA-Canary: ***
X-OWA-ClientBuildVersion: 15.2.2562.37
X-Requested-With: XMLHttpRequest
Cookie: ***
~~~

## SubscribeToNotification #1

Комбинированная подписка на HierarchyNotification и фоновую папку.

~~~yaml
URL: https://cas.smartds.ru/owa/service.svc?action=SubscribeToNotification&EP=1&UA=0&ID=-5&AC=1
Method: POST
Content-Length: 0
Content-Type: application/json; charset=UTF-8
client-request-id: 5E1A8E063E3F42FDA9653098EB656259_178781721988515
X-OWA-ActionId: -5
X-OWA-ClientBegin: 2026-08-27T07:53:39.885
X-OWA-CorrelationId: 5E1A8E063E3F42FDA9653098EB656259_178781721988515
X-Owa-UrlPostData: URL-encoded JSON ниже
~~~

HTTP body пустой. JSON передан в X-Owa-UrlPostData:

~~~json
{
  "request": {
    "__type": "NotificationSubscribeJsonRequest:#Exchange",
    "Header": {
      "__type": "JsonRequestHeaders:#Exchange",
      "RequestServerVersion": "Exchange2013",
      "TimeZoneContext": {
        "__type": "TimeZoneContext:#Exchange",
        "TimeZoneDefinition": {
          "__type": "TimeZoneDefinitionType:#Exchange",
          "Id": "Russian Standard Time"
        }
      }
    }
  },
  "subscriptionData": [
    {
      "__type": "SubscriptionData:#Exchange",
      "SubscriptionId": "HierarchyNotification",
      "Parameters": {
        "__type": "SubscriptionParameters:#Exchange",
        "NotificationType": "HierarchyNotification",
        "subscriptionIdSuffix": ""
      }
    },
    {
      "__type": "SubscriptionData:#Exchange",
      "SubscriptionId": "RowNotificationAAMkADBmZjg5NTFmLTBmMGUtNGVjNS05MTZmLTU0N2QwOTljMGQ4NwAuAAAAAAAGd44idhOkTIpcDYVoS5oSAQAFxJV6TkSGTLy71GN+QdheAAAAAAEMAAA=_false_ReceivedOrRenewTime_Descending_DateTimeReceived_Descending_All_renew",
      "Parameters": {
        "__type": "SubscriptionParameters:#Exchange",
        "NotificationType": "RowNotification",
        "FolderId": "AAMkADBmZjg5NTFmLTBmMGUtNGVjNS05MTZmLTU0N2QwOTljMGQ4NwAuAAAAAAAGd44idhOkTIpcDYVoS5oSAQAFxJV6TkSGTLy71GN+QdheAAAAAAEMAAA=",
        "IsConversation": false,
        "SortBy": [
          {
            "__type": "SortResults:#Exchange",
            "Order": "Descending",
            "Path": {
              "__type": "PropertyUri:#Exchange",
              "FieldURI": "ReceivedOrRenewTime"
            }
          },
          {
            "__type": "SortResults:#Exchange",
            "Order": "Descending",
            "Path": {
              "__type": "PropertyUri:#Exchange",
              "FieldURI": "DateTimeReceived"
            }
          }
        ],
        "Filter": "All",
        "CategoryFilter": null,
        "FocusedViewFilter": -1,
        "ConversationShapeName": null,
        "subscriptionIdSuffix": "renew",
        "GroupBy": null,
        "ChannelId": null
      }
    }
  ]
}
~~~

Response:

~~~json
[
  {
    "ErrorInfo": null,
    "SubscriptionExists": false,
    "SubscriptionId": "HierarchyNotification",
    "SuccessfullyCreated": true
  },
  {
    "ErrorInfo": null,
    "SubscriptionId": "RowNotification...",
    "SubscriptionExists": false,
    "SuccessfullyCreated": true
  }
]
~~~

## SubscribeToNotification #2

RowNotification для non-conversation представления папки.

~~~yaml
URL: https://cas.smartds.ru/owa/service.svc?action=SubscribeToNotification&EP=1&UA=0&ID=-32&AC=1
Method: POST
Content-Length: 0
Content-Type: application/json; charset=UTF-8
client-request-id: 5E1A8E063E3F42FDA9653098EB656259_178781722993744
X-OWA-ActionId: -32
X-OWA-ClientBegin: 2026-08-27T07:53:49.937
X-OWA-CorrelationId: 5E1A8E063E3F42FDA9653098EB656259_178781722993744
X-Owa-UrlPostData: URL-encoded JSON ниже
~~~

HTTP body пустой. JSON передан в X-Owa-UrlPostData:

~~~json
{
  "request": {
    "__type": "NotificationSubscribeJsonRequest:#Exchange",
    "Header": {
      "__type": "JsonRequestHeaders:#Exchange",
      "RequestServerVersion": "Exchange2013",
      "TimeZoneContext": {
        "__type": "TimeZoneContext:#Exchange",
        "TimeZoneDefinition": {
          "__type": "TimeZoneDefinitionType:#Exchange",
          "Id": "Russian Standard Time"
        }
      }
    }
  },
  "subscriptionData": [
    {
      "__type": "SubscriptionData:#Exchange",
      "SubscriptionId": "RowNotificationAAMkADBmZjg5NTFmLTBmMGUtNGVjNS05MTZmLTU0N2QwOTljMGQ4NwAuAAAAAAAGd44idhOkTIpcDYVoS5oSAQAFxJV6TkSGTLy71GN+QdheAABoh/3TAAA=_false_ReceivedOrRenewTime_Descending_DateTimeReceived_Descending_All_renew",
      "Parameters": {
        "__type": "SubscriptionParameters:#Exchange",
        "NotificationType": "RowNotification",
        "FolderId": "AAMkADBmZjg5NTFmLTBmMGUtNGVjNS05MTZmLTU0N2QwOTljMGQ4NwAuAAAAAAAGd44idhOkTIpcDYVoS5oSAQAFxJV6TkSGTLy71GN+QdheAABoh/3TAAA=",
        "IsConversation": false,
        "SortBy": [
          {
            "__type": "SortResults:#Exchange",
            "Order": "Descending",
            "Path": {
              "__type": "PropertyUri:#Exchange",
              "FieldURI": "ReceivedOrRenewTime"
            }
          },
          {
            "__type": "SortResults:#Exchange",
            "Order": "Descending",
            "Path": {
              "__type": "PropertyUri:#Exchange",
              "FieldURI": "DateTimeReceived"
            }
          }
        ],
        "Filter": "All",
        "CategoryFilter": null,
        "FocusedViewFilter": -1,
        "ConversationShapeName": null,
        "subscriptionIdSuffix": "renew",
        "GroupBy": null,
        "ChannelId": "e4d0d1f6-dfa7-4e4a-98dc-2707911053a3"
      }
    }
  ]
}
~~~

Response: HTTP 200, SuccessfullyCreated: true.

## SubscribeToNotification #3

Основной batch для открытого shared-вида. Здесь JSON передан обычным HTTP body.

~~~yaml
URL: https://cas.smartds.ru/owa/service.svc?action=SubscribeToNotification&UA=0&ID=-37&AC=1
Method: POST
Content-Length: 4034
Content-Type: application/json; charset=UTF-8
client-request-id: 5E1A8E063E3F42FDA9653098EB656259_178781723025849
X-OWA-ActionId: -37
X-OWA-ClientBegin: 2026-08-27T07:53:50.258
X-OWA-CorrelationId: 5E1A8E063E3F42FDA9653098EB656259_178781723025849
X-Owa-UrlPostData: отсутствует
~~~

~~~json
{
  "request": {
    "__type": "NotificationSubscribeJsonRequest:#Exchange",
    "Header": {
      "__type": "JsonRequestHeaders:#Exchange",
      "RequestServerVersion": "Exchange2013",
      "TimeZoneContext": {
        "__type": "TimeZoneContext:#Exchange",
        "TimeZoneDefinition": {
          "__type": "TimeZoneDefinitionType:#Exchange",
          "Id": "Russian Standard Time"
        }
      }
    }
  },
  "subscriptionData": [
    {
      "__type": "SubscriptionData:#Exchange",
      "SubscriptionId": "RowNotificationAAMkADBmZjg5NTFmLTBmMGUtNGVjNS05MTZmLTU0N2QwOTljMGQ4NwAuAAAAAAAGd44idhOkTIpcDYVoS5oSAQAFxJV6TkSGTLy71GN+QdheAAAAAAEKAAA=_false_DateTimeReceived_Descending_All",
      "Parameters": {
        "__type": "SubscriptionParameters:#Exchange",
        "NotificationType": "RowNotification",
        "FolderId": "AAMkADBmZjg5NTFmLTBmMGUtNGVjNS05MTZmLTU0N2QwOTljMGQ4NwAuAAAAAAAGd44idhOkTIpcDYVoS5oSAQAFxJV6TkSGTLy71GN+QdheAAAAAAEKAAA=",
        "IsConversation": false,
        "SortBy": [
          {
            "__type": "SortResults:#Exchange",
            "Order": "Descending",
            "Path": {
              "__type": "PropertyUri:#Exchange",
              "FieldURI": "DateTimeReceived"
            }
          }
        ],
        "Filter": "All",
        "CategoryFilter": null,
        "FocusedViewFilter": -1,
        "ConversationShapeName": null,
        "subscriptionIdSuffix": null,
        "GroupBy": null,
        "ChannelId": "e4d0d1f6-dfa7-4e4a-98dc-2707911053a3"
      }
    },
    {
      "__type": "SubscriptionData:#Exchange",
      "SubscriptionId": "RowNotificationAAMkADBmZjg5NTFmLTBmMGUtNGVjNS05MTZmLTU0N2QwOTljMGQ4NwAuAAAAAAAGd44idhOkTIpcDYVoS5oSAQAFxJV6TkSGTLy71GN+QdheAABoh/3UAAA=_true_ConversationLastDeliveryOrRenewTime_Descending_ConversationLastDeliveryTime_Descending_All_renew",
      "Parameters": {
        "__type": "SubscriptionParameters:#Exchange",
        "NotificationType": "RowNotification",
        "FolderId": "AAMkADBmZjg5NTFmLTBmMGUtNGVjNS05MTZmLTU0N2QwOTljMGQ4NwAuAAAAAAAGd44idhOkTIpcDYVoS5oSAQAFxJV6TkSGTLy71GN+QdheAABoh/3UAAA=",
        "IsConversation": true,
        "SortBy": [
          {
            "__type": "SortResults:#Exchange",
            "Order": "Descending",
            "Path": {
              "__type": "PropertyUri:#Exchange",
              "FieldURI": "ConversationLastDeliveryOrRenewTime"
            }
          },
          {
            "__type": "SortResults:#Exchange",
            "Order": "Descending",
            "Path": {
              "__type": "PropertyUri:#Exchange",
              "FieldURI": "ConversationLastDeliveryTime"
            }
          }
        ],
        "Filter": "All",
        "CategoryFilter": null,
        "FocusedViewFilter": -1,
        "ConversationShapeName": null,
        "subscriptionIdSuffix": "renew",
        "GroupBy": null,
        "ChannelId": "e4d0d1f6-dfa7-4e4a-98dc-2707911053a3"
      }
    },
    {
      "__type": "SubscriptionData:#Exchange",
      "SubscriptionId": "RowNotificationAAMkADBmZjg5NTFmLTBmMGUtNGVjNS05MTZmLTU0N2QwOTljMGQ4NwAuAAAAAAAGd44idhOkTIpcDYVoS5oSAQAFxJV6TkSGTLy71GN+QdheAABoh/3WAAA=_true_ConversationLastDeliveryOrRenewTime_Descending_ConversationLastDeliveryTime_Descending_All_renew",
      "Parameters": {
        "__type": "SubscriptionParameters:#Exchange",
        "NotificationType": "RowNotification",
        "FolderId": "AAMkADBmZjg5NTFmLTBmMGUtNGVjNS05MTZmLTU0N2QwOTljMGQ4NwAuAAAAAAAGd44idhOkTIpcDYVoS5oSAQAFxJV6TkSGTLy71GN+QdheAABoh/3WAAA=",
        "IsConversation": true,
        "SortBy": [
          {
            "__type": "SortResults:#Exchange",
            "Order": "Descending",
            "Path": {
              "__type": "PropertyUri:#Exchange",
              "FieldURI": "ConversationLastDeliveryOrRenewTime"
            }
          },
          {
            "__type": "SortResults:#Exchange",
            "Order": "Descending",
            "Path": {
              "__type": "PropertyUri:#Exchange",
              "FieldURI": "ConversationLastDeliveryTime"
            }
          }
        ],
        "Filter": "All",
        "CategoryFilter": null,
        "FocusedViewFilter": -1,
        "ConversationShapeName": null,
        "subscriptionIdSuffix": "renew",
        "GroupBy": null,
        "ChannelId": "e4d0d1f6-dfa7-4e4a-98dc-2707911053a3"
      }
    },
    {
      "__type": "SubscriptionData:#Exchange",
      "SubscriptionId": "RowNotificationAAMkADBmZjg5NTFmLTBmMGUtNGVjNS05MTZmLTU0N2QwOTljMGQ4NwAuAAAAAAAGd44idhOkTIpcDYVoS5oSAQAFxJV6TkSGTLy71GN+QdheAAAAAAEJAAA=_true_ConversationLastDeliveryTime_Descending_All",
      "Parameters": {
        "__type": "SubscriptionParameters:#Exchange",
        "NotificationType": "RowNotification",
        "FolderId": "AAMkADBmZjg5NTFmLTBmMGUtNGVjNS05MTZmLTU0N2QwOTljMGQ4NwAuAAAAAAAGd44idhOkTIpcDYVoS5oSAQAFxJV6TkSGTLy71GN+QdheAAAAAAEJAAA=",
        "IsConversation": true,
        "SortBy": [
          {
            "__type": "SortResults:#Exchange",
            "Order": "Descending",
            "Path": {
              "__type": "PropertyUri:#Exchange",
              "FieldURI": "ConversationLastDeliveryTime"
            }
          }
        ],
        "Filter": "All",
        "CategoryFilter": null,
        "FocusedViewFilter": -1,
        "ConversationShapeName": null,
        "subscriptionIdSuffix": null,
        "GroupBy": null,
        "ChannelId": "e4d0d1f6-dfa7-4e4a-98dc-2707911053a3"
      }
    }
  ]
}
~~~

Response: HTTP 200; все четыре подписки получили SuccessfullyCreated: true.

## Global SubscribeToNotification

~~~yaml
URL: https://cas.smartds.ru/owa/service.svc?action=SubscribeToNotification&EP=1&UA=0&ID=-20&AC=1
~~~

В запросе были:

~~~yaml
ReminderNotification: SuccessfullyCreated=true
NewMailNotification: SuccessfullyCreated=true
SuiteNotification: SuccessfullyCreated=false
ErrorInfo: SubscribeToSuiteNotification is only supported through Broker not in OwaMapiNotificationManager.
~~~

## FinishNotificationRequest

Захвачен предыдущий цикл notification-канала:

~~~yaml
URL: https://cas.smartds.ru/owa/ev.owa2?ns=PendingRequest&ev=FinishNotificationRequest&UA=0&cid=20360e9a-82dd-4eac-b58e-6c28a53b8cdf
Method: POST
Accept: */*
Accept-Encoding: gzip, deflate, br, zstd
Accept-Language: ru,en;q=0.9
Connection: keep-alive
Content-Length: 0
Content-Type: text/plain;charset=UTF-8
Host: cas.smartds.ru
Origin: https://cas.smartds.ru
Sec-Fetch-Dest: empty
Sec-Fetch-Mode: cors
Sec-Fetch-Site: same-origin
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36
sec-ch-ua: "Not=A?Brand";v="99", "Google Chrome";v="151", "Chromium";v="151"
sec-ch-ua-mobile: ?0
sec-ch-ua-platform: "macOS"
X-OWA-Canary: ***
Cookie: ***
Body: пустое
~~~

Response:

~~~json
{
  "cid": "20360e9a-82dd-4eac-b58e-6c28a53b8cdf",
  "syncFnshRq": 0
}
~~~

cid динамический. Для текущего shared-folder batch использовался:

~~~yaml
ChannelId/cid: e4d0d1f6-dfa7-4e4a-98dc-2707911053a3
~~~

## PendingNotificationRequest

Текущий запрос для shared-folder channel:

~~~yaml
URL: https://cas.smartds.ru/owa/ev.owa2?ns=PendingRequest&ev=PendingNotificationRequest&UA=0&cid=e4d0d1f6-dfa7-4e4a-98dc-2707911053a3&brwnm=chrome&X-OWA-CANARY=***&n=2
Method: GET
Accept: */*
Accept-Encoding: gzip, deflate, br, zstd
Accept-Language: ru,en;q=0.9
Connection: keep-alive
Host: cas.smartds.ru
Sec-Fetch-Dest: empty
Sec-Fetch-Mode: cors
Sec-Fetch-Site: same-origin
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36
sec-ch-ua: "Not=A?Brand";v="99", "Google Chrome";v="151", "Chromium";v="151"
sec-ch-ua-mobile: ?0
sec-ch-ua-platform: "macOS"
Cookie: ***
Body: пустое
~~~

X-OWA-CANARY в pending-запросе находится в query string. Отдельного заголовка X-OWA-Canary нет.

В DevTools запрос имел статус 200 OK, тип xhr, long-poll. Завершившийся предыдущий цикл вернул:

~~~html
<script>{id:'pg',data:'update'}</script>
<script></script>
<script></script>
~~~

## Incoming push event

Входящий кадр с изменением unread не зафиксирован. Состояние письма специально не менялось.

В ответе pending не было JSON-события HierarchyNotification или RowNotification. WebSocket не использовался: OWA работал через XHR long-poll ev.owa2.

## Локальные HAR-файлы

- /Users/ng/Downloads/owa-reload-shared.har
- /Users/ng/Downloads/owa-subscribe.har

HAR экспортированы через Export HAR (sanitized). Cookie и Canary в этом документе замаскированы; HAR-файлы могут содержать тела ответов OWA.

## Контрольный эксперимент: unread в фоновой папке shared

Эксперимент выполнен после подтверждения пользователя:

- В первой вкладке OWA оставлен открытым shared mailbox `integrators`, папка «Входящие»; DevTools Network — Preserve log, запись включена.
- Во второй вкладке открыт `integrators → Нежелательная почта` (фоновая папка; это тот же сценарий фоновой папки, что и «Корзина» в проверочном плане).
- Выбрано одно уже прочитанное письмо `dpd-avito-app — PVZ-dpd-avito-app. Предупреждения от бизнес логики`.
- Через контекстное меню выполнено ровно одно действие «Пометить как непрочитанное». OWA подтвердил состояние строки: `Не прочитано`.

### Цепочка после изменения

Старый long-poll завершился HTTP 200, после чего OWA отправил `FinishNotificationRequest` для канала `e4d0d1f6-dfa7-4e4a-98dc-2707911053a3` и сразу открыл новый `PendingNotificationRequest`.

Новый pending:

~~~yaml
URL: https://cas.smartds.ru/owa/ev.owa2?ns=PendingRequest&ev=PendingNotificationRequest&UA=0&cid=e4d0d1f6-dfa7-4e4a-98dc-2707911053a3&brwnm=chrome&X-OWA-CANARY=***&n=po
Method: GET
Status: 200 OK (long-poll оставался открытым)
Accept: */*
Accept-Encoding: gzip, deflate, br, zstd
Accept-Language: ru,en;q=0.9
Connection: keep-alive
Host: cas.smartds.ru
Sec-Fetch-Dest: empty
Sec-Fetch-Mode: cors
Sec-Fetch-Site: same-origin
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36
sec-ch-ua: "Not=A?Brand";v="99", "Google Chrome";v="151", "Chromium";v="151"
sec-ch-ua-mobile: ?0
sec-ch-ua-platform: "macOS"
Cookie: ***
Body: пустое
~~

После изменения unread новый long-poll наблюдался не менее ~55 секунд; отдельного `HierarchyNotification` или `RowNotification` для `Нежелательная почта (integrators)` в нём не появилось. В DevTools он оставался активным, без тела ответа.

### Сырой push-фрагмент, который был в завершившемся ответе

Завершившийся ответ содержал накопленные события других подписанных папок. Например, один из кадров был таким:

~~~html
<script>[{"EventType":"RowModified","id":"HierarchyNotification","FolderType":"Folder","displayName":"акты возвратов Спортмастер","folderId":"AAMkADBmZjg5NTFmLTBmMGUtNGVjNS05MTZmLTU0N2QwOTljMGQ4NwAuAAAAAAAGd44idhOkTIpcDYVoS5oSAQAFxJV6TkSGTLy71GN+QdheAABoh/3WAAA=","itemCount":775,"parentFolderId":"AAMkADBmZjg5NTFmLTBmMGUtNGVjNS05MTZmLTU0N2QwOTljMGQ4NwAuAAAAAAAGd44idhOkTIpcDYVoS5oSAQAFxJV6TkSGTLy71GN+QdheAAAAAAEMAAA=","unreadCount":768}]</script>
~~~

Этот кадр не относится к изменению письма в `Нежелательная почта`: в нём указан другой `displayName` и другой `folderId`. Поэтому контрольный результат — **OWA не прислал через текущий канал push-кадр для unread-изменения фоновой папки**; это согласуется с вариантом «счётчики пересчитываются/обновляются отдельно», но само по себе не доказывает отсутствие серверной подписки на все папки.
