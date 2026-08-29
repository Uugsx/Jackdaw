import { OWARequest } from "./OWARequest";

/** Loads OWA mailbox settings, including the MasterCategoryList. */
export class OWAGetUserConfigurationRequest extends OWARequest {
  constructor() {
    super("GetOwaUserConfiguration", {});
  }
}
