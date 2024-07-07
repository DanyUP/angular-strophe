import {Component, inject} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from "@angular/forms";
import {ChatService} from "../../core/services/chat.service";
import {takeUntilDestroyed, toSignal} from "@angular/core/rxjs-interop";
import {Strophe} from "strophe.js";
import {filter} from "rxjs";
import {Router} from "@angular/router";

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private chatService = inject(ChatService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  readonly Status = Strophe.Status;

  loginForm = this.fb.nonNullable.group({
    jid: ['', [Validators.required]],
    password: ['', Validators.required]
  });

  connectionStatus = toSignal(
    this.chatService.status$,
    { initialValue: Strophe.Status.DISCONNECTED as number }
  );

  constructor() {
    this.chatService.status$.pipe(
      filter(status => status === Strophe.Status.CONNECTED),
      takeUntilDestroyed()
    ).subscribe(() => this.router.navigate(['chat']))
  }

  login() {
    if (this.loginForm.valid) {
      const loginFormValue = this.loginForm.getRawValue();
      this.chatService.connect(loginFormValue.jid, loginFormValue.password)
    }
  }
}
