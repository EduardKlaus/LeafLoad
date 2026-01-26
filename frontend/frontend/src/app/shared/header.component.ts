import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './header.component.html',
    styleUrl: './header.component.scss',
})

export class HeaderComponent {
    region: string | null = null;
}