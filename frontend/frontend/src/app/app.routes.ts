import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./home/home.component').then(m => m.HomeComponent) },
  { path: 'auth/login', component: LoginComponent },
  { path: 'auth/signup', loadComponent: () => import('./auth/signup/signup.component').then(m => m.SignupComponent)},
  { path: 'auth/signup/restaurant', loadComponent: () => import('./auth/signup-restaurant/signup-restaurant.component').then(m => m.SignupRestaurantComponent)},

  { path: '**', redirectTo: '' },
];
