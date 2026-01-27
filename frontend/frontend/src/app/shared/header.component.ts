import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth/auth.service';

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
})

export class HeaderComponent {
    region: string | null = null;

    menuOpen = false;

    constructor(private auth: AuthService) {}

    get state$() {
        return this.auth.state$;
    }

    toggleMenu() {
        this.menuOpen = !this.menuOpen;
    }

    closeMenu() {
        this.menuOpen = false;
    }
    
    // placeholder for later
    demoLoginCustomer() { this.auth.loginCustomer(); }
    demoLoginOwner() { this.auth.loginOwner(); }
    demoLogout() { this.auth.logout(); }
}