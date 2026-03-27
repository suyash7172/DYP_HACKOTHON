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
            <span class="material-icons-outlined">refresh</span>
            Refresh
          </button>
          <button class="btn btn-primary" (click)="simulateAndAnalyze()">
            <span class="material-icons-outlined">play_arrow</span>
            Simulate + Analyze
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div class="loading-state" *ngIf="loading">
        <div class="spinner"></div>
        <p>Loading dashboard data...</p>
      </div>

      <div *ngIf="!loading">
        <!-- Stat Cards -->
        <div class="grid-4 mb-32">
          <div class="stat-card animate-in">
            <div class="stat-icon" style="background: rgba(99, 102, 241, 0.15); color: var(--accent-primary-light)">
              <span class="material-icons-outlined">receipt_long</span>
            </div>
            <div class="stat-value">{{ overview?.total_transactions || 0 }}</div>
            <div class="stat-label">Total Transactions</div>
            <div class="stat-glow purple"></div>
          </div>
          
          <div class="stat-card animate-in">
            <div class="stat-icon" style="background: rgba(239, 68, 68, 0.15); color: #f87171">
              <span class="material-icons-outlined">gpp_bad</span>
            </div>
            <div class="stat-value text-danger">{{ overview?.fraud_count || 0 }}</div>
            <div class="stat-label">Fraudulent Detected</div>
            <div class="stat-change negative" *ngIf="overview?.fraud_rate">
              <span class="material-icons-outlined">trending_up</span>
              {{ overview?.fraud_rate }}% Fraud Rate
            </div>
            <div class="stat-glow red"></div>
          </div>
          
          <div class="stat-card animate-in">
            <div class="stat-icon" style="background: rgba(16, 185, 129, 0.15); color: #34d399">
              <span class="material-icons-outlined">verified</span>
            </div>
            <div class="stat-value text-success">{{ overview?.legit_count || 0 }}</div>
            <div class="stat-label">Legitimate</div>
            <div class="stat-glow green"></div>
          </div>
          
          <div class="stat-card animate-in">
            <div class="stat-icon" style="background: rgba(245, 158, 11, 0.15); color: #fbbf24">
              <span class="material-icons-outlined">attach_money</span>
            </div>
            <div class="stat-value">\${{ formatAmount(overview?.blocked_amount || 0) }}</div>
            <div class="stat-label">Blocked Amount</div>
            <div class="stat-glow yellow"></div>
          </div>
        </div>

        <!-- Charts Row -->
        <div class="grid-2 mb-32">
          <div class="card animate-in">
            <div class="card-header">
              <h3>Fraud vs Legitimate Distribution</h3>
              <span class="badge badge-low">Live</span>
            </div>
            <div class="chart-container">
              <canvas #fraudPieChart></canvas>
            </div>
          </div>
          
          <div class="card animate-in">
            <div class="card-header">
              <h3>Risk Level Distribution</h3>
            </div>
            <div class="chart-container">
              <canvas #riskBarChart></canvas>
            </div>
          </div>
        </div>

        <!-- Hourly Activity Chart -->
        <div class="card mb-32 animate-in">
          <div class="card-header">
            <h3>24-Hour Transaction Activity</h3>
            <div class="chart-legend">
              <span class="legend-item"><span class="dot green"></span> Legitimate</span>
              <span class="legend-item"><span class="dot red"></span> Fraudulent</span>
            </div>
          </div>
          <div class="chart-container wide">
            <canvas #hourlyChart></canvas>
          </div>
        </div>

        <!-- Bottom Section: Category & Recent Flagged-->
        <div class="grid-2">
          <div class="card animate-in">
            <div class="card-header">
              <h3>Fraud by Category</h3>
            </div>
            <div class="chart-container">
              <canvas #categoryChart></canvas>
            </div>
          </div>

          <div class="card animate-in">
            <div class="card-header">
              <h3>Recent Flagged Transactions</h3>
              <a routerLink="/alerts" class="see-all">View All →</a>
            </div>
            <div class="flagged-list">
              <div class="flagged-item" *ngFor="let tx of recentFlagged?.slice(0, 8)">
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
    }
    
    .header-actions {
      display: flex;
      gap: 12px;
    }
    
    .mb-32 { margin-bottom: 32px; }
    
    .text-danger { color: #f87171 !important; }
    .text-success { color: #34d399 !important; }
    
    .stat-card {
      position: relative;
      overflow: hidden;
    }
    
    .stat-glow {
      position: absolute;
      width: 120px;
      height: 120px;
      border-radius: 50%;
      filter: blur(60px);
      opacity: 0.06;
      top: -20px;
      right: -20px;
    }
    
    .stat-glow.purple { background: var(--accent-primary); }
    .stat-glow.red { background: #ef4444; }
    .stat-glow.green { background: #10b981; }
    .stat-glow.yellow { background: #f59e0b; }
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    
    .card-header h3 {
      font-size: 16px;
      font-weight: 600;
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
    
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    
    .dot.green { background: #10b981; }
    .dot.red { background: #ef4444; }
    
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
    }
    
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
      font-size: 14px;
      font-weight: 700;
      margin-bottom: 4px;
    }
    
    .mono { font-family: var(--font-mono); }
    
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 100px 0;
      gap: 16px;
      color: var(--text-muted);
    }
    
    @media (max-width: 768px) {
      .page-header { flex-direction: column; gap: 16px; }
      .header-actions { width: 100%; }
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
        this.loading = false;
        
        setTimeout(() => this.initCharts(), 100);
      },
      error: (err) => {
        console.error('Dashboard error:', err);
        this.loading = false;
      }
    });
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
          cutout: '65%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: '#94a3b8', padding: 16, usePointStyle: true, pointStyleWidth: 8, font: { size: 12 } }
            }
          }
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
            x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 12 } } },
            y: { grid: { color: 'rgba(99, 102, 241, 0.06)' }, ticks: { color: '#64748b' } }
          }
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
            x: { grid: { display: false }, ticks: { color: '#64748b', maxTicksLimit: 12, font: { size: 11 } } },
            y: { grid: { color: 'rgba(99, 102, 241, 0.06)' }, ticks: { color: '#64748b' } }
          }
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
          }
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
