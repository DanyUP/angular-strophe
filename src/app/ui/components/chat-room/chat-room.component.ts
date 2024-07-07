import {Component, inject, input, Signal} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from "@angular/forms";
import {ChatService} from "../../../core/services/chat.service";
import {Message} from "../../../core/models/message.model";
import {toSignal} from "@angular/core/rxjs-interop";
import {scan} from "rxjs";

@Component({
  selector: 'app-chat-room',
  standalone: true,
    imports: [
        ReactiveFormsModule
    ],
  templateUrl: './chat-room.component.html',
  styleUrl: './chat-room.component.scss'
})
export class ChatRoomComponent {
  private chatService = inject(ChatService);
  private fb = inject(FormBuilder);

  user = input.required<string>();
  messages: Signal<Message[]> = toSignal(this.chatService.messages$.pipe(
    scan((acc, message) => [message, ...acc], [] as Message[])
  ), { initialValue: [] })

  messageForm = this.fb.group({
    message: ['']
  });


  sendMessage() {
    if (this.messageForm.valid) {
      const messageFormValue = this.messageForm.getRawValue();
      this.chatService.sendMessage(this.user(), messageFormValue.message ?? '');
      this.messageForm.patchValue({message: ''});
    }
  }
}
