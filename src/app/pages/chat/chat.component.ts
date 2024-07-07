import {Component, inject, Signal} from '@angular/core';
import {ChatService} from "../../core/services/chat.service";
import {FormBuilder, ReactiveFormsModule, Validators} from "@angular/forms";
import {Message} from "../../core/models/message.model";
import {takeUntilDestroyed, toSignal} from "@angular/core/rxjs-interop";
import {filter, scan} from "rxjs";
import {Strophe} from "strophe.js";
import {Router} from "@angular/router";
import {ChatRoomComponent} from "../../ui/components/chat-room/chat-room.component";
import {RosterComponent} from "../../ui/components/roster/roster.component";

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ChatRoomComponent,
    RosterComponent
  ],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent {
  private chatService = inject(ChatService);
  private router = inject(Router);

  roster = toSignal(this.chatService.roster$, { initialValue: [] });

  messages: Signal<Message[]> = toSignal(this.chatService.messages$.pipe(
    scan((acc, message) => [message, ...acc], [] as Message[])
  ), { initialValue: [] })

  constructor() {
    // this.chatService.status$.pipe(
    //   filter(status => status === Strophe.Status.DISCONNECTED),
    //   takeUntilDestroyed()
    // ).subscribe(() => this.router.navigate(['login']))
  }

}
