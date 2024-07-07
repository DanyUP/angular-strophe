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

  connect(jid: string, password: string) {
    this.connection.connect(jid, password, (status: number) => this.onConnect(status))
  }

  disconnect() {
    if (!this.connection.connected) {
      return;
    }
    this.connection.disconnect();
  }

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

  private loadRoster() {
    const rosterRequest = $iq({ type: 'get' }).c('query', { xmlns: 'jabber:iq:roster' });
    this.connection.sendIQ(rosterRequest, (response: Element) => {
      const items = response.getElementsByTagName('item');
      const rosterItems = Array.from(items).map((item) => {
        const jid = item.getAttribute('jid') ?? '';
        const name = item.getAttribute('name') || jid;
        const subscription = item.getAttribute('subscription') as SubscriptionType || SubscriptionType.BOTH;
        return {
          jid,
          name,
          presence: PresenceType.OFFLINE,
          subscription
        } as RosterItem;
      });
      this.roster.next(rosterItems);
    });
  }

  private setupMessageHandler() {
    this.deleteMessageHandler();
    this.messageHandler = this.addHandler((msg: Element) => this.onMessage(msg), null, 'message');
  }

  private deleteMessageHandler() {
    if (this.messageHandler) {
      this.connection.deleteHandler(this.messageHandler);
    }
  }

  private addHandler(
    handler: Function, ns: string | null, name: string | null, type?: string | string[] | null, id?: string | null, from?: string | null, options?: {
      matchBareFromJid?: boolean;
      ignoreNamespaceFragment?: boolean;
    }
  ): any {
    return this.connection.addHandler(handler, ns as any, name as any, type as any, id as any, from as any, options)
  }

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
      this.connection.send($pres().tree());
    }
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
}
