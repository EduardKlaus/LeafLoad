import { Injectable } from "@angular/core";
import { readonly } from "@angular/forms/signals";
import { BehaviorSubject } from "rxjs";

export type UserRole = 'guest' | 'customer' | 'owner';

export interface AuthState {
    isLoggedIn: boolean;
    role: UserRole;
    displayName?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly _state$ = new BehaviorSubject<AuthState>({
        isLoggedIn: false,
        role: 'guest',
    })

    readonly state$ = this._state$.asObservable();

    // placeholder -> later replace with real backend & login
    loginCustomer() : void {
        this._state$.next({ isLoggedIn: true, role:'customer', displayName: 'Customer' });
    }
    loginOwner() : void {
        this._state$.next({ isLoggedIn: true, role:'owner', displayName: 'Owner' });
    }
    logout() : void {
        this._state$.next({ isLoggedIn: false, role:'guest' });
    }
}

