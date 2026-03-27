import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-blockchain',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="blockchain-page">
      <div class="page-header">
        <div>
          <h1>Blockchain Ledger</h1>
          <p>Immutable fraud records on Polygon Amoy testnet</p>
        </div>
        <button class="btn btn-primary" (click)="batchLog()" [disabled]="batchLogging">
          <span class="material-icons-outlined">{{ batchLogging ? 'hourglass_top' : 'cloud_upload' }}</span>
          {{ batchLogging ? 'Logging...' : 'Log All Flagged' }}
        </button>
      </div>

      <!-- Network Info -->
      <div class="network-banner card">
        <div class="network-info">
          <div class="network-icon">
            <span class="material-icons-outlined">hub</span>
          </div>
          <div>
            <h3>Polygon Amoy Testnet</h3>
            <p>Connected • Chain ID: 80002</p>
          </div>
        </div>
        <div class="network-stats">
          <div class="net-stat">
            <span class="net-value">{{ records.length }}</span>
            <span class="net-label">On-Chain Records</span>
          </div>
          <div class="net-stat">
            <span class="net-value verified">{{ verifiedCount }}</span>
            <span class="net-label">Verified</span>
          </div>
        </div>
      </div>

      <!-- Success message -->
      <div class="toast success" *ngIf="successMsg">
        <span class="material-icons-outlined">check_circle</span>
        {{ successMsg }}
      </div>

      <!-- Records Table -->
      <div class="card table-card">
        <div class="card-header-row">
          <h3>Blockchain Records</h3>
          <button class="btn btn-secondary btn-sm" (click)="loadRecords()">
            <span class="material-icons-outlined">refresh</span> Refresh
          </button>
        </div>
        
        <div class="loading-state" *ngIf="loading">
          <div class="spinner"></div>
        </div>
        
        <div class="table-wrapper" *ngIf="!loading">
          <table class="data-table">
            <thead>
              <tr>
                <th>TX Hash</th>
                <th>Transaction ID</th>
                <th>Amount</th>
                <th>Fraud Score</th>
                <th>Risk Level</th>
                <th>Network</th>
                <th>Verified</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let r of records">
                <td class="mono hash-cell" [title]="r.tx_hash">{{ r.tx_hash?.slice(0, 16) }}...</td>
                <td class="mono">{{ r.transaction_id?.slice(0, 8) }}...</td>
                <td class="amount-col">\${{ r.amount?.toFixed(2) }}</td>
                <td>{{ ((r.fraud_score || 0) * 100).toFixed(1) }}%</td>
                <td><span class="badge" [ngClass]="'badge-' + r.risk_level">{{ r.risk_level }}</span></td>
                <td>
                  <span class="network-chip">
                    <span class="material-icons-outlined">link</span>
                    {{ r.network || 'polygon-amoy' }}
                  </span>
                </td>
                <td>
                  <span class="material-icons-outlined" [style.color]="r.verified ? '#10b981' : '#64748b'">
                    {{ r.verified ? 'verified' : 'pending' }}
                  </span>
                </td>
                <td>
                  <button class="btn-ghost btn-sm" (click)="verifyTx(r.transaction_id)" title="Verify Integrity">
                    <span class="material-icons-outlined">fact_check</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          
          <div class="empty-state" *ngIf="!records.length">
            <span class="material-icons-outlined icon">link_off</span>
            <h3>No blockchain records</h3>
            <p>Flag and log transactions to create blockchain records</p>
          </div>
        </div>
      </div>

      <!-- Verification Modal -->
      <div class="modal-overlay" *ngIf="verifyResult" (click)="verifyResult = null">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="verify-header" [class.valid]="verifyResult.verified" [class.invalid]="!verifyResult.verified">
            <span class="material-icons-outlined">{{ verifyResult.verified ? 'verified_user' : 'gpp_bad' }}</span>
            <h3>{{ verifyResult.verified ? 'Integrity Verified' : 'Integrity Compromised!' }}</h3>
          </div>
          <div class="verify-details">
            <div class="verify-row">
              <span>Status</span>
              <span class="badge" [ngClass]="verifyResult.verified ? 'badge-low' : 'badge-critical'">{{ verifyResult.integrity }}</span>
            </div>
            <div class="verify-row">
              <span>Stored Hash</span>
              <span class="mono small">{{ verifyResult.stored_hash?.slice(0, 24) }}...</span>
            </div>
            <div class="verify-row">
              <span>Computed Hash</span>
              <span class="mono small">{{ verifyResult.computed_hash?.slice(0, 24) }}...</span>
            </div>
          </div>
          <button class="btn btn-secondary btn-full" (click)="verifyResult = null" style="margin-top: 20px">Close</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .blockchain-page { max-width: 1400px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    
    .network-banner {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 24px; border-left: 4px solid var(--accent-secondary);
    }
    .network-info { display: flex; align-items: center; gap: 16px; }
    .network-icon { width: 48px; height: 48px; background: rgba(6,182,212,0.15); border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; }
    .network-icon .material-icons-outlined { color: var(--accent-secondary); font-size: 24px; }
    .network-info h3 { font-size: 16px; }
    .network-info p { font-size: 13px; color: var(--text-secondary); }
    .network-stats { display: flex; gap: 32px; }
    .net-stat { text-align: center; }
    .net-value { display: block; font-size: 24px; font-weight: 800; }
    .net-value.verified { color: var(--accent-success); }
    .net-label { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
    
    .table-card { padding: 0; overflow: hidden; }
    .card-header-row { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid var(--border-color); }
    .card-header-row h3 { font-size: 16px; }
    .table-wrapper { overflow-x: auto; }
    .mono { font-family: var(--font-mono); font-size: 12px; }
    .hash-cell { color: var(--accent-secondary); }
    .amount-col { font-weight: 700; font-family: var(--font-mono); }
    .btn-sm { padding: 6px 12px !important; font-size: 13px; }
    .btn-sm .material-icons-outlined { font-size: 16px; }
    .loading-state { display: flex; justify-content: center; padding: 60px 0; }
    
    .network-chip { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; color: var(--accent-secondary); }
    .network-chip .material-icons-outlined { font-size: 14px; }
    
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 999; backdrop-filter: blur(4px); }
    .modal-card { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 32px; width: 480px; max-width: 90vw; }
    
    .verify-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
    .verify-header .material-icons-outlined { font-size: 32px; }
    .verify-header.valid .material-icons-outlined { color: #10b981; }
    .verify-header.invalid .material-icons-outlined { color: #ef4444; }
    .verify-header h3 { font-size: 20px; }
    
    .verify-details { display: flex; flex-direction: column; gap: 12px; }
    .verify-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: var(--bg-surface); border-radius: var(--radius-sm); }
    .verify-row > span:first-child { font-size: 13px; color: var(--text-secondary); }
    .small { font-size: 11px !important; }
    
    .btn-full { width: 100%; justify-content: center; }
    .toast { position: fixed; top: 20px; right: 20px; z-index: 9999; }
  `]
})
export class BlockchainComponent implements OnInit {
  records: any[] = [];
  loading = true;
  batchLogging = false;
  verifyResult: any = null;
  successMsg = '';

  get verifiedCount(): number {
    return this.records.filter(r => r.verified).length;
  }

  constructor(private api: ApiService) {}

  ngOnInit() { this.loadRecords(); }

  loadRecords() {
    this.loading = true;
    this.api.getBlockchainRecords(100).subscribe({
      next: (res) => { this.records = res.records; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  batchLog() {
    this.batchLogging = true;
    this.api.batchLogToBlockchain().subscribe({
      next: (res) => {
        this.batchLogging = false;
        this.successMsg = res.message;
        setTimeout(() => this.successMsg = '', 3000);
        this.loadRecords();
      },
      error: () => { this.batchLogging = false; }
    });
  }

  verifyTx(txId: string) {
    this.api.verifyTransaction(txId).subscribe({
      next: (res) => { this.verifyResult = res; }
    });
  }
}
