import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard">
      <div class="page-header">
        <div>
          <h1>Dashboard Overview</h1>
          <p>Real-time fraud monitoring and analytics</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" (click)="refreshData()">
            <span class="material-icons-outlined" [class.spin]="loading">refresh</span>
            Refresh
          </button>
          <button class="btn btn-primary" (click)="simulateAndAnalyze()" [disabled]="loading">
            <span class="material-icons-outlined">play_arrow</span>
            Simulate + Analyze
          </button>
        </div>
      </div>

      <!-- Loading Skeleton -->
      <div class="loading-state" *ngIf="loading">
        <div class="skeleton-grid">
          <div class="skeleton-card" *ngFor="let i of [1,2,3,4]">
            <div class="skeleton" style="width: 48px; height: 48px; border-radius: 8px;"></div>
            <div class="skeleton" style="width: 80px; height: 32px; margin-top: 16px;"></div>
            <div class="skeleton" style="width: 120px; height: 14px; margin-top: 8px;"></div>
          </div>
        </div>
      </div>

      <div *ngIf="!loading" class="dashboard-content">
        <!-- Stat Cards with animation -->
        <div class="grid-4 mb-32">
          <div class="stat-card animate-in" *ngFor="let stat of statCards; let i = index"
               [style.animationDelay.ms]="i * 100">
            <div class="stat-icon" [style.background]="stat.iconBg">
              <span class="material-icons-outlined" [style.color]="stat.iconColor">{{ stat.icon }}</span>
            </div>
            <div class="stat-value" [style.color]="stat.valueColor || 'var(--text-primary)'">
              {{ stat.prefix }}{{ stat.value }}{{ stat.suffix }}
            </div>
            <div class="stat-label">{{ stat.label }}</div>
            <div class="stat-change" [ngClass]="stat.changeType" *ngIf="stat.changeText">
              <span class="material-icons-outlined">{{ stat.changeIcon }}</span>
              {{ stat.changeText }}
            </div>
            <div class="stat-glow" [style.background]="stat.glowColor"></div>
            <div class="stat-bar" [style.width.%]="stat.barPercent || 0" [style.background]="stat.barColor"></div>
          </div>
        </div>

        <!-- Charts Row -->
        <div class="grid-2 mb-32">
          <div class="card animate-in" style="animation-delay: 300ms">
            <div class="card-header">
              <h3>Fraud vs Legitimate Distribution</h3>
              <span class="badge badge-low">
                <span class="live-dot-sm"></span> Live
              </span>
            </div>
            <div class="chart-container">
              <canvas #fraudPieChart></canvas>
            </div>
          </div>
          
          <div class="card animate-in" style="animation-delay: 400ms">
            <div class="card-header">
              <h3>Risk Level Distribution</h3>
            </div>
            <div class="chart-container">
              <canvas #riskBarChart></canvas>
            </div>
          </div>
        </div>

        <!-- Hourly Activity Chart -->
        <div class="card mb-32 animate-in" style="animation-delay: 500ms">
          <div class="card-header">
            <h3>24-Hour Transaction Activity</h3>
            <div class="chart-legend">
              <span class="legend-item"><span class="legend-dot green"></span> Legitimate</span>
              <span class="legend-item"><span class="legend-dot red"></span> Fraudulent</span>
            </div>
          </div>
          <div class="chart-container wide">
            <canvas #hourlyChart></canvas>
          </div>
        </div>

        <!-- Bottom Section -->
        <div class="grid-2">
          <div class="card animate-in" style="animation-delay: 600ms">
            <div class="card-header">
              <h3>Fraud by Category</h3>
            </div>
            <div class="chart-container">
              <canvas #categoryChart></canvas>
            </div>
          </div>

          <div class="card animate-in" style="animation-delay: 700ms">
            <div class="card-header">
              <h3>Recent Flagged Transactions</h3>
              <a routerLink="/alerts" class="see-all">View All →</a>
            </div>
            <div class="flagged-list">
              <div class="flagged-item" *ngFor="let tx of recentFlagged?.slice(0, 8); let i = index"
                   [style.animationDelay.ms]="700 + i * 50">
                <div class="flagged-info">
                  <div class="flagged-id mono">{{ tx.id?.slice(0, 8) }}...</div>
                  <div class="flagged-meta">
                    <span>{{ tx.merchant_category }}</span>
                    <span class="separator">•</span>
                    <span>{{ tx.location }}</span>
                  </div>
                </div>
                <div class="flagged-right">
                  <div class="flagged-amount">\${{ tx.amount?.toFixed(2) }}</div>
                  <span class="badge" [ngClass]="'badge-' + tx.risk_level">{{ tx.risk_level }}</span>
                </div>
              </div>
              <div class="empty-state" *ngIf="!recentFlagged?.length">
                <span class="material-icons-outlined" style="font-size:40px; opacity:0.3">check_circle</span>
                <p>No flagged transactions</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard { max-width: 1400px; }
    
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 32px;
      animation: fadeInUp 0.5s ease both;
    }
    
    .header-actions {
      display: flex;
      gap: 12px;
    }
    
    .mb-32 { margin-bottom: 32px; }
    
    .text-danger { color: #f87171 !important; }
    .text-success { color: #34d399 !important; }
    
    .spin { animation: rotate 1s linear infinite; }
    
    /* Stat cards enhanced */
    .stat-card {
      position: relative;
      overflow: hidden;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-glow);
      border-color: var(--border-hover);
    }
    
    .stat-glow {
      position: absolute;
      width: 140px;
      height: 140px;
      border-radius: 50%;
      filter: blur(70px);
      opacity: 0.07;
      top: -30px;
      right: -30px;
      transition: opacity 0.4s;
    }
    .stat-card:hover .stat-glow { opacity: 0.12; }
    
    .stat-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 3px;
      border-radius: 0 3px 0 0;
      transition: width 1.5s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    
    .card-header h3 {
      font-family: var(--font-display);
      font-size: 16px;
      font-weight: 600;
    }
    
    .live-dot-sm {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #10b981;
      display: inline-block;
      animation: glow 2s infinite;
    }
    
    .chart-container {
      position: relative;
      height: 280px;
    }
    
    .chart-container.wide {
      height: 240px;
    }
    
    .chart-container canvas {
      max-height: 100%;
    }
    
    .chart-legend {
      display: flex;
      gap: 16px;
    }
    
    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: var(--text-secondary);
    }
    
    .legend-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    
    .legend-dot.green { background: #10b981; }
    .legend-dot.red { background: #ef4444; }
    
    .see-all {
      font-size: 13px;
      font-weight: 500;
    }
    
    .flagged-list {
      max-height: 380px;
      overflow-y: auto;
    }
    
    .flagged-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid rgba(99, 102, 241, 0.06);
      animation: fadeInUp 0.4s ease both;
      transition: background 0.2s;
    }
    .flagged-item:hover { background: rgba(99, 102, 241, 0.03); }
    
    .flagged-item:last-child { border-bottom: none; }
    
    .flagged-id {
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 2px;
    }
    
    .flagged-meta {
      font-size: 11px;
      color: var(--text-muted);
    }
    
    .separator { margin: 0 4px; }
    
    .flagged-right {
      text-align: right;
    }
    
    .flagged-amount {
      font-family: var(--font-display);
      font-size: 15px;
      font-weight: 700;
      margin-bottom: 4px;
    }
    
    .mono { font-family: var(--font-mono); }
    
    /* Loading skeleton */
    .skeleton-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-bottom: 32px;
    }
    .skeleton-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 24px;
    }
    
    .loading-state {
      animation: fadeIn 0.3s ease;
    }
    
    .dashboard-content {
      animation: fadeIn 0.5s ease;
    }
    
    @media (max-width: 768px) {
      .page-header { flex-direction: column; gap: 16px; }
      .header-actions { width: 100%; }
      .skeleton-grid { grid-template-columns: repeat(2, 1fr); }
    }
  `]
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('fraudPieChart') fraudPieRef!: ElementRef;
  @ViewChild('riskBarChart') riskBarRef!: ElementRef;
  @ViewChild('hourlyChart') hourlyRef!: ElementRef;
  @ViewChild('categoryChart') categoryRef!: ElementRef;

  overview: any = null;
  riskDist: any = null;
  hourlyFraud: number[] = [];
  hourlyLegit: number[] = [];
  categoryFraud: any = {};
  recentFlagged: any[] = [];
  loading = true;
  statCards: any[] = [];

  private charts: Chart[] = [];

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadData();
  }

  ngAfterViewInit() {}

  loadData() {
    this.loading = true;
    this.api.getDashboardOverview().subscribe({
      next: (res) => {
        this.overview = res.overview;
        this.riskDist = res.risk_distribution;
        this.hourlyFraud = res.hourly_fraud;
        this.hourlyLegit = res.hourly_legit;
        this.categoryFraud = res.category_fraud;
        this.recentFlagged = res.recent_flagged;
        this.buildStatCards();
        this.loading = false;
        
        setTimeout(() => this.initCharts(), 100);
      },
      error: (err) => {
        console.error('Dashboard error:', err);
        this.loading = false;
      }
    });
  }

  buildStatCards() {
    const o = this.overview || {};
    const total = o.total_transactions || 0;
    const fraud = o.fraud_count || 0;
    const legit = o.legit_count || 0;
    const blocked = o.blocked_amount || 0;
    const fraudRate = o.fraud_rate || 0;

    this.statCards = [
      {
        icon: 'receipt_long', label: 'Total Transactions',
        value: total.toLocaleString(), prefix: '', suffix: '',
        iconBg: 'rgba(99, 102, 241, 0.15)', iconColor: 'var(--accent-primary-light)',
        glowColor: 'var(--accent-primary)', barPercent: 100, barColor: 'var(--accent-primary)'
      },
      {
        icon: 'gpp_bad', label: 'Fraudulent Detected',
        value: fraud.toLocaleString(), prefix: '', suffix: '',
        valueColor: '#f87171',
        iconBg: 'rgba(239, 68, 68, 0.15)', iconColor: '#f87171',
        glowColor: '#ef4444', changeText: `${fraudRate}% Fraud Rate`, changeType: 'negative', changeIcon: 'trending_up',
        barPercent: Math.min(100, fraudRate * 5), barColor: '#ef4444'
      },
      {
        icon: 'verified', label: 'Legitimate',
        value: legit.toLocaleString(), prefix: '', suffix: '',
        valueColor: '#34d399',
        iconBg: 'rgba(16, 185, 129, 0.15)', iconColor: '#34d399',
        glowColor: '#10b981', barPercent: total > 0 ? (legit / total * 100) : 0, barColor: '#10b981'
      },
      {
        icon: 'attach_money', label: 'Blocked Amount',
        value: this.formatAmount(blocked), prefix: '$', suffix: '',
        iconBg: 'rgba(245, 158, 11, 0.15)', iconColor: '#fbbf24',
        glowColor: '#f59e0b', barPercent: Math.min(100, blocked / 1000), barColor: '#f59e0b'
      }
    ];
  }

  refreshData() {
    this.destroyCharts();
    this.loadData();
  }

  simulateAndAnalyze() {
    this.loading = true;
    this.api.simulateTransactions(30).subscribe({
      next: () => {
        this.api.batchAnalyze().subscribe({
          next: () => {
            this.destroyCharts();
            this.loadData();
          },
          error: () => {
            this.destroyCharts();
            this.loadData();
          }
        });
      },
      error: () => { this.loading = false; }
    });
  }

  destroyCharts() {
    this.charts.forEach(c => c.destroy());
    this.charts = [];
  }

  initCharts() {
    this.destroyCharts();
    
    // Fraud vs Legit Doughnut
    if (this.fraudPieRef) {
      const ch = new Chart(this.fraudPieRef.nativeElement, {
        type: 'doughnut',
        data: {
          labels: ['Legitimate', 'Fraudulent', 'Pending'],
          datasets: [{
            data: [
              this.overview?.legit_count || 0,
              this.overview?.fraud_count || 0,
              this.overview?.pending_count || 0
            ],
            backgroundColor: ['#10b981', '#ef4444', '#6366f1'],
            borderWidth: 0,
            hoverOffset: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '68%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: '#94a3b8', padding: 16, usePointStyle: true, pointStyleWidth: 8, font: { size: 12, family: 'Inter' } }
            }
          },
          animation: { animateScale: true, animateRotate: true }
        }
      });
      this.charts.push(ch);
    }

    // Risk Distribution Bar
    if (this.riskBarRef) {
      const ch = new Chart(this.riskBarRef.nativeElement, {
        type: 'bar',
        data: {
          labels: ['Low', 'Medium', 'High', 'Critical'],
          datasets: [{
            data: [
              this.riskDist?.low || 0,
              this.riskDist?.medium || 0,
              this.riskDist?.high || 0,
              this.riskDist?.critical || 0
            ],
            backgroundColor: [
              'rgba(16, 185, 129, 0.7)',
              'rgba(245, 158, 11, 0.7)',
              'rgba(239, 68, 68, 0.7)',
              'rgba(220, 38, 38, 0.9)'
            ],
            borderRadius: 8,
            borderSkipped: false,
            barThickness: 40
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 12, family: 'Inter' } } },
            y: { grid: { color: 'rgba(99, 102, 241, 0.06)' }, ticks: { color: '#64748b' } }
          },
          animation: { duration: 1200, easing: 'easeOutQuart' }
        }
      });
      this.charts.push(ch);
    }

    // Hourly Activity Line Chart
    if (this.hourlyRef) {
      const hours = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
      const ch = new Chart(this.hourlyRef.nativeElement, {
        type: 'line',
        data: {
          labels: hours,
          datasets: [
            {
              label: 'Legitimate',
              data: this.hourlyLegit,
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              fill: true,
              tension: 0.4,
              pointRadius: 2,
              pointHoverRadius: 6
            },
            {
              label: 'Fraudulent',
              data: this.hourlyFraud,
              borderColor: '#ef4444',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              fill: true,
              tension: 0.4,
              pointRadius: 2,
              pointHoverRadius: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { intersect: false, mode: 'index' },
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { color: '#64748b', maxTicksLimit: 12, font: { size: 11, family: 'Inter' } } },
            y: { grid: { color: 'rgba(99, 102, 241, 0.06)' }, ticks: { color: '#64748b' } }
          },
          animation: { duration: 1500, easing: 'easeOutQuart' }
        }
      });
      this.charts.push(ch);
    }

    // Category Horizontal Bar
    if (this.categoryRef && this.categoryFraud) {
      const cats = Object.keys(this.categoryFraud).sort((a, b) => this.categoryFraud[b] - this.categoryFraud[a]).slice(0, 8);
      const ch = new Chart(this.categoryRef.nativeElement, {
        type: 'bar',
        data: {
          labels: cats,
          datasets: [{
            data: cats.map(c => this.categoryFraud[c]),
            backgroundColor: [
              'rgba(99, 102, 241, 0.7)', 'rgba(139, 92, 246, 0.7)',
              'rgba(6, 182, 212, 0.7)', 'rgba(59, 130, 246, 0.7)',
              'rgba(168, 85, 247, 0.7)', 'rgba(236, 72, 153, 0.7)',
              'rgba(245, 158, 11, 0.7)', 'rgba(16, 185, 129, 0.7)'
            ],
            borderRadius: 6,
            borderSkipped: false
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: 'rgba(99, 102, 241, 0.06)' }, ticks: { color: '#64748b' } },
            y: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 11 } } }
          },
          animation: { duration: 1200, easing: 'easeOutQuart' }
        }
      });
      this.charts.push(ch);
    }
  }

  formatAmount(amount: number): string {
    if (amount >= 1000000) return (amount / 1000000).toFixed(1) + 'M';
    if (amount >= 1000) return (amount / 1000).toFixed(1) + 'K';
    return amount.toFixed(2);
  }
}
