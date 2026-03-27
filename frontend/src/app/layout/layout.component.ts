import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="app-layout">
      <!-- Sidebar -->
      <aside class="sidebar" [class.collapsed]="sidebarCollapsed">
        <div class="sidebar-header">
          <div class="logo" *ngIf="!sidebarCollapsed">
            <div class="logo-icon">
              <span class="material-icons-outlined">shield</span>
            </div>
            <div class="logo-text">
              <h1>SecurePay</h1>
              <span>AI</span>
            </div>
          </div>
          <div class="logo-mini" *ngIf="sidebarCollapsed">
            <div class="logo-icon small">
              <span class="material-icons-outlined">shield</span>
            </div>
          </div>
        </div>
        
        <nav class="sidebar-nav">
          <div class="nav-section">
            <div class="nav-label" *ngIf="!sidebarCollapsed">MAIN</div>
            <a routerLink="/dashboard" routerLinkActive="active" class="nav-item" [attr.title]="sidebarCollapsed ? 'Dashboard' : null">
              <span class="material-icons-outlined">dashboard</span>
              <span class="nav-text" *ngIf="!sidebarCollapsed">Dashboard</span>
            </a>
            <a routerLink="/transactions" routerLinkActive="active" class="nav-item" [attr.title]="sidebarCollapsed ? 'Transactions' : null">
              <span class="material-icons-outlined">receipt_long</span>
              <span class="nav-text" *ngIf="!sidebarCollapsed">Transactions</span>
            </a>
            <a routerLink="/fraud-detection" routerLinkActive="active" class="nav-item" [attr.title]="sidebarCollapsed ? 'Fraud Detection' : null">
              <span class="material-icons-outlined">psychology</span>
              <span class="nav-text" *ngIf="!sidebarCollapsed">Fraud Detection</span>
            </a>
          </div>
          
          <div class="nav-section">
            <div class="nav-label" *ngIf="!sidebarCollapsed">SECURITY</div>
            <a routerLink="/blockchain" routerLinkActive="active" class="nav-item" [attr.title]="sidebarCollapsed ? 'Blockchain' : null">
              <span class="material-icons-outlined">link</span>
              <span class="nav-text" *ngIf="!sidebarCollapsed">Blockchain</span>
            </a>
            <a routerLink="/analytics" routerLinkActive="active" class="nav-item" [attr.title]="sidebarCollapsed ? 'Analytics' : null">
              <span class="material-icons-outlined">analytics</span>
              <span class="nav-text" *ngIf="!sidebarCollapsed">Analytics</span>
            </a>
            <a routerLink="/alerts" routerLinkActive="active" class="nav-item" [attr.title]="sidebarCollapsed ? 'Alerts' : null">
              <span class="material-icons-outlined">notifications_active</span>
              <span class="nav-text" *ngIf="!sidebarCollapsed">Alerts</span>
            </a>
          </div>
        </nav>
        
        <div class="sidebar-footer">
          <div class="user-card" *ngIf="!sidebarCollapsed">
            <div class="user-avatar">{{ getUserInitials() }}</div>
            <div class="user-info">
              <div class="user-name">{{ authService.currentUser?.name }}</div>
              <div class="user-role">{{ authService.currentUser?.role | titlecase }}</div>
            </div>
            <button class="btn-ghost logout-btn" (click)="logout()">
              <span class="material-icons-outlined">logout</span>
            </button>
          </div>
          <button class="btn-ghost logout-mini" *ngIf="sidebarCollapsed" (click)="logout()" title="Logout">
            <span class="material-icons-outlined">logout</span>
          </button>
        </div>
      </aside>
      
      <!-- Main Content -->
      <main class="main-content">
        <header class="top-header">
          <button class="btn-icon toggle-btn" (click)="sidebarCollapsed = !sidebarCollapsed">
            <span class="material-icons-outlined">{{ sidebarCollapsed ? 'menu' : 'menu_open' }}</span>
          </button>
          
          <div class="header-right">
            <div class="header-badge live-badge">
              <span class="live-dot"></span>
              <span>Live Monitoring</span>
            </div>
            <div class="header-badge network-badge">
              <span class="material-icons-outlined">link</span>
              <span>Polygon Amoy</span>
            </div>
          </div>
        </header>
        
        <div class="content-area">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .app-layout {
      display: flex;
      min-height: 100vh;
      background: var(--bg-primary);
    }
    
    /* ======= Sidebar ======= */
    .sidebar {
      width: var(--sidebar-width);
      background: var(--bg-secondary);
      border-right: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: fixed;
      top: 0;
      left: 0;
      height: 100vh;
      z-index: 100;
    }
    
    .sidebar.collapsed {
      width: 72px;
    }
    
    .sidebar-header {
      padding: 24px 20px;
      border-bottom: 1px solid var(--border-color);
    }
    
    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .logo-icon {
      width: 40px;
      height: 40px;
      background: var(--gradient-primary);
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
    }
    
    .logo-icon .material-icons-outlined {
      font-size: 22px;
      color: white;
    }
    
    .logo-icon.small {
      width: 36px;
      height: 36px;
    }
    
    .logo-icon.small .material-icons-outlined { font-size: 20px; }
    
    .logo-mini {
      display: flex;
      justify-content: center;
    }
    
    .logo-text h1 {
      font-size: 18px;
      font-weight: 800;
      line-height: 1;
    }
    
    .logo-text span {
      font-size: 11px;
      font-weight: 700;
      background: var(--gradient-primary);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    
    .sidebar-nav {
      flex: 1;
      padding: 16px 12px;
      overflow-y: auto;
    }
    
    .nav-section {
      margin-bottom: 24px;
    }
    
    .nav-label {
      font-size: 10px;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 1.5px;
      padding: 0 12px;
      margin-bottom: 8px;
    }
    
    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 11px 14px;
      border-radius: var(--radius-sm);
      color: var(--text-secondary);
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s;
      margin-bottom: 2px;
    }
    
    .nav-item:hover {
      background: rgba(99, 102, 241, 0.08);
      color: var(--text-primary);
    }
    
    .nav-item.active {
      background: rgba(99, 102, 241, 0.12);
      color: var(--accent-primary-light);
      box-shadow: inset 3px 0 0 var(--accent-primary);
    }
    
    .nav-item .material-icons-outlined {
      font-size: 20px;
    }
    
    .sidebar.collapsed .nav-item {
      justify-content: center;
      padding: 11px;
    }
    
    /* ======= Sidebar Footer ======= */
    .sidebar-footer {
      padding: 16px;
      border-top: 1px solid var(--border-color);
    }
    
    .user-card {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px;
      border-radius: var(--radius-sm);
      background: rgba(99, 102, 241, 0.06);
    }
    
    .user-avatar {
      width: 36px;
      height: 36px;
      min-width: 36px;
      border-radius: 50%;
      background: var(--gradient-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 700;
      color: white;
    }
    
    .user-info { flex: 1; min-width: 0; }
    .user-name { font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .user-role { font-size: 11px; color: var(--text-muted); }
    
    .logout-btn { padding: 6px; }
    .logout-btn .material-icons-outlined { font-size: 18px; }
    
    .logout-mini {
      width: 100%;
      display: flex;
      justify-content: center;
      cursor: pointer;
      background: none;
      border: none;
      color: var(--text-secondary);
      padding: 8px;
    }
    
    /* ======= Main Content ======= */
    .main-content {
      flex: 1;
      margin-left: var(--sidebar-width);
      transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    
    .sidebar.collapsed ~ .main-content {
      margin-left: 72px;
    }
    
    .top-header {
      height: var(--header-height);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 32px;
      border-bottom: 1px solid var(--border-color);
      background: rgba(10, 14, 26, 0.8);
      backdrop-filter: blur(20px);
      position: sticky;
      top: 0;
      z-index: 50;
    }
    
    .toggle-btn {
      background: transparent;
      border: 1px solid var(--border-color);
    }
    
    .header-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .header-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
    }
    
    .live-badge {
      background: rgba(16, 185, 129, 0.1);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.2);
    }
    
    .live-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      animation: glow 2s infinite;
    }
    
    .network-badge {
      background: rgba(99, 102, 241, 0.1);
      color: var(--accent-primary-light);
      border: 1px solid rgba(99, 102, 241, 0.2);
    }
    
    .network-badge .material-icons-outlined { font-size: 14px; }
    
    .content-area {
      flex: 1;
      padding: 32px;
      overflow-y: auto;
    }
    
    @media (max-width: 768px) {
      .sidebar { transform: translateX(-100%); }
      .sidebar:not(.collapsed) { transform: translateX(0); }
      .main-content { margin-left: 0 !important; }
    }
  `]
})
export class LayoutComponent {
  sidebarCollapsed = false;

  constructor(public authService: AuthService, private router: Router) {}

  getUserInitials(): string {
    const name = this.authService.currentUser?.name || 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  logout() {
    this.authService.logout();
  }
}
