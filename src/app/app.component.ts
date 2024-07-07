import {Component, inject, Signal} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {FormBuilder, ReactiveFormsModule, Validators} from "@angular/forms";
import {ChatService} from "./services/chat.service";
import {takeUntilDestroyed, toSignal} from "@angular/core/rxjs-interop";
import {map, scan} from "rxjs";
import {Strophe} from "strophe.js";
import {Message} from "./models/message.model";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ReactiveFormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  private fb = inject(FormBuilder);
  private chatService = inject(ChatService);

  readonly Status = Strophe.Status;

  title = 'angular-chat';
  connectionStatus = toSignal(
    this.chatService.status$,
    { initialValue: Strophe.Status.DISCONNECTED as number }
  );

  messages: Signal<Message[]> = toSignal(this.chatService.messages$.pipe(
    scan((acc, message) => [message, ...acc], [] as Message[])
  ), { initialValue: [] })

  loginForm = this.fb.nonNullable.group({
    jid: ['', [Validators.required]],
    password: ['', Validators.required]
  });

  messageForm = this.fb.group({
    destUser: this.fb.nonNullable.control('', Validators.required),
    message: ['']
  });

  constructor() {
    this.chatService.log$.pipe(
      takeUntilDestroyed()
    ).subscribe((textLog) => console.log(textLog));
  }

  login() {
    if (this.loginForm.valid) {
      const loginFormValue = this.loginForm.getRawValue();
      this.chatService.connect(loginFormValue.jid, loginFormValue.password)
    }
  }

  sendMessage() {
    if (this.messageForm.valid) {
      const messageFormValue = this.messageForm.getRawValue();
      this.chatService.sendMessage(messageFormValue.destUser, messageFormValue.message ?? '');
      this.messageForm.patchValue({message: ''});
    }
  }

}
