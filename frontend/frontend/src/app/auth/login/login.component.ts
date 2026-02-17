import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule,NgForm } from '@angular/forms';
import { Router, RouterLink } from "@angular/router";
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
})
export class LoginComponent {
  model = {
    username: '',
    password: '',
  };
  
  error = '';

  isLoading = false;

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit(form: NgForm) : void {
    if (form.invalid || this.isLoading) {
      return;
    }

    this.error = '';
    this.isLoading = true;

    this.authService.login(this.model.username, this.model.password).subscribe({
      next: async () => {
        this.isLoading = false;
        await this.router.navigateByUrl('/');
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err?.error?.message ?? 'Login failed.';
      },
    });
  }
}
