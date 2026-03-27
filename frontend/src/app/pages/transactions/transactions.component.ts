import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="transactions-page">
      <div class="page-header">
        <div>
          <h1>Transaction Management</h1>
          <p>View, simulate, and manage financial transactions</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" (click)="loadTransactions()">
            <span class="material-icons-outlined">refresh</span> Refresh
          </button>
          <button class="btn btn-primary" (click)="showSimulate = true">
            <span class="material-icons-outlined">bolt</span> Simulate
          </button>
        </div>
      </div>

      <!-- Simulate Modal -->
      <div class="modal-overlay" *ngIf="showSimulate" (click)="showSimulate = false">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <h3>Simulate Transactions</h3>
          <p class="modal-desc">Generate test transactions with realistic fraud patterns</p>
          <div class="form-group">
            <label class="form-label">Number of Transactions</label>
            <input type="number" class="form-input" [(ngModel)]="simulateCount" min="1" max="100">
          </div>
          <div class="modal-actions">
            <button class="btn btn-secondary" (click)="showSimulate = false">Cancel</button>
            <button class="btn btn-primary" (click)="simulate()" [disabled]="simulating">
              <span class="spinner-small" *ngIf="simulating"></span>
              {{ simulating ? 'Generating...' : 'Generate' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-bar">
        <button class="filter-chip" [class.active]="filterStatus === ''" (click)="filterStatus = ''; loadTransactions()">All</button>
        <button class="filter-chip" [class.active]="filterStatus === 'low'" (click)="filterStatus = 'low'; loadTransactions()">
          <span class="dot-small green"></span> Low Risk
        </button>
        <button class="filter-chip" [class.active]="filterStatus === 'medium'" (click)="filterStatus = 'medium'; loadTransactions()">
          <span class="dot-small yellow"></span> Medium
        </button>
        <button class="filter-chip" [class.active]="filterStatus === 'high'" (click)="filterStatus = 'high'; loadTransactions()">
          <span class="dot-small red"></span> High Risk
        </button>
        <button class="filter-chip" [class.active]="filterStatus === 'critical'" (click)="filterStatus = 'critical'; loadTransactions()">
          <span class="dot-small red pulse"></span> Critical
        </button>
        <button class="filter-chip" [class.active]="filterStatus === 'pending'" (click)="filterStatus = 'pending'; loadTransactions()">
          <span class="dot-small purple"></span> Pending
        </button>
      </div>

      <!-- Success message -->
      <div class="toast success" *ngIf="successMsg">
        <span class="material-icons-outlined">check_circle</span>
        {{ successMsg }}
      </div>

      <!-- Table -->
      <div class="card table-card">
        <div class="loading-state" *ngIf="loading">
          <div class="spinner"></div>
        </div>
        
        <div class="table-wrapper" *ngIf="!loading">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Amount</th>
                <th>Category</th>
                <th>Location</th>
                <th>Device</th>
                <th>Time</th>
                <th>Score</th>
                <th>Risk</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let tx of transactions" [class.flagged-row]="tx.risk_level === 'critical' || tx.risk_level === 'high'">
                <td class="mono">{{ tx.id?.slice(0, 8) }}</td>
                <td class="amount-col">\${{ tx.amount?.toFixed(2) }}</td>
                <td>{{ tx.merchant_category }}</td>
                <td>{{ tx.location }}</td>
                <td>{{ tx.device }}</td>
                <td class="mono">{{ tx.hour_of_day }}:00</td>
                <td>
                  <span class="score-bar">
                    <span class="score-fill" [style.width.%]="(tx.fraud_score || 0) * 100"
                          [style.background]="getScoreColor(tx.fraud_score)"></span>
                  </span>
                  <span class="score-text">{{ ((tx.fraud_score || 0) * 100).toFixed(0) }}%</span>
                </td>
                <td>
                  <span class="badge" [ngClass]="'badge-' + (tx.risk_level || 'pending')">{{ tx.risk_level || 'pending' }}</span>
                </td>
                <td>
                  <div class="action-btns">
                    <button class="btn-ghost btn-sm" title="Flag" (click)="flagTx(tx.id)" *ngIf="!tx.is_flagged">
                      <span class="material-icons-outlined">flag</span>
                    </button>
                    <button class="btn-ghost btn-sm" title="Blockchain Log" (click)="logToBlockchain(tx.id)" *ngIf="tx.is_flagged && !tx.blockchain_hash">
                      <span class="material-icons-outlined">link</span>
                    </button>
                    <span class="material-icons-outlined verified-icon" *ngIf="tx.blockchain_hash" title="On blockchain">verified</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          
          <div class="empty-state" *ngIf="!transactions.length">
            <span class="material-icons-outlined icon">receipt_long</span>
            <h3>No transactions found</h3>
            <p>Simulate some transactions to get started</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .transactions-page { max-width: 1400px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .header-actions { display: flex; gap: 12px; }
    
    .filters-bar { display: flex; gap: 8px; margin-bottom: 24px; flex-wrap: wrap; }
    .filter-chip {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 16px; border-radius: 20px;
      background: var(--bg-card); border: 1px solid var(--border-color);
      color: var(--text-secondary); font-size: 13px; font-weight: 500;
      cursor: pointer; transition: all 0.2s; font-family: var(--font-primary);
    }
    .filter-chip:hover { border-color: var(--accent-primary); color: var(--text-primary); }
    .filter-chip.active { background: rgba(99, 102, 241, 0.12); border-color: var(--accent-primary); color: var(--accent-primary-light); }
    
    .dot-small { width: 6px; height: 6px; border-radius: 50%; }
    .dot-small.green { background: #10b981; }
    .dot-small.yellow { background: #f59e0b; }
    .dot-small.red { background: #ef4444; }
    .dot-small.purple { background: #818cf8; }
    .dot-small.pulse { animation: pulse-badge 2s infinite; }
    
    .table-card { padding: 0; overflow: hidden; }
    .table-wrapper { overflow-x: auto; }
    
    .amount-col { font-weight: 700; font-family: var(--font-mono); }
    .mono { font-family: var(--font-mono); font-size: 12px; }
    
    .score-bar { display: inline-block; width: 50px; height: 4px; background: var(--bg-surface); border-radius: 2px; overflow: hidden; margin-right: 6px; vertical-align: middle; }
    .score-fill { display: block; height: 100%; border-radius: 2px; transition: width 0.3s; }
    .score-text { font-size: 12px; font-family: var(--font-mono); color: var(--text-secondary); }
    
    .action-btns { display: flex; gap: 4px; }
    .btn-sm { padding: 4px 8px !important; }
    .btn-sm .material-icons-outlined { font-size: 16px; }
    .verified-icon { font-size: 18px; color: var(--accent-secondary); }
    
    .flagged-row { background: rgba(239, 68, 68, 0.03); }
    
    .loading-state { display: flex; justify-content: center; padding: 60px 0; }
    
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.6);
      display: flex; align-items: center; justify-content: center; z-index: 999;
      backdrop-filter: blur(4px);
    }
    .modal-card {
      background: var(--bg-card); border: 1px solid var(--border-color);
      border-radius: var(--radius-lg); padding: 32px; width: 420px; max-width: 90vw;
    }
    .modal-card h3 { font-size: 20px; margin-bottom: 8px; }
    .modal-desc { color: var(--text-secondary); margin-bottom: 24px; font-size: 14px; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
    
    .spinner-small { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: rotate 0.6s linear infinite; display: inline-block; }
    
    .toast { position: fixed; top: 20px; right: 20px; z-index: 9999; animation: slideInRight 0.3s ease; }
  `]
})
export class TransactionsComponent implements OnInit {
  transactions: any[] = [];
  loading = true;
  showSimulate = false;
  simulateCount = 20;
  simulating = false;
  filterStatus = '';
  successMsg = '';

  constructor(private api: ApiService) {}

  ngOnInit() { this.loadTransactions(); }

  loadTransactions() {
    this.loading = true;
    this.api.getTransactions(100, this.filterStatus || undefined).subscribe({
      next: (res) => { this.transactions = res.transactions; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  simulate() {
    this.simulating = true;
    this.api.simulateTransactions(this.simulateCount).subscribe({
      next: (res) => {
        this.showSimulate = false;
        this.simulating = false;
        this.showSuccess(`${res.count} transactions simulated`);
        this.loadTransactions();
      },
      error: () => { this.simulating = false; }
    });
  }

  flagTx(id: string) {
    this.api.flagTransaction(id).subscribe({
      next: () => { this.showSuccess('Transaction flagged'); this.loadTransactions(); }
    });
  }

  logToBlockchain(id: string) {
    this.api.logToBlockchain(id).subscribe({
      next: () => { this.showSuccess('Logged to blockchain'); this.loadTransactions(); }
    });
  }

  getScoreColor(score: number): string {
    if (!score) return '#64748b';
    if (score >= 0.8) return '#ef4444';
    if (score >= 0.6) return '#f97316';
    if (score >= 0.35) return '#f59e0b';
    return '#10b981';
  }

  showSuccess(msg: string) {
    this.successMsg = msg;
    setTimeout(() => this.successMsg = '', 3000);
  }
}
