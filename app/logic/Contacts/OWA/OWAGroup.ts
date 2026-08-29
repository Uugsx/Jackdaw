import { ExchangeGroup } from '../EWS/ExchangeGroup';
import { findOrCreatePerson } from '../../Abstract/PersonUID';
import type { OWAAddressbook } from './OWAAddressbook';
import { OWACreateItemRequest } from "../../Mail/OWA/Request/OWACreateItemRequest";
import { OWADeleteItemRequest } from "../../Mail/OWA/Request/OWADeleteItemRequest";
import { OWAUpdateItemRequest } from "../../Mail/OWA/Request/OWAUpdateItemRequest";
import { sanitize } from "../../../../lib/util/sanitizeDatatypes";
import { assert } from "../../util/util";

export class OWAGroup extends ExchangeGroup {
  declare addressbook: OWAAddressbook | null;

  /** The Exchange PersonaId,
   * or the empty string if the item has not been saved to the server. */
  personaID = "";
  /** The Exchange DistributionList ItemId (writable); empty if not yet on server. */
  itemID = "";

  fromJSON(json: any): OWAGroup {
    this.personaID = sanitize.nonemptystring(json.PersonaId.Id);
    this.itemID = sanitize.nonemptystring(json.EmailAddress?.ItemId?.Id, this.itemID);
    this.name = sanitize.nonemptystring(json.DisplayName, "");
    this.description = sanitize.nonemptystring(json.Notes, "");
    this.participants.replaceAll((json.Members || [])
      .filter(member => sanitize.emailAddress(member.EmailAddress?.EmailAddress, null))
      .map(member => findOrCreatePerson(sanitize.emailAddress(member.EmailAddress.EmailAddress), sanitize.nonemptystring(member.EmailAddress.Name, null))));
    return this;
  }

  async saveToServer() {
    assert(this.addressbook?.folderID, "Need contacts folder to save distribution list");
    let participants = this.participants.contents.filter(entry => entry.emailAddresses.first?.value);
    if (this.itemID) {
      let request = new OWAUpdateItemRequest(this.itemID);
      request.addField("DistributionList", "Body",
        this.description
          ? { __type: "BodyContentType:#Exchange", BodyType: "Text", Value: this.description }
          : null,
        "item:Body");
      request.addField("DistributionList", "DisplayName", this.name, "contacts:DisplayName");
      request.addField("DistributionList", "Members",
        participants.length
          ? participants.map(entry => ({
              __type: "MemberType:#Exchange",
              Mailbox: {
                __type: "EmailAddressType:#Exchange",
                EmailAddress: entry.emailAddresses.first.value,
                Name: entry.name,
              },
            }))
          : null,
        "distributionlist:Members");
      await this.addressbook.callOWA(request);
      return;
    }

    let request = new OWACreateItemRequest({
      SavedItemFolderId: {
        __type: "TargetFolderId:#Exchange",
        BaseFolderId: { __type: "FolderId:#Exchange", Id: this.addressbook.folderID },
      },
    });
    request.addField("DistributionList", "DisplayName", this.name);
    if (this.description) {
      request.addField("DistributionList", "Body", {
        __type: "BodyContentType:#Exchange",
        BodyType: "Text",
        Value: this.description,
      });
    }
    if (participants.length) {
      request.addField("DistributionList", "Members", participants.map(entry => ({
        __type: "MemberType:#Exchange",
        Mailbox: {
          __type: "EmailAddressType:#Exchange",
          EmailAddress: entry.emailAddresses.first.value,
          Name: entry.name,
        },
      })));
    }
    let response = await this.addressbook.callOWA(request);
    this.itemID = sanitize.nonemptystring(
      response?.Items?.[0]?.ItemId?.Id
      ?? response?.Items?.[0]?.DistributionList?.ItemId?.Id
      ?? response?.ItemId?.Id,
      "");
  }

  async deleteFromServer() {
    if (!this.itemID) {
      // Persona-only entry: cannot delete via ItemId; nothing to do on server.
      return;
    }
    let request = new OWADeleteItemRequest(this.itemID);
    await this.addressbook.callOWA(request);
  }

  fromExtraJSON(json: any) {
    super.fromExtraJSON(json);
    // Old existing contacts saved the personaID in the id
    this.personaID = sanitize.string(json.personaID, this.id);
    this.itemID = sanitize.string(json.itemID, "");
  }

  toExtraJSON(): any {
    let json = super.toExtraJSON();
    json.personaID = this.personaID;
    json.itemID = this.itemID;
    return json;
  }
}
