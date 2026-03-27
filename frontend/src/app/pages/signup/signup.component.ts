import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-signup',
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
            <p class="tagline">Join the future of secure payment processing</p>
            
            <div class="stats-showcase">
              <div class="stat-item">
                <div class="stat-num">99.7%</div>
                <div class="stat-desc">Detection Accuracy</div>
              </div>
              <div class="stat-item">
                <div class="stat-num">&lt;50ms</div>
                <div class="stat-desc">Response Time</div>
              </div>
              <div class="stat-item">
                <div class="stat-num">24/7</div>
                <div class="stat-desc">Monitoring</div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="auth-right">
          <div class="auth-card">
            <div class="auth-header">
              <h2>Create Account</h2>
              <p>Start protecting transactions today</p>
            </div>
            
            <div class="error-message" *ngIf="error">
              <span class="material-icons-outlined">error_outline</span>
              {{ error }}
            </div>
            
            <form (ngSubmit)="onSignup()" class="auth-form">
              <div class="form-group">
                <label class="form-label">Full Name</label>
                <div class="input-wrapper">
                  <span class="material-icons-outlined input-icon">person</span>
                  <input type="text" class="form-input with-icon" 
                         [(ngModel)]="name" name="name"
                         placeholder="Enter your name"
                         required>
                </div>
              </div>
              
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
                         placeholder="Min. 6 characters"
                         required>
                  <button type="button" class="toggle-password" (click)="showPassword = !showPassword">
                    <span class="material-icons-outlined">{{ showPassword ? 'visibility_off' : 'visibility' }}</span>
                  </button>
                </div>
              </div>
              
              <div class="form-group">
                <label class="form-label">Role</label>
                <select class="form-select" [(ngModel)]="role" name="role">
                  <option value="analyst">Analyst</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              <button type="submit" class="btn btn-primary btn-full" [disabled]="loading">
                <span class="spinner-small" *ngIf="loading"></span>
                <span *ngIf="!loading">Create Account</span>
                <span class="material-icons-outlined" *ngIf="!loading">arrow_forward</span>
              </button>
            </form>
            
            <div class="auth-footer">
              <p>Already have an account? <a routerLink="/login">Sign In</a></p>
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
    
    .auth-bg { position: fixed; inset: 0; z-index: 0; }
    
    .bg-orb { position: absolute; border-radius: 50%; filter: blur(100px); opacity: 0.15; }
    .orb-1 { width: 600px; height: 600px; background: #8b5cf6; top: -200px; left: -100px; animation: float 20s ease-in-out infinite; }
    .orb-2 { width: 400px; height: 400px; background: var(--accent-primary); bottom: -100px; right: -100px; animation: float 25s ease-in-out infinite reverse; }
    .orb-3 { width: 300px; height: 300px; background: var(--accent-secondary); top: 50%; right: 30%; animation: float 15s ease-in-out infinite; }
    
    @keyframes float {
      0%, 100% { transform: translate(0, 0) scale(1); }
      25% { transform: translate(30px, -30px) scale(1.05); }
      50% { transform: translate(-20px, 20px) scale(0.95); }
      75% { transform: translate(20px, 10px) scale(1.02); }
    }
    
    .grid-pattern {
      position: absolute; inset: 0;
      background-image: linear-gradient(rgba(99, 102, 241, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99, 102, 241, 0.03) 1px, transparent 1px);
      background-size: 60px 60px;
    }
    
    .auth-container {
      position: relative; z-index: 1;
      display: grid; grid-template-columns: 1fr 1fr;
      max-width: 1100px; width: 100%; min-height: 680px; margin: 20px;
      border-radius: var(--radius-xl); overflow: hidden;
      box-shadow: var(--shadow-lg), 0 0 60px rgba(99, 102, 241, 0.1);
      border: 1px solid var(--border-color);
    }
    
    .auth-left {
      background: linear-gradient(135deg, #141c2f 0%, #1a1040 100%);
      padding: 60px 48px; display: flex; align-items: center;
      position: relative; overflow: hidden;
    }
    
    .auth-left::after {
      content: ''; position: absolute; top: 0; right: 0;
      width: 1px; height: 100%;
      background: linear-gradient(to bottom, transparent, var(--accent-primary), transparent);
    }
    
    .brand-section { width: 100%; }
    
    .logo { display: flex; align-items: center; gap: 16px; margin-bottom: 12px; }
    
    .logo-icon {
      width: 56px; height: 56px;
      background: var(--gradient-primary);
      border-radius: var(--radius-md);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 8px 30px rgba(99, 102, 241, 0.4);
    }
    .logo-icon .material-icons-outlined { font-size: 28px; color: white; }
    .logo h1 { font-size: 32px; font-weight: 800; }
    .logo h1 span { background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .tagline { font-size: 16px; color: var(--text-secondary); margin-bottom: 48px; }
    
    .stats-showcase { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .stat-item {
      text-align: center; padding: 20px 12px;
      background: rgba(99, 102, 241, 0.08);
      border: 1px solid rgba(99, 102, 241, 0.12);
      border-radius: var(--radius-md);
      animation: fadeInUp 0.6s ease both;
    }
    .stat-item:nth-child(2) { animation-delay: 0.15s; }
    .stat-item:nth-child(3) { animation-delay: 0.3s; }
    .stat-num { font-size: 24px; font-weight: 800; background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .stat-desc { font-size: 11px; color: var(--text-muted); margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
    
    .auth-right { background: var(--bg-secondary); padding: 48px; display: flex; align-items: center; }
    .auth-card { width: 100%; max-width: 400px; margin: 0 auto; }
    .auth-header { margin-bottom: 32px; }
    .auth-header h2 { font-size: 28px; font-weight: 700; margin-bottom: 6px; }
    .auth-header p { color: var(--text-secondary); }
    
    .error-message {
      display: flex; align-items: center; gap: 8px;
      padding: 12px 16px; background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.2);
      border-radius: var(--radius-sm); color: #f87171; font-size: 13px; margin-bottom: 20px;
    }
    .error-message .material-icons-outlined { font-size: 18px; }
    
    .input-wrapper { position: relative; }
    .input-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 20px; }
    .form-input.with-icon { padding-left: 44px; }
    .toggle-password { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 4px; }
    .toggle-password:hover { color: var(--text-secondary); }
    
    .btn-full { width: 100%; justify-content: center; padding: 14px; font-size: 15px; font-weight: 600; margin-top: 8px; }
    .spinner-small { width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: rotate 0.6s linear infinite; }
    .auth-footer { text-align: center; margin-top: 28px; color: var(--text-secondary); font-size: 14px; }
    .auth-footer a { font-weight: 600; }
    
    @media (max-width: 768px) {
      .auth-container { grid-template-columns: 1fr; }
      .auth-left { display: none; }
      .auth-right { padding: 40px 24px; }
    }
  `]
})
export class SignupComponent {
  name = '';
  email = '';
  password = '';
  role = 'analyst';
  showPassword = false;
  loading = false;
  error = '';

  constructor(private authService: AuthService, private router: Router) {}

  onSignup() {
    if (!this.name || !this.email || !this.password) {
      this.error = 'All fields are required';
      return;
    }
    if (this.password.length < 6) {
      this.error = 'Password must be at least 6 characters';
      return;
    }
    
    this.loading = true;
    this.error = '';
    
    this.authService.signup(this.name, this.email, this.password, this.role).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.error || 'Signup failed. Please try again.';
      }
    });
  }
}
