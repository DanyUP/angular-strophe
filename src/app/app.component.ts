import {Component, inject, Signal} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {FormBuilder, ReactiveFormsModule, Validators} from "@angular/forms";
import {ChatService} from "./core/services/chat.service";
import {takeUntilDestroyed, toSignal} from "@angular/core/rxjs-interop";
import {map, scan} from "rxjs";
import {Strophe} from "strophe.js";
import {Message} from "./core/models/message.model";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ReactiveFormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  private chatService = inject(ChatService);

  constructor() {
    this.chatService.log$.pipe(
      takeUntilDestroyed()
    ).subscribe((textLog) => console.log(textLog));
  }

}
