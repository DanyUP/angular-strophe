import { Routes } from '@angular/router';
import {LoginComponent} from "./pages/login/login.component";
import {ChatComponent} from "./pages/chat/chat.component";
import {isConnectedGuard} from "./core/guards/is-connected.guard";

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'chat',
    canActivate: [isConnectedGuard],
    component: ChatComponent
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
