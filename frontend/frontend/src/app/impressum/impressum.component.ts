// impressum.component.ts
import { Component } from '@angular/core';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-impressum',
  imports: [DatePipe],
  templateUrl: './impressum.html',
  styleUrls: ['./impressum.scss'],
})
export class ImpressumComponent {
  // Für die "Stand:"-Zeile im Footer
  today = new Date();
}
