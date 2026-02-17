import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, NgForm } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { email } from "@angular/forms/signals";

import { HttpClient } from "@angular/common/http";
import { environment } from "../../../environments/environment";

type Role = 'CUSTOMER' | 'RESTAURANT_OWNER';

type Region = { id: number; name: string };

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
        email: '',
        firstName: '',
        lastName: '',
        password: '',
        repeatPassword: '',
        address: '',
        regionId: null as number | null,
    };

    regions: Region[] = [];

    error = '';
    loading = false;

    constructor(private router: Router, private http: HttpClient) {
        this.loadRegions();
    }

    // load available regions from backend
    loadRegions() {
        this.http.get<Region[]>(`${environment.apiUrl}/regions`).subscribe({
            next: (r) => (this.regions = r),
            error: () => { }
        });
    }

    // form submission: user data to backend
    onSubmit(form: NgForm) {
        this.error = '';
        if (form.invalid) return;

        // error message if password is not the same
        if (this.model.password !== this.model.repeatPassword) {
            this.error = 'Passwords do not match.';
            return;
        }

        this.loading = true;

        const payload = {
            username: this.model.username,
            email: this.model.email,
            firstName: this.model.firstName,
            lastName: this.model.lastName,
            password: this.model.password,
            role: this.model.role,
            address: this.model.address,
            regionId: this.model.regionId,
        };

        this.http.post<{ userId: number, role: Role }>(`${environment.apiUrl}/auth/signup`, payload).subscribe({
            next: (data) => {
                this.loading = false;
                if (data.role === 'RESTAURANT_OWNER') {
                    // move to restaurant sign up
                    this.router.navigateByUrl('/auth/signup/restaurant', { state: { userId: data.userId } });
                } else {
                    // move to login
                    this.router.navigateByUrl('/auth/login');
                }
            },
            error: (err) => {
                this.loading = false;
                this.error = err?.error?.message ?? 'Sign up failed.';
            }
        });
    }
}