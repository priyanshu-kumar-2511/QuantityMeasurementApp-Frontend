import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class SignupComponent {
  name = '';
  mobile = '';
  email = '';
  password = '';
  loading = false;
  errorMsg = '';
  successMsg = '';

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit(form: NgForm): void {
    if (form.invalid) return;
    this.loading = true;
    this.errorMsg = '';
    this.successMsg = '';

    const nameParts = this.name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || firstName;

    this.authService
      .signup({
        firstName,
        lastName,
        mobileNo: this.mobile,
        email: this.email,
        password: this.password,
      })
      .subscribe({
        next: () => {
          this.loading = false;
          this.successMsg = 'Account created! Redirecting to login...';
          setTimeout(() => this.router.navigate(['/login']), 1500);
        },
        error: (err) => {
          this.loading = false;
          this.errorMsg =
            err?.error?.message ||
            err?.error?.error ||
            'Registration failed. Please try again.';
        },
      });
  }

  loginWithGoogle(): void {
    this.authService.loginWithGoogle();
  }
}