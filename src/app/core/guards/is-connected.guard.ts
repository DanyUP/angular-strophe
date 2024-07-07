import {CanActivateFn, Router} from '@angular/router';
import {inject} from "@angular/core";
import {ChatService} from "../services/chat.service";
import {map} from "rxjs";
import {Strophe} from "strophe.js";

export const isConnectedGuard: CanActivateFn = (route, state) => {
  const chatService = inject(ChatService);
  const router = inject(Router);
  return chatService.status$.pipe(
    map(status => {
      if (status === Strophe.Status.CONNECTED) {
        return true;
      } else {
        return router.createUrlTree(['login']);
      }
    })
  )
};
