import {Component, input} from '@angular/core';
import {RosterItem} from "../../../core/models/roster-item.model";
import {RosterItemComponent} from "../roster-item/roster-item.component";

@Component({
  selector: 'app-roster',
  standalone: true,
  imports: [
    RosterItemComponent
  ],
  templateUrl: './roster.component.html',
  styleUrl: './roster.component.scss'
})
export class RosterComponent {

  users = input.required<RosterItem[]>();

}
