import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, NgForm } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../environments/environment";

type Region = { id: number; name: string };

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
        regionId: null as number | null,
    };

    regions: Region[] = [];

    error = '';
    loading = false;

    constructor(private router: Router, private http: HttpClient) {
        // get userId from Route state
        const nav = this.router.getCurrentNavigation();
        this.userId = (nav?.extras?.state as any)?.userId ?? history.state?.userId ?? null;

        this.loadRegions();
    }

    // load available regions from backend
    loadRegions() {
        this.http.get<Region[]>(`${environment.apiUrl}/regions`).subscribe({
            next: (r) => (this.regions = r),
            error: () => { }
        });
    }

    // form submission: restaurant data to backend
    onSubmit(form: NgForm) {
        this.error = '';
        if (form.invalid) return;

        if (!this.userId) {
            this.error = 'Missing user reference. Please sign up again.';
            return;
        }

        this.loading = true;

        const payload = {
            ownerId: this.userId,
            name: this.model.name,
            address: this.model.address,
            imageUrl: this.model.imageUrl,
            regionId: this.model.regionId,
        };

        this.http.post(`${environment.apiUrl}/auth/signup/restaurant`, payload).subscribe({
            next: () => {
                this.loading = false;
                this.router.navigateByUrl('/auth/login');
            },
            error: (err) => {
                this.loading = false;
                this.error = err?.error?.message ?? 'Creating restaurant failed.';
            }
        });
    }
}