import {Component, inject} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {FormBuilder, ReactiveFormsModule, Validators} from "@angular/forms";
import {ChatService} from "./services/chat.service";
import {toSignal} from "@angular/core/rxjs-interop";
import {map} from "rxjs";
import Strophe from "strophe.js";

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

  title = 'angular-chat';
  connected = toSignal(this.chatService.status$.pipe(
    map(status => status === Strophe.Status.CONNECTED)
  ), { initialValue: false });

  loginForm = this.fb.nonNullable.group({
    jid: ['', [Validators.required]],
    password: ['', Validators.required]
  });

  messageForm = this.fb.group({
    destUser: ['', Validators.required],
    message: ['']
  });

  login() {
    if (this.loginForm.valid) {
      const loginFormValue = this.loginForm.getRawValue();
      this.chatService.connect(loginFormValue.jid, loginFormValue.password)
    }
  }

}
