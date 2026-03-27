import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-fraud-detection',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fraud-page">
      <div class="page-header">
        <div>
          <h1>AI Fraud Detection Engine</h1>
          <p>Analyze transactions using machine learning models</p>
        </div>
        <button class="btn btn-primary" (click)="runBatchAnalysis()" [disabled]="batchRunning">
          <span class="material-icons-outlined">{{ batchRunning ? 'hourglass_top' : 'auto_fix_high' }}</span>
          {{ batchRunning ? 'Analyzing...' : 'Batch Analyze All' }}
        </button>
      </div>

      <!-- Batch Results -->
      <div class="batch-results card" *ngIf="batchResults">
        <div class="batch-header">
          <span class="material-icons-outlined" style="color: var(--accent-success); font-size: 28px">check_circle</span>
          <div>
            <h3>Batch Analysis Complete</h3>
            <p>{{ batchResults.analyzed }} transactions analyzed, {{ batchResults.alerts_created }} alerts created</p>
          </div>
        </div>
      </div>

      <div class="grid-2">
        <!-- Transaction Input Form -->
        <div class="card">
          <h3 class="card-title">
            <span class="material-icons-outlined">edit_note</span>
            Analyze Single Transaction
          </h3>
          <form (ngSubmit)="analyzeTransaction()">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Amount ($)</label>
                <input type="number" class="form-input" [(ngModel)]="txInput.amount" name="amount" step="0.01" placeholder="500.00">
              </div>
              <div class="form-group">
                <label class="form-label">Hour of Day (0-23)</label>
                <input type="number" class="form-input" [(ngModel)]="txInput.hour_of_day" name="hour" min="0" max="23" placeholder="14">
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Merchant Category</label>
                <select class="form-select" [(ngModel)]="txInput.merchant_category" name="category">
                  <option *ngFor="let c of categories" [value]="c">{{ c }}</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Location</label>
                <select class="form-select" [(ngModel)]="txInput.location" name="location">
                  <option *ngFor="let l of locations" [value]="l">{{ l }}</option>
                </select>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Device</label>
                <select class="form-select" [(ngModel)]="txInput.device" name="device">
                  <option *ngFor="let d of devices" [value]="d">{{ d }}</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">International?</label>
                <select class="form-select" [(ngModel)]="txInput.is_international" name="intl">
                  <option [ngValue]="false">No</option>
                  <option [ngValue]="true">Yes</option>
                </select>
              </div>
            </div>
            
            <button type="submit" class="btn btn-primary btn-full" [disabled]="analyzing">
              <span class="material-icons-outlined">{{ analyzing ? 'hourglass_top' : 'psychology' }}</span>
              {{ analyzing ? 'Analyzing...' : 'Run AI Analysis' }}
            </button>
          </form>
        </div>

        <!-- Analysis Results -->
        <div class="card results-card">
          <h3 class="card-title">
            <span class="material-icons-outlined">assessment</span>
            Analysis Results
          </h3>
          
          <!-- Error State -->
          <div class="error-msg" *ngIf="errorMessage">
            <span class="material-icons-outlined">error_outline</span>
            {{ errorMessage }}
          </div>

          <div class="empty-state" *ngIf="!analysisResult && !errorMessage">
            <span class="material-icons-outlined" style="font-size: 56px; opacity: 0.2">psychology</span>
            <p>Enter transaction details and run analysis</p>
          </div>
          
          <div *ngIf="analysisResult" class="results-content">
            <!-- Fraud Score Gauge -->
            <div class="score-gauge" [class]="'gauge-' + analysisResult.risk_level">
              <div class="gauge-circle">
                <svg viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(99,102,241,0.1)" stroke-width="8"/>
                  <circle cx="60" cy="60" r="52" fill="none" 
                          [attr.stroke]="getScoreColor(analysisResult.fraud_score)"
                          stroke-width="8" stroke-linecap="round"
                          [attr.stroke-dasharray]="326.7"
                          [attr.stroke-dashoffset]="326.7 - (326.7 * analysisResult.fraud_score)"
                          transform="rotate(-90 60 60)"/>
                </svg>
                <div class="gauge-value">{{ (analysisResult.fraud_score * 100).toFixed(1) }}%</div>
                <div class="gauge-label">Fraud Score</div>
              </div>
            </div>
            
            <!-- Risk Level Badge -->
            <div class="result-risk">
              <span class="badge large-badge" [ngClass]="'badge-' + analysisResult.risk_level">
                {{ analysisResult.risk_level?.toUpperCase() }}
              </span>
              <span class="recommendation" [class]="'rec-' + analysisResult.recommendation?.toLowerCase()">
                {{ analysisResult.recommendation }}
              </span>
            </div>
            
            <!-- Risk Factors -->
            <div class="factors">
              <h4>Risk Factors</h4>
              <div class="factor-grid">
                <div class="factor-item" *ngFor="let factor of getFactors()">
                  <span class="factor-label">{{ factor.name }}</span>
                  <span class="badge" [ngClass]="'badge-' + factor.level.toLowerCase()">{{ factor.level }}</span>
                </div>
              </div>
            </div>
            
            <div class="model-info">
              <span class="material-icons-outlined">smart_toy</span>
              Model: {{ analysisResult.model_used }}
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .fraud-page { max-width: 1200px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    
    .batch-results { margin-bottom: 24px; padding: 20px; border-left: 4px solid var(--accent-success); }
    .batch-header { display: flex; align-items: center; gap: 16px; }
    .batch-header h3 { font-size: 16px; margin-bottom: 2px; }
    .batch-header p { font-size: 14px; color: var(--text-secondary); }
    
    .card-title { display: flex; align-items: center; gap: 10px; font-size: 18px; margin-bottom: 24px; }
    .card-title .material-icons-outlined { color: var(--accent-primary-light); }
    
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .btn-full { width: 100%; justify-content: center; margin-top: 8px; padding: 14px; }
    
    .results-card { display: flex; flex-direction: column; }
    .results-content { text-align: center; }
    
    .score-gauge { margin: 20px 0; }
    .gauge-circle { position: relative; width: 140px; height: 140px; margin: 0 auto; }
    .gauge-circle svg { width: 100%; height: 100%; }
    .gauge-value { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -60%); font-size: 28px; font-weight: 800; font-family: var(--font-mono); }
    .gauge-label { position: absolute; top: 50%; left: 50%; transform: translate(-50%, 60%); font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; }
    
    .gauge-low .gauge-value { color: #10b981; }
    .gauge-medium .gauge-value { color: #f59e0b; }
    .gauge-high .gauge-value { color: #f97316; }
    .gauge-critical .gauge-value { color: #ef4444; }
    
    .result-risk { display: flex; align-items: center; justify-content: center; gap: 12px; margin: 20px 0; }
    .large-badge { padding: 8px 20px; font-size: 14px; }
    
    .recommendation { font-size: 14px; font-weight: 700; padding: 8px 16px; border-radius: 6px; }
    .rec-approve { background: rgba(16,185,129,0.15); color: #34d399; }
    .rec-monitor { background: rgba(245,158,11,0.15); color: #fbbf24; }
    .rec-review { background: rgba(249,115,22,0.15); color: #fb923c; }
    .rec-block { background: rgba(239,68,68,0.15); color: #f87171; }
    
    .factors { margin-top: 24px; text-align: left; }
    .factors h4 { font-size: 14px; color: var(--text-secondary); margin-bottom: 12px; }
    .factor-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .factor-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: var(--bg-surface); border-radius: var(--radius-sm); }
    .factor-label { font-size: 13px; color: var(--text-secondary); }
    
    .model-info { margin-top: 20px; font-size: 12px; color: var(--text-muted); display: flex; align-items: center; justify-content: center; gap: 6px; }
    .model-info .material-icons-outlined { font-size: 16px; }
    
    .empty-state { padding: 60px 20px; text-align: center; color: var(--text-muted); }
    
    .error-msg { margin: 24px; padding: 16px; background: rgba(239,68,68,0.1); color: #ef4444; border-radius: 8px; border-left: 4px solid #ef4444; display: flex; align-items: center; gap: 12px; font-weight: 500; font-size: 15px; }
    
    .spinner-small { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: rotate 0.6s linear infinite; display: inline-block; }
  `]
})
export class FraudDetectionComponent implements OnInit {
  txInput: any = {
    amount: 1500,
    hour_of_day: 2,
    merchant_category: 'Crypto Exchange',
    location: 'Unknown Location',
    device: 'API',
    is_international: true,
    day_of_week: 3
  };

  categories = ['Electronics', 'Grocery', 'Restaurant', 'Gas Station', 'Online Shopping',
    'Travel', 'Entertainment', 'Healthcare', 'Education', 'Utilities',
    'ATM Withdrawal', 'Wire Transfer', 'Crypto Exchange', 'Gambling', 'Luxury Goods'];
  
  locations = ['New York, US', 'London, UK', 'Mumbai, India', 'Tokyo, Japan', 'Lagos, Nigeria',
    'Sydney, Australia', 'Berlin, Germany', 'São Paulo, Brazil', 'Dubai, UAE',
    'Singapore', 'Toronto, Canada', 'Paris, France', 'Moscow, Russia', 'Hong Kong', 'Unknown Location'];
  
  devices = ['Mobile App', 'Web Browser', 'POS Terminal', 'ATM', 'Phone Banking', 'API'];

  analysisResult: any = null;
  analyzing = false;
  batchRunning = false;
  batchResults: any = null;
  errorMessage: string = '';

  constructor(private api: ApiService) {}

  ngOnInit() {}

  analyzeTransaction() {
    this.analyzing = true;
    this.errorMessage = '';
    this.analysisResult = null;
    this.api.analyzeTransaction(this.txInput).subscribe({
      next: (res) => { this.analysisResult = res; this.analyzing = false; },
      error: (err) => { 
        this.analyzing = false; 
        this.errorMessage = err.error?.message || err.error?.error || 'Analysis failed. Please try again.';
      }
    });
  }

  runBatchAnalysis() {
    this.batchRunning = true;
    this.batchResults = null;
    this.errorMessage = '';
    this.api.batchAnalyze().subscribe({
      next: (res) => { this.batchResults = res; this.batchRunning = false; },
      error: (err) => { 
        this.batchRunning = false; 
        this.errorMessage = err.error?.message || err.error?.error || 'Batch analysis failed.';
      }
    });
  }

  getScoreColor(score: number): string {
    if (score >= 0.8) return '#ef4444';
    if (score >= 0.6) return '#f97316';
    if (score >= 0.35) return '#f59e0b';
    return '#10b981';
  }

  getFactors(): any[] {
    if (!this.analysisResult?.factors) return [];
    const f = this.analysisResult.factors;
    return [
      { name: 'Amount', level: f.amount_risk },
      { name: 'Time', level: f.time_risk },
      { name: 'Location', level: f.location_risk },
      { name: 'Category', level: f.category_risk },
      { name: 'International', level: f.international_risk }
    ];
  }
}
