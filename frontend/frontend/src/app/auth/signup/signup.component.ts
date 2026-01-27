import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, NgForm } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { email } from "@angular/forms/signals";

type Role = 'CUSTOMER' | 'RESTAURANT_OWNER';

@Component({
    selector: 'app-signup',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './signup.html',
    styleUrls: ['./signup.scss'],
})
export class SignupComponent {
    model = {
        role: 'CUSTOMER' as Role,
        username: '',
        firstName: '',
        lastName: '',
        password: '',
        repeatPassword: '',
    };

    error = '';
    loading = false;

    constructor(private router: Router) {}

    async onSubmit(form: NgForm) {
        this.error = '';
        if(form.invalid) return;

        // error message if password is not the same
        if (this.model.password !== this.model.repeatPassword) {
            this.error = 'Passwords do not match.';
            return;
        }

        this.loading = true;
        try {
            // backend call to create user
            const result = await fetch(
                'http://localhost:3000/auth/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: this.model.username,
                        firstName: this.model.firstName,
                        lastName: this.model.lastName,
                        password: this.model.password,
                        role: this.model.role,
                    }),
            });

            // error message if signup fail
            if (!result.ok) {
                const msg = await result.text();
                throw new Error(msg || 'Sign up failed.');
            }

            const data: { userId: number, role: Role } = await result.json();

            if (data.role === 'RESTAURANT_OWNER') {
                // move to restaurant sign up
                this.router.navigateByUrl('/auth/signup/restaurant', { state: { userId: data.userId} });
            } else {
                // move to login
                this.router.navigateByUrl('/auth/login');
            }
        } catch (e: any) {
            this.error = e?.messaage ?? 'Sign up failed.';
        } finally {
            this.loading = false;
        }
    }
}