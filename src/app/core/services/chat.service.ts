import {Injectable} from '@angular/core';
import {$iq, $msg, $pres, Strophe} from "strophe.js"
import {BehaviorSubject, Subject} from "rxjs";
import {Message} from "../models/message.model";
import {RosterItem} from "../models/roster-item.model";
import {PresenceType} from "../models/presence-type.model";
import {SubscriptionType} from "../models/subscription-type.model";

const BOSH_SERVICE = '/http-bind'

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  private connection = new Strophe.Connection(BOSH_SERVICE);

  private statusBS = new BehaviorSubject<number>(Strophe.Status.DISCONNECTED);
  private roster = new BehaviorSubject<RosterItem[]>([]);
  private logSubject = new Subject<string>();
  private messagesSubject = new Subject<Message>();

  private messageHandler: any;

  readonly status$ = this.statusBS.asObservable();
  readonly log$ = this.logSubject.asObservable();
  readonly messages$ = this.messagesSubject.asObservable();
  readonly roster$ = this.roster.asObservable();

  constructor() { }

  /**
   * Connect to jabber server using jid and password
   * @param jid
   * @param password
   */
  connect(jid: string, password: string) {
    this.connection.connect(jid, password, (status: number) => this.onConnect(status))
  }

  /**
   * Disconnect from the server (also sending an 'unavailable' presence update)
   */
  disconnect() {
    if (!this.connection.connected) {
      return;
    }
    this.connection.disconnect();
  }

  /**
   * Send a text message to a user
   * @param destUser
   * @param messageText
   */
  sendMessage(destUser: string, messageText: string) {
    if (!this.connection.connected) {
      return;
    }
    const message = $msg({ to: destUser, type: 'chat' })
      .c('body')
      .t(messageText);

    this.connection.send(message.tree());
    this.logSubject.next(`Sent a message to ${destUser}`);
  }

  /**
   * Load the roster (the list of users) from the server
   * @private
   */
  private loadRoster() {
    const rosterRequest = $iq({ type: 'get' }).c('query', { xmlns: 'jabber:iq:roster' });
    this.connection.sendIQ(rosterRequest, (response: Element) => this.onRoster(response));
    // Subscribe to roster changes
    this.addHandler((change: Element) => this.onRosterChanged(change), "jabber:iq:roster", "iq", "set");
  }

  /**
   * Set up the base message handler
   * @private
   */
  private setupMessageHandler() {
    this.deleteMessageHandler();
    this.messageHandler = this.addHandler((msg: Element) => this.onMessage(msg), null, 'message');
  }

  /**
   * Remove the registered message handler
   * @private
   */
  private deleteMessageHandler() {
    if (this.messageHandler) {
      this.connection.deleteHandler(this.messageHandler);
    }
  }

  /**
   * Wrapper for the original Connection.addHandler from Strophe.js (for correct typings)
   * @param handler
   * @param ns
   * @param name
   * @param type
   * @param id
   * @param from
   * @param options
   * @private
   */
  private addHandler(
    handler: Function, ns: string | null, name: string | null, type?: string | string[] | null, id?: string | null, from?: string | null, options?: {
      matchBareFromJid?: boolean;
      ignoreNamespaceFragment?: boolean;
    }
  ): any {
    return this.connection.addHandler(handler, ns as any, name as any, type as any, id as any, from as any, options)
  }

  /**
   * Extract the list of user from roster setup or updates
   * @param element
   * @param tagName
   * @private
   */
  private extractRosterItems(element: Element, tagName: string = 'item'): RosterItem[] {
    const items = element.getElementsByTagName(tagName);
    return Array.from(items).map((item) => {
      // The "correct" jid is the bare jid (user@domain)
      const jid = Strophe.getBareJidFromJid(item.getAttribute('jid') ?? '');
      const name = item.getAttribute('name') || jid;
      const subscription = item.getAttribute('subscription') as SubscriptionType || SubscriptionType.BOTH;
      return {
        jid,
        name,
        presence: PresenceType.OFFLINE,
        subscription
      } as RosterItem;
    });
  }

  //region Handlers

  /**
   * Handler used to react to connection state changes
   * @param status
   * @private
   */
  private onConnect(status: number) {
    this.statusBS.next(status);
    if (status === Strophe.Status.CONNECTING) {
      this.logSubject.next("Strophe connecting...");
    } else if (status === Strophe.Status.CONNFAIL) {
      this.logSubject.next("Connection failed.");
    } else if (status === Strophe.Status.DISCONNECTING) {
      this.logSubject.next("Strophe is disconnecting...");
    } else if (status === Strophe.Status.DISCONNECTED) {
      this.logSubject.next("Connection disconnected.");
    } else if (status === Strophe.Status.CONNECTED) {
      this.logSubject.next("Connection connected!");
      this.setupMessageHandler();
      this.loadRoster();
    }
  }

  /**
   * Handler used for roster initial setup
   * @param response
   * @private
   */
  private onRoster(response: Element): boolean {
    const rosterItems = this.extractRosterItems(response);
    this.roster.next(rosterItems);
    this.addHandler((presence: Element) => this.onPresence(presence), null, 'presence');

    this.connection.send($pres().tree());
    return true;
  }

  /**
   * Handler used to insert/update/delete users on roster changes
   * @param changes
   * @private
   */
  private onRosterChanged(changes: Element) {
    const rosterItems = this.extractRosterItems(changes);
    const newRoster = this.roster.getValue().slice();
    rosterItems.forEach((item) => {
      const existingItemIndex = newRoster.findIndex(
        (currentItem) => currentItem.jid === Strophe.getBareJidFromJid(item.jid)
      );
      if (item.subscription === SubscriptionType.REMOVE) {
        // An item has been removed from roster
        newRoster.splice(existingItemIndex, 1);
      } else if (existingItemIndex !== -1) {
        // An item has been updated in roster
        newRoster[existingItemIndex] = item;
      } else {
        // An item has been added
        newRoster.push(item);
      }
    })
    this.roster.next(newRoster);
    return true;
  }

  /**
   *
   * @param presence
   * @private
   */
  private onPresence(presence: Element) {
    const ptype = presence.getAttribute('type') ?? 'online';
    const from = Strophe.getBareJidFromJid(presence.getAttribute('from') ?? '');

    if (ptype === 'subscribe') {
      // An external user added the current user as contact - CURRENTLY NOT IMPLEMENTED
    } else if (ptype !== 'error') {
      // The event is not an error, so it's a state change from another contact
      let status: PresenceType;
      if (ptype === 'unavailable') {
        // If ptype is 'unavailable' the user went offline
        status = PresenceType.OFFLINE;
      } else {
        // Otherwise we check the 'show' field
        const show = presence.getElementsByTagName('show')[0]?.textContent ?? '';
        switch (show) {
          case '':
            status = PresenceType.ONLINE;
            break;
          case 'chat':
            status = PresenceType.CHAT;
            break;
          case 'away':
            status = PresenceType.AWAY;
            break
          case 'dnd':
            status = PresenceType.DO_NOT_DISTURB;
            break
          case 'xa':
            status = PresenceType.EXTENDED_AWAY;
            break
          default:
            // Default case: we consider the user offline
            status = PresenceType.OFFLINE;
        }
      }
      const currentRoster = this.roster.getValue();
      const foundIndex = currentRoster.findIndex((user) => user.jid === from);
      if (foundIndex > -1) {
        const newRoster = currentRoster.slice(0);
        newRoster[foundIndex] = {
          ...currentRoster[foundIndex],
          presence: status,
        }
        this.roster.next(newRoster);
      }
    }
    return true;
  }

  private onMessage(message: Element): boolean {
    const to = message.getAttribute('to');
    const from = message.getAttribute('from');
    const type = message.getAttribute('type');
    const elems = message.getElementsByTagName('body');

    if (type === 'chat' && elems.length > 0) {
      const body = elems[0];
      const messageText = Strophe.getText(body);

      this.logSubject.next(`I got a message from ${from}: ${messageText}`);
      this.messagesSubject.next({
        timestamp: new Date(),
        userFrom: from ?? '',
        userTo: to ?? '',
        body: messageText
      });

    }
    return true;
  }
  //endregion
}
