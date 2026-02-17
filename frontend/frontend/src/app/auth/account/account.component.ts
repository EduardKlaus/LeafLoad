import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth.service';
import { Subscription, filter, take, switchMap } from 'rxjs';

//console.log('Account ngOnInit', Date.now());

type Role = 'CUSTOMER' | 'RESTAURANT_OWNER';

type UserProfile = {
    username: string;
    name: string;
    email: string;
    role: Role;
    createdOn: string; // ISO string

    address?: string | null;
    regionId?: number | null;
    regionName?: string | null;
};

// fields that can be edited
type EditableField = 'name' | 'email' | 'password' | 'address' | 'regionId';

type Region = { id: number; name: string };

@Component({
    selector: 'app-account',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './account.html',
    styleUrls: ['./account.scss'],
})
export class AccountComponent implements OnInit, OnDestroy {
    // API endpoint for current user
    private readonly API_ME = `${environment.apiUrl}/account/me`;
    // subscription used to wait for auth to be ready
    private authSub?: Subscription;

    isLoading = false;
    error = '';

    profile: UserProfile | null = null;
    savingField: EditableField | null = null;
    editField: EditableField | null = null;

    // Edit buffers (local string fields prevent modifying the live profile object)
    editName = '';
    editEmail = '';
    // password is not displayed, only set via field for old and new password
    newPassword = '';
    newPasswordRepeat = '';

    regions: Region[] = [];
    editAddress = '';
    editRegionId: number | null = null;

    constructor(
        private http: HttpClient,
        private authService: AuthService
    ) { }

    ngOnInit(): void {
        // Wait for auth to be ready (localStorage loaded), then check if logged in
        this.authSub = this.authService.authReady$.pipe(
            take(1),
            switchMap(() => this.authService.state$.pipe(
                filter(state => state.isLoggedIn && state.userId != null),
                take(1)
            ))
        ).subscribe(() => {
            this.loadProfile();
        });

        this.loadRegions();
    }

    ngOnDestroy(): void {
        // cleanup to prevent subscriptions from staying active after component is destroyed
        this.authSub?.unsubscribe();
    }

    // fetches user profile from backend and initializes edit buffers
    loadProfile(): void {
        this.isLoading = true;
        this.error = '';

        this.http.get<UserProfile>(this.API_ME).subscribe({
            next: (p) => {
                this.profile = p;
                this.resetEditBuffers();
                this.isLoading = false;
            },
            error: (err) => {
                this.isLoading = false;
                this.error = err?.error?.message ?? 'Could not load Profile.';
            },
        });
    }

    // enables editing for a specific field and initializes buffers
    startEdit(field: EditableField): void {
        if (!this.profile) return;
        this.error = '';
        this.editField = field;

        // Buffers initialisieren
        if (field === 'name') this.editName = this.profile.name;
        if (field === 'email') this.editEmail = this.profile.email;

        if (field === 'password') {
            this.newPassword = '';
            this.newPasswordRepeat = '';
        }
    }

    // cancels editing and resets buffers
    cancelEdit(): void {
        this.error = '';
        this.editField = null;
        this.resetEditBuffers();
    }

    // saves name after validation
    saveName(): void {
        if (!this.profile) return;
        const value = this.editName.trim();
        if (!value) {
            this.error = 'Field cannot be empty.';
            return;
        }
        this.patchAndUpdate('name', value);
    }

    // saves email after validation
    saveEmail(): void {
        if (!this.profile) return;
        const value = this.editEmail.trim();
        if (!value) {
            this.error = 'Field cannot be empty.';
            return;
        }
        if (!value.includes('@')) {
            this.error = 'Please enter a valid E-Mail-Address.';
            return;
        }
        this.patchAndUpdate('email', value);
    }

    // saves password after validation
    savePassword(): void {
        if (!this.profile) return;

        if (this.newPassword !== this.newPasswordRepeat) {
            this.error = 'Passwords do not match.';
            return;
        }

        this.savingField = 'password';
        this.error = '';

        this.http.patch(this.API_ME, { password: this.newPassword }).subscribe({
            next: () => {
                this.savingField = null;
                this.editField = null;
                this.newPassword = '';
                this.newPasswordRepeat = '';
            },
            error: (err) => {
                this.savingField = null;
                this.error = err?.error?.message ?? 'Could not change password.';
            },
        });
    }

    // updates (patches) a single field and updates the profile
    private patchAndUpdate(field: 'name' | 'email' | 'address', value: string): void {
        if (!this.profile) return;

        this.savingField = field;
        this.error = '';

        this.http.patch<Partial<UserProfile>>(this.API_ME, { [field]: value }).subscribe({
            next: (res) => {
                // Update lokal (entweder Response-Values oder den gesendeten Value)
                this.profile = {
                    ...this.profile!,
                    [field]: (res as any)?.[field] ?? value,
                } as UserProfile;

                this.savingField = null;
                this.editField = null;
                this.resetEditBuffers();
            },
            error: (err) => {
                this.savingField = null;
                this.error = err?.error?.message ?? 'Changes could not be saved.';
            },
        });
    }

    // resets the edit buffers
    private resetEditBuffers(): void {
        if (!this.profile) return;
        this.editName = this.profile.name;
        this.editEmail = this.profile.email;
    }

    // loads available regions from backend
    loadRegions(): void {
        this.http.get<Region[]>(`${environment.apiUrl}/regions`).subscribe({
            next: (r) => (this.regions = r),
            error: () => { } // optional
        });
    }

    // saves address after validation
    saveAddress(): void {
        const value = this.editAddress.trim();
        this.patchAndUpdate('address', value);
    }

    // saves region after validation
    saveRegion(): void {
        if (this.editRegionId == null) {
            this.error = 'Bitte eine Region auswählen.';
            return;
        }

        this.savingField = 'regionId';
        this.http.patch<Partial<UserProfile>>(this.API_ME, { regionId: this.editRegionId }).subscribe({
            next: (res) => {
                this.savingField = null;
                this.editField = null;
                if (this.profile) {
                    this.profile.regionId = (res as any)?.regionId ?? this.editRegionId;
                    this.profile.regionName = (res as any)?.regionName;
                }
            },
            error: (err) => {
                this.savingField = null;
                this.error = err?.error?.message ?? 'Region konnte nicht gespeichert werden.';
            }
        });
    }
}