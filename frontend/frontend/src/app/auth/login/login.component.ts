import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule,NgForm } from '@angular/forms';
import { RouterLink } from "@angular/router";

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

  onSubmit(form: NgForm) : void {
    if (form.invalid) {
      return;
    }
    console.log('Login:', this.model);
    this.error = '';
  }
}
