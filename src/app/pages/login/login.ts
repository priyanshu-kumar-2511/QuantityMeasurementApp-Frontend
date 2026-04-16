import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent implements OnInit {
  email = '';
  password = '';
  loading = false;
  errorMsg = '';
  oauthLoading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/measurement']);
    }
  }

  ngOnInit(): void {
    // Handle Google OAuth2 callback — backend redirects to /login?token=<JWT>&refreshToken=<REFRESH>
    this.route.queryParams.subscribe((params) => {
      const token = params['token'];
      const refreshToken = params['refreshToken'];
      const oauthError = params['error'];

      if (oauthError) {
        this.errorMsg = 'Google sign-in failed: ' + decodeURIComponent(oauthError);
        return;
      }

      if (token) {
        this.oauthLoading = true;
        this.authService.handleOAuthCallback(token, refreshToken).subscribe({
          next: () => {
            this.oauthLoading = false;
            this.router.navigate(['/measurement']);
          },
          error: (err) => {
            this.oauthLoading = false;
            this.errorMsg =
              err?.error?.message || 'Google sign-in succeeded but failed to load profile.';
          },
        });
      }
    });
  }

  onSubmit(form: NgForm): void {
    if (form.invalid) return;
    this.loading = true;
    this.errorMsg = '';

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/measurement']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg =
          err?.error?.message || err?.error?.error || 'Invalid email or password.';
      },
    });
  }

  loginWithGoogle(): void {
    this.authService.loginWithGoogle();
  }
}
