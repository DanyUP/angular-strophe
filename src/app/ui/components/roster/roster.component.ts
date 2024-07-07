import {Component, input} from '@angular/core';
import {RosterItem} from "../../../core/models/roster-item.model";

@Component({
  selector: 'app-roster',
  standalone: true,
  imports: [],
  templateUrl: './roster.component.html',
  styleUrl: './roster.component.scss'
})
export class RosterComponent {

  users = input.required<RosterItem[]>();

}
