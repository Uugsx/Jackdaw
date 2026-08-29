import { IANAToWindowsTimezone } from "../../../Calendar/ICal/WindowsTimezone";

function folderIdPayload(folderID: string) {
  let isDistinguished = ["inbox", "drafts", "deleteditems", "sentitems", "junkemail", "msgfolderroot"].includes(folderID.toLowerCase());
  return isDistinguished ? {
    __type: "DistinguishedFolderId:#Exchange",
    Id: folderID.toLowerCase(),
  } : {
    __type: "FolderId:#Exchange",
    Id: folderID,
  };
}

/**
 * Wire format matched to on-premise OWA DevTools (Exchange 2019 / cas.smartds.ru):
 * - Hierarchy/NewMail: subscriptionIdSuffix "" and no ChannelId
 * - Row: FolderId as raw string; SortBy FieldURI without item:/conversation: prefix
 * - Row renew views use suffix "renew" and dual SortBy (OrRenewTime + base field)
 * - No x-anchormailbox / explicit-logon on Subscribe (headers are caller's job)
 */
export class OWASubscribeToNotificationRequest {
  readonly request = {
    __type: "NotificationSubscribeJsonRequest:#Exchange",
    Header: {
      __type: "JsonRequestHeaders:#Exchange",
      RequestServerVersion: "Exchange2013",
      TimeZoneContext: {
        __type: "TimeZoneContext:#Exchange",
        TimeZoneDefinition: {
          __type: "TimeZoneDefinitionType:#Exchange",
          Id: IANAToWindowsTimezone[Intl.DateTimeFormat().resolvedOptions().timeZone] ?? "UTC",
        },
      },
    },
  };
  readonly subscriptionData: any[];

  constructor(
    rowNotificationFolderIDs: string[] = [],
    includeDefaultSubscriptions = true,
    channelID: string = crypto.randomUUID(),
    folderIdFormat: "direct" | "target" | "string" = "string",
    /** Unused for Hierarchy (OWA always uses ""). Kept for call-site compat. */
    _mailboxSuffix = "",
    /** Shared: one message-list renew view per folder (not +conversation). */
    messageViewOnly = false,
  ) {
    // OWA capture #1 / global NewMail: empty suffix, ChannelId omitted.
    let defaultSubscriptions = includeDefaultSubscriptions ? [{
      __type: "SubscriptionData:#Exchange",
      SubscriptionId: "HierarchyNotification",
      Parameters: {
        __type: "SubscriptionParameters:#Exchange",
        NotificationType: "HierarchyNotification",
        subscriptionIdSuffix: "",
      },
    }, {
      __type: "SubscriptionData:#Exchange",
      SubscriptionId: "NewMailNotification",
      Parameters: {
        __type: "SubscriptionParameters:#Exchange",
        NotificationType: "NewMailNotification",
        subscriptionIdSuffix: "",
      },
    }] : [];

    let formatFolderId = (id: string) => {
      if (folderIdFormat === "string") {
        return id;
      }
      if (folderIdFormat === "target") {
        return {
          __type: "TargetFolderId:#Exchange",
          BaseFolderId: folderIdPayload(id),
        };
      }
      return folderIdPayload(id);
    };

    this.subscriptionData = [...defaultSubscriptions, ...[...new Set(rowNotificationFolderIDs)].filter(Boolean).flatMap(folderID => {
      let folderId = formatFolderId(folderID);
      // Match OWA capture: renew message view + optional conversation renew view.
      let messageView = {
        __type: "SubscriptionData:#Exchange",
        SubscriptionId:
          `RowNotification${folderID}_false_ReceivedOrRenewTime_Descending_DateTimeReceived_Descending_All_renew`,
        Parameters: {
          __type: "SubscriptionParameters:#Exchange",
          NotificationType: "RowNotification",
          FolderId: folderId,
          IsConversation: false,
          SortBy: [{
            __type: "SortResults:#Exchange",
            Order: "Descending",
            Path: {
              __type: "PropertyUri:#Exchange",
              FieldURI: "ReceivedOrRenewTime",
            },
          }, {
            __type: "SortResults:#Exchange",
            Order: "Descending",
            Path: {
              __type: "PropertyUri:#Exchange",
              FieldURI: "DateTimeReceived",
            },
          }],
          Filter: "All",
          CategoryFilter: null,
          FocusedViewFilter: -1,
          ConversationShapeName: null,
          subscriptionIdSuffix: "renew",
          GroupBy: null,
          ChannelId: channelID,
        },
      };
      if (messageViewOnly) {
        return [messageView];
      }
      let conversationView = {
        __type: "SubscriptionData:#Exchange",
        SubscriptionId:
          `RowNotification${folderID}_true_ConversationLastDeliveryOrRenewTime_Descending_ConversationLastDeliveryTime_Descending_All_renew`,
        Parameters: {
          __type: "SubscriptionParameters:#Exchange",
          NotificationType: "RowNotification",
          FolderId: folderId,
          IsConversation: true,
          SortBy: [{
            __type: "SortResults:#Exchange",
            Order: "Descending",
            Path: {
              __type: "PropertyUri:#Exchange",
              FieldURI: "ConversationLastDeliveryOrRenewTime",
            },
          }, {
            __type: "SortResults:#Exchange",
            Order: "Descending",
            Path: {
              __type: "PropertyUri:#Exchange",
              FieldURI: "ConversationLastDeliveryTime",
            },
          }],
          Filter: "All",
          CategoryFilter: null,
          FocusedViewFilter: -1,
          ConversationShapeName: null,
          subscriptionIdSuffix: "renew",
          GroupBy: null,
          ChannelId: channelID,
        },
      };
      return [messageView, conversationView];
    })];
  }

  get action() {
    return "SubscribeToNotification";
  }
}
