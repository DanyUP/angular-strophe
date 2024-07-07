import {SubscriptionType} from "./subscription-type.model";
import {PresenceType} from "./presence-type.model";

export interface RosterItem {
  jid: string;
  name: string;
  subscription: SubscriptionType;
  presence: PresenceType;
}
