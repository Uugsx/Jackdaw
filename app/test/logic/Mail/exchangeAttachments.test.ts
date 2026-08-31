import { describe, expect, it } from "vitest";
import { exchangeAttachmentEntriesFromJSON } from "../../../logic/Mail/EWS/exchangeAttachments";

describe("exchangeAttachmentEntriesFromJSON", () => {
  it("reads OWA attachment arrays", () => {
    let json = {
      Attachments: [{
        Name: "report.pdf",
        ContentType: "application/pdf",
        Size: 42,
        IsInline: false,
      }],
    };
    expect(exchangeAttachmentEntriesFromJSON(json)).toHaveLength(1);
  });

  it("reads nested FileAttachment objects", () => {
    let json = {
      Attachments: {
        FileAttachment: [{
          Name: "a.png",
          ContentType: "image/png",
          IsInline: true,
        }],
      },
    };
    expect(exchangeAttachmentEntriesFromJSON(json)).toHaveLength(1);
  });
});
