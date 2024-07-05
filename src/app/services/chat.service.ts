import { Injectable } from '@angular/core';
import {$msg, $pres} from "strophe.js"
import {Strophe} from "strophe.js";
import {BehaviorSubject, Subject} from "rxjs";
import {Message} from "../models/message.model";

const BOSH_SERVICE = '/http-bind'


@Injectable({
  providedIn: 'root'
})
export class ChatService {

  private connection = new Strophe.Connection(BOSH_SERVICE);

  private statusBS = new BehaviorSubject<Strophe.Status>(Strophe.Status.DISCONNECTED);
  private logSubject = new Subject<string>();
  private messagesSubject = new Subject<Message>();

  private messageHandler: Strophe.Handler;

  readonly status$ = this.statusBS.asObservable();
  readonly log$ = this.logSubject.asObservable();
  readonly messages$ = this.messagesSubject.asObservable();

  constructor() { }

  connect(jid: string, password: string) {
    this.connection.connect(jid, password, (status: Strophe.Status) => this.onConnect(status))
  }

  sendMessage(destUser: string, messageText: string) {
    if (!this.connection.connected) {
      return;
    }
    const message = $msg({ to: destUser, from: this.connection.jid, type: 'chat' })
      .c('body')
      .t(messageText);

    this.connection.send(message.tree());
    this.logSubject.next(`Sent a message to ${destUser}`);
  }

  private setupMessageHandler() {
    this.deleteMessageHandler();
    this.messageHandler = this.connection.addHandler((msg: Element) => this.onMessage(msg), null, 'message', null, null, null);
  }

  private deleteMessageHandler() {
    if (this.messageHandler) {
      this.connection.deleteHandler(this.messageHandler);
    }
  }

  private onConnect(status: Strophe.Status) {
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
      this.connection.send($pres().tree());
    }
  }

  private onMessage(message: Element) {
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
  }
}
