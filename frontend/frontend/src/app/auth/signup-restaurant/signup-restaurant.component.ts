import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, NgForm } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { response } from "express";

@Component({
    selector: 'app-signup-restaurant',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './signup-restaurant.html',
    styleUrls: ['./signup-restaurant.scss'],
})
export class SignupRestaurantComponent {
    userId: number | null = null;

    model = {
        name: '',
        address: '',
        imageUrl: '',
    };

    error = '';
    loading = false;

    constructor(private router: Router) {
        // get userId from Route state?
        const nav = this.router.getCurrentNavigation();
        this.userId = (nav?.extras?.state as any)?.userId ?? history.state?.userId ?? null;
    }

    async onSubmit(form: NgForm) {
        this.error = '';
        if (form.invalid) return;

        if (!this.userId) {
            this.error = 'Missing user reference. Please sign up again.';
            return;
        }

        this.loading = true;

        try {
            const result = await fetch(
                'http://localhost:3000/auth/signup/restaurant', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ownerId: this.userId,
                        name: this.model.name,
                        address: this.model.address,
                        imageUrl: this.model.imageUrl,
                    }),
            });

            if (!result.ok) {
                const msg = await result.text();
                throw new Error(msg || 'Creating restaurant failed.');
            }

            this.router.navigateByUrl('/auth/login');
        } catch (e: any) {
            this.error = e?.messaage ?? 'Creating restaurant failed.';
        } finally {
            this.loading = false;
        }
    }
}