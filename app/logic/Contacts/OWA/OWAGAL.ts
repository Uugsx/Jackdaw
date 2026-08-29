import { SearchOnlyAddressbook } from "../Addressbook";
import { OWAPerson } from "./OWAPerson";
import { ContactEntry } from "../../Abstract/Person";
import type { OWAAccount } from "../../Mail/OWA/OWAAccount";
import { owaFindGALPersonsRequest, owaResolveNamesRequest } from "./Request/OWAPersonRequests";
import { addDirectoryCertificatesToPerson } from "../../Mail/Encryption/SMIME/SMIMEDirectory";
import { ensureArray, NotReached } from "../../util/util";
import type { ArrayColl } from "svelte-collections";

export class OWAGAL extends SearchOnlyAddressbook {
  readonly protocol: string = "gal-owa";
  account: OWAAccount;

  constructor(account: OWAAccount) {
    super();
    this.mainAccount = this.account = account;
    this.errorCallback = account.errorCallback;
  }

  newPerson(): OWAPerson {
    return new OWAPerson(this);
  }
  newGroup(): never {
    throw new NotReached();
  }

  async quickSearchAsync(searchTerm: string, results: ArrayColl<OWAPerson>) {
    await this.findPeople(searchTerm, results);
    if (results.isEmpty) {
      await this.resolveNames(searchTerm, results);
    }
  }

  /** FindPeople against the directory folder — good for partial name/alias matches. */
  protected async findPeople(searchTerm: string, results: ArrayColl<OWAPerson>) {
    let response = await this.account.callOWA(owaFindGALPersonsRequest(searchTerm));
    for (let result of ensureArray(response.ResultSet)) {
      try {
        let person = this.newPerson();
        person.fromJSON(result);
        if (!person.emailAddresses.hasItems) {
          continue;
        }
        if (results.find(existing => existing.name == person.name &&
            existing.emailAddresses.first?.value == person.emailAddresses.first?.value)) {
          continue;
        }
        results.add(person);
      } catch {
        // Skip malformed personas from the GAL response
      }
    }
  }

  /** ResolveNames — same path EWS uses; returns SMTP + certificates. */
  protected async resolveNames(searchTerm: string, results: ArrayColl<OWAPerson>) {
    try {
      let response = await this.account.callOWA(owaResolveNamesRequest(searchTerm));
      for (let resolution of ensureArray(response.ResolutionSet?.Resolution ?? response.ResolutionSet)) {
        let mailbox = resolution.Mailbox;
        let email = mailbox?.EmailAddress;
        let routing = mailbox?.RoutingType;
        if (!email || (routing && routing != "SMTP")) {
          // Prefer Contact email entries when mailbox is X.500
          let contactEmails = ensureArray(resolution.Contact?.EmailAddresses?.Entry ?? resolution.Contact?.EmailAddresses);
          let smtp = contactEmails.find((entry: any) =>
            (!entry.RoutingType || entry.RoutingType == "SMTP") && (entry.Value || entry.EmailAddress));
          email = smtp?.Value ?? smtp?.EmailAddress;
          if (!email) {
            continue;
          }
        }
        let person = this.newPerson();
        person.name = mailbox?.Name || email;
        person.emailAddresses.clear();
        person.emailAddresses.add(new ContactEntry(email, "work", "mailto"));
        if (results.find(existing =>
            existing.emailAddresses.first?.value?.toLowerCase() == email.toLowerCase())) {
          continue;
        }
        await addDirectoryCertificatesToPerson(person,
          ensureArray(resolution.Contact?.UserSMIMECertificate),
          ensureArray(resolution.Contact?.MSExchangeCertificate));
        results.add(person);
      }
    } catch (ex) {
      if (ex.type != "ErrorNameResolutionNoResults") {
        throw ex;
      }
    }
  }
}
