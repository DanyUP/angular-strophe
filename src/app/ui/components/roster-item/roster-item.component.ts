import {Component, input} from '@angular/core';
import {RosterItem} from "../../../core/models/roster-item.model";
import {NgClass} from "@angular/common";

@Component({
  selector: 'app-roster-item',
  standalone: true,
  imports: [
    NgClass
  ],
  templateUrl: './roster-item.component.html',
  styleUrl: './roster-item.component.scss'
})
export class RosterItemComponent {
  user = input.required<RosterItem>();
}
