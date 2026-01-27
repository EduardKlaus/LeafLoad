import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

type Role = 'CUSTOMER' | 'RESTAURANT_OWNER';

type UserProfile = {
  username: string;
  name: string;
  email: string;
  role: Role;
  createdOn: string; // ISO string
};

type EditableField = 'name' | 'email' | 'password';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './account.html',
  styleUrls: ['./account.scss'],
})
export class AccountComponent implements OnInit {
    private readonly API_ME = '/account/me';

    isLoading = false;
    error = '';

    profile: UserProfile | null = null;
    savingField: EditableField | null = null;
    editField: EditableField | null = null;

    // Edit buffers
    editName = '';
    editEmail = '';
    // Passwort wird nicht angezeigt, nur neu gesetzt
    newPassword = '';
    newPasswordRepeat = '';

    constructor(private http: HttpClient) {}

    ngOnInit(): void {
        this.loadProfile();
    }

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

    cancelEdit(): void {
        this.error = '';
        this.editField = null;
        this.resetEditBuffers();
    }

    saveName(): void {
        if (!this.profile) return;
        const value = this.editName.trim();
        if (!value) {
        this.error = 'Field cannot be empty.';
        return;
        }
        this.patchAndUpdate('name', value);
    }

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

    private patchAndUpdate(field: 'name' | 'email', value: string): void {
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

    private resetEditBuffers(): void {
        if (!this.profile) return;
        this.editName = this.profile.name;
        this.editEmail = this.profile.email;
    }
}