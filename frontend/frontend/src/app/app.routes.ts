import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./home/home.component').then(m => m.HomeComponent) },
  
  // Auth
  { path: 'auth/login', component: LoginComponent },
  { path: 'auth/signup', loadComponent: () => import('./auth/signup/signup.component').then(m => m.SignupComponent)},
  { path: 'auth/signup/restaurant', loadComponent: () => import('./auth/signup-restaurant/signup-restaurant.component').then(m => m.SignupRestaurantComponent)},

  { path: 'impressum', loadComponent: () => import('./impressum/impressum.component').then(m => m.ImpressumComponent)},

  // Restaurant & Edits & Orders
  { path: 'restaurants/:id', loadComponent: () => import('./restaurant/restaurant.component').then(m => m.RestaurantComponent) },
  { path: '/restaurants/:id/edit', loadComponent: () => import('./restaurant/restaurant-edit.component').then(m => m.RestaurantEditComponent) },
  { path: '/menu-items/:id/edit', loadComponent: () => import('./restaurant/menu-edit.component').then(m => m.MenuItemEditComponent) },
  //{ path: 'orders', loadComponent: () => import('./orders/orders.component').then(m => m.OrdersComponent) },

  // Account
  { path: 'account', loadComponent: () => import('./auth/account/account.component').then(m => m.AccountComponent) },

  { path: '**', redirectTo: '' },
];
