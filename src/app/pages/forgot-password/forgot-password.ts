import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPasswordComponent {
  // Step 1 — Email
  // Step 2 — OTP + New Password
  step = 1;

  email = '';
  newPassword = '';
  confirmPassword = '';
  token = '';

  loading = false;
  errorMsg = '';
  successMsg = '';

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  // ── STEP 1: Send OTP to email ──────────────────────────────────
  sendOtp(form: NgForm): void {
    if (form.invalid) return;
    this.loading = true;
    this.errorMsg = '';

    this.http
      .post(
        `${environment.apiUrl}/api/auth/forgotPassword/${this.email}`,
        {},
        { responseType: 'text' },
      )
      .subscribe({
        next: () => {
          this.loading = false;
          this.successMsg = 'OTP sent to your email!';
          this.step = 2;
        },
        error: (err) => {
          this.loading = false;
          this.errorMsg = err?.error?.message || 'Email not found. Please check and try again.';
        },
      });
  }

  // ── STEP 2: Reset Password ─────────────────────────────────────
  resetPassword(form: NgForm): void {
    if (form.invalid) return;
    if (this.newPassword !== this.confirmPassword) {
      this.errorMsg = 'Passwords do not match!';
      return;
    }
    this.loading = true;
    this.errorMsg = '';

    this.http
      .post(
        `${environment.apiUrl}/api/auth/resetPassword/${this.email}`,
        { otp: this.token, newPassword: this.newPassword, confirmPassword: this.confirmPassword },
        { responseType: 'text' },
      )
      .subscribe({
        next: () => {
          this.loading = false;
          this.successMsg = 'Password reset successful! Redirecting to login...';
          setTimeout(() => this.router.navigate(['/login']), 2000);
        },
        error: (err) => {
          this.loading = false;
          this.errorMsg = err?.error?.message || 'Invalid OTP or OTP expired. Try again.';
        },
      });
  }
}
