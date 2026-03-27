import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-bg">
        <div class="bg-orb orb-1"></div>
        <div class="bg-orb orb-2"></div>
        <div class="bg-orb orb-3"></div>
        <div class="grid-pattern"></div>
      </div>
      
      <div class="auth-container">
        <div class="auth-left">
          <div class="brand-section">
            <div class="logo">
              <div class="logo-icon">
                <span class="material-icons-outlined">shield</span>
              </div>
              <h1>SecurePay <span>AI</span></h1>
            </div>
            <p class="tagline">AI-Powered Fraud Detection with Blockchain Security</p>
            
            <div class="features-list">
              <div class="feature-item">
                <div class="feature-icon">
                  <span class="material-icons-outlined">psychology</span>
                </div>
                <div>
                  <h3>AI Detection Engine</h3>
                  <p>Real-time fraud analysis using ML models</p>
                </div>
              </div>
              <div class="feature-item">
                <div class="feature-icon blockchain-icon">
                  <span class="material-icons-outlined">link</span>
                </div>
                <div>
                  <h3>Blockchain Verified</h3>
                  <p>Immutable transaction records on Ethereum</p>
                </div>
              </div>
              <div class="feature-item">
                <div class="feature-icon analytics-icon">
                  <span class="material-icons-outlined">analytics</span>
                </div>
                <div>
                  <h3>Real-time Analytics</h3>
                  <p>Live dashboard with fraud insights</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="auth-right">
          <div class="auth-card">
            <div class="auth-header">
              <h2>Welcome Back</h2>
              <p>Sign in to your account to continue</p>
            </div>
            
            <div class="error-message" *ngIf="error">
              <span class="material-icons-outlined">error_outline</span>
              {{ error }}
            </div>
            
            <form (ngSubmit)="onLogin()" class="auth-form">
              <div class="form-group">
                <label class="form-label">Email Address</label>
                <div class="input-wrapper">
                  <span class="material-icons-outlined input-icon">email</span>
                  <input type="email" class="form-input with-icon" 
                         [(ngModel)]="email" name="email"
                         placeholder="Enter your email"
                         required>
                </div>
              </div>
              
              <div class="form-group">
                <label class="form-label">Password</label>
                <div class="input-wrapper">
                  <span class="material-icons-outlined input-icon">lock</span>
                  <input [type]="showPassword ? 'text' : 'password'" class="form-input with-icon" 
                         [(ngModel)]="password" name="password"
                         placeholder="Enter your password"
                         required>
                  <button type="button" class="toggle-password" (click)="showPassword = !showPassword">
                    <span class="material-icons-outlined">{{ showPassword ? 'visibility_off' : 'visibility' }}</span>
                  </button>
                </div>
              </div>
              
              <button type="submit" class="btn btn-primary btn-full" [disabled]="loading">
                <span class="spinner-small" *ngIf="loading"></span>
                <span *ngIf="!loading">Sign In</span>
                <span class="material-icons-outlined" *ngIf="!loading">arrow_forward</span>
              </button>
            </form>
            
            <div class="auth-footer">
              <p>Don't have an account? <a routerLink="/signup">Create Account</a></p>
            </div>
            
            <div class="demo-credentials">
              <p><strong>Demo:</strong> Sign up with any email to get started</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
      background: var(--bg-primary);
    }
    
    .auth-bg {
      position: fixed;
      inset: 0;
      z-index: 0;
    }
    
    .bg-orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(100px);
      opacity: 0.15;
    }
    
    .orb-1 {
      width: 600px;
      height: 600px;
      background: var(--accent-primary);
      top: -200px;
      right: -100px;
      animation: float 20s ease-in-out infinite;
    }
    
    .orb-2 {
      width: 400px;
      height: 400px;
      background: #8b5cf6;
      bottom: -100px;
      left: -100px;
      animation: float 25s ease-in-out infinite reverse;
    }
    
    .orb-3 {
      width: 300px;
      height: 300px;
      background: var(--accent-secondary);
      top: 50%;
      left: 50%;
      animation: float 15s ease-in-out infinite;
    }
    
    @keyframes float {
      0%, 100% { transform: translate(0, 0) scale(1); }
      25% { transform: translate(30px, -30px) scale(1.05); }
      50% { transform: translate(-20px, 20px) scale(0.95); }
      75% { transform: translate(20px, 10px) scale(1.02); }
    }
    
    .grid-pattern {
      position: absolute;
      inset: 0;
      background-image: 
        linear-gradient(rgba(99, 102, 241, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(99, 102, 241, 0.03) 1px, transparent 1px);
      background-size: 60px 60px;
    }
    
    .auth-container {
      position: relative;
      z-index: 1;
      display: grid;
      grid-template-columns: 1fr 1fr;
      max-width: 1100px;
      width: 100%;
      min-height: 640px;
      margin: 20px;
      border-radius: var(--radius-xl);
      overflow: hidden;
      box-shadow: var(--shadow-lg), 0 0 60px rgba(99, 102, 241, 0.1);
      border: 1px solid var(--border-color);
    }
    
    .auth-left {
      background: linear-gradient(135deg, #141c2f 0%, #1a1040 100%);
      padding: 60px 48px;
      display: flex;
      align-items: center;
      position: relative;
      overflow: hidden;
    }
    
    .auth-left::after {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      width: 1px;
      height: 100%;
      background: linear-gradient(to bottom, transparent, var(--accent-primary), transparent);
    }
    
    .brand-section { width: 100%; }
    
    .logo {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 12px;
    }
    
    .logo-icon {
      width: 56px;
      height: 56px;
      background: var(--gradient-primary);
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 30px rgba(99, 102, 241, 0.4);
    }
    
    .logo-icon .material-icons-outlined {
      font-size: 28px;
      color: white;
    }
    
    .logo h1 {
      font-size: 32px;
      font-weight: 800;
      color: var(--text-primary);
    }
    
    .logo h1 span {
      background: var(--gradient-primary);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .tagline {
      font-size: 16px;
      color: var(--text-secondary);
      margin-bottom: 48px;
      line-height: 1.5;
    }
    
    .features-list {
      display: flex;
      flex-direction: column;
      gap: 28px;
    }
    
    .feature-item {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      animation: fadeInUp 0.6s ease both;
    }
    
    .feature-item:nth-child(2) { animation-delay: 0.15s; }
    .feature-item:nth-child(3) { animation-delay: 0.3s; }
    
    .feature-icon {
      width: 44px;
      height: 44px;
      min-width: 44px;
      border-radius: var(--radius-sm);
      background: rgba(99, 102, 241, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .feature-icon .material-icons-outlined { color: var(--accent-primary-light); font-size: 20px; }
    .blockchain-icon { background: rgba(6, 182, 212, 0.15); }
    .blockchain-icon .material-icons-outlined { color: var(--accent-secondary); }
    .analytics-icon { background: rgba(16, 185, 129, 0.15); }
    .analytics-icon .material-icons-outlined { color: var(--accent-success); }
    
    .feature-item h3 {
      font-size: 15px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 2px;
    }
    
    .feature-item p {
      font-size: 13px;
      color: var(--text-muted);
    }
    
    .auth-right {
      background: var(--bg-secondary);
      padding: 60px 48px;
      display: flex;
      align-items: center;
    }
    
    .auth-card {
      width: 100%;
      max-width: 400px;
      margin: 0 auto;
    }
    
    .auth-header {
      margin-bottom: 36px;
    }
    
    .auth-header h2 {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 6px;
    }
    
    .auth-header p {
      color: var(--text-secondary);
    }
    
    .error-message {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.2);
      border-radius: var(--radius-sm);
      color: #f87171;
      font-size: 13px;
      margin-bottom: 24px;
    }
    
    .error-message .material-icons-outlined { font-size: 18px; }
    
    .input-wrapper {
      position: relative;
    }
    
    .input-icon {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
      font-size: 20px;
    }
    
    .form-input.with-icon {
      padding-left: 44px;
    }
    
    .toggle-password {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 4px;
    }
    
    .toggle-password:hover { color: var(--text-secondary); }
    
    .btn-full {
      width: 100%;
      justify-content: center;
      padding: 14px;
      font-size: 15px;
      font-weight: 600;
      margin-top: 8px;
    }
    
    .spinner-small {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: rotate 0.6s linear infinite;
    }
    
    .auth-footer {
      text-align: center;
      margin-top: 28px;
      color: var(--text-secondary);
      font-size: 14px;
    }
    
    .auth-footer a {
      font-weight: 600;
    }
    
    .demo-credentials {
      margin-top: 20px;
      text-align: center;
      padding: 12px;
      background: rgba(99, 102, 241, 0.06);
      border-radius: var(--radius-sm);
      border: 1px dashed var(--border-color);
      font-size: 12px;
      color: var(--text-muted);
    }
    
    @media (max-width: 768px) {
      .auth-container { grid-template-columns: 1fr; }
      .auth-left { display: none; }
      .auth-right { padding: 40px 24px; }
    }
  `]
})
export class LoginComponent {
  email = '';
  password = '';
  showPassword = false;
  loading = false;
  error = '';

  constructor(private authService: AuthService, private router: Router) {
    if (this.authService.isLoggedIn) {
      this.router.navigate(['/dashboard']);
    }
  }

  onLogin() {
    if (!this.email || !this.password) {
      this.error = 'Please enter email and password';
      return;
    }
    
    this.loading = true;
    this.error = '';
    
    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.error || 'Login failed. Please try again.';
      }
    });
  }
}
