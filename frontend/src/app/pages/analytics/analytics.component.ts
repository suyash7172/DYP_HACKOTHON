import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.css']
})
export class AnalyticsComponent implements OnInit, OnDestroy {
  @ViewChild('locationChart') locationRef!: ElementRef;
  @ViewChild('amountChart') amountRef!: ElementRef;
  @ViewChild('categoryPolarChart') categoryPolarRef!: ElementRef;
  @ViewChild('trendLineChart') trendLineRef!: ElementRef;

  Math = Math; // Expose Math to template
  loading = true;
  hourlyFraud: number[] = [];
  hourlyLegit: number[] = [];
  locationFraud: any = {};
  categoryFraud: any = {};
  amountRanges: any = {};
  overview: any = {};
  dailyCounts: any = {};
  
  // Insight metrics
  topLocation = 'N/A';
  locationPercent = 0;
  peakFraudHour = 'N/A';
  peakFraudCount = 0;
  timePercent = 0;
  avgFraudAmount = 0;
  spendingPercent = 0;
  totalTransactions = 0;
  fraudRate = 0;
  
  // Upload state
  uploadDragging = false;
  uploading = false;
  uploadResult: any = null;
  uploadError = '';
  selectedFile: File | null = null;
  
  // Real-time polling
  private refreshInterval: any;
  lastRefresh: string = '';
  autoRefresh = true;
  
  private charts: Chart[] = [];

  constructor(private api: ApiService) {}
  
  ngOnInit() { 
    this.loadData(); 
    this.startAutoRefresh();
  }
  
  ngOnDestroy() {
    this.stopAutoRefresh();
    this.charts.forEach(c => c.destroy());
  }

  startAutoRefresh() {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
    this.refreshInterval = setInterval(() => {
      if (this.autoRefresh && !this.uploading) {
        this.loadData(true);
      }
    }, 15000); // Refresh every 15 seconds
  }

  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  toggleAutoRefresh() {
    this.autoRefresh = !this.autoRefresh;
    if (this.autoRefresh) {
      this.startAutoRefresh();
    } else {
      this.stopAutoRefresh();
    }
  }

  refreshData() {
    this.charts.forEach(c => c.destroy());
    this.charts = [];
    this.loadData();
  }

  loadData(silent = false) {
    if (!silent) this.loading = true;
    this.api.getDashboardOverview().subscribe({
      next: (res) => {
        this.hourlyFraud = res.hourly_fraud || [];
        this.hourlyLegit = res.hourly_legit || [];
        this.locationFraud = res.location_fraud || {};
        this.categoryFraud = res.category_fraud || {};
        this.amountRanges = res.amount_ranges || {};
        this.overview = res.overview || {};
        this.dailyCounts = res.daily_counts || {};
        
        this.totalTransactions = this.overview.total_transactions || 0;
        this.fraudRate = this.overview.fraud_rate || 0;
        
        const locs = Object.entries(this.locationFraud).sort((a: any, b: any) => b[1] - a[1]);
        if (locs.length) {
          this.topLocation = locs[0][0] as string;
          const totalFraud = locs.reduce((s, l: any) => s + l[1], 0);
          this.locationPercent = totalFraud > 0 ? ((locs[0][1] as number) / totalFraud * 100) : 0;
        }
        const maxHour = this.hourlyFraud.indexOf(Math.max(...this.hourlyFraud));
        this.peakFraudHour = `${maxHour.toString().padStart(2, '0')}:00`;
        this.peakFraudCount = this.hourlyFraud[maxHour] || 0;
        this.timePercent = Math.min(100, this.peakFraudCount * 10);
        this.avgFraudAmount = this.overview?.blocked_amount / Math.max(1, this.overview?.fraud_count) || 0;
        const avgNormal = this.overview?.avg_transaction || 100;
        this.spendingPercent = Math.min(100, Math.abs(((this.avgFraudAmount - avgNormal) / Math.max(1, avgNormal)) * 100));
        
        this.lastRefresh = new Date().toLocaleTimeString();
        this.loading = false;
        
        // Rebuild charts
        setTimeout(() => {
          this.charts.forEach(c => c.destroy());
          this.charts = [];
          this.initCharts();
        }, 100);
      },
      error: () => { this.loading = false; }
    });
  }

  // ============ CSV Upload ============
  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.uploadDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.uploadDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.uploadDragging = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      this.handleFile(file);
    }
  }

  handleFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      this.uploadError = 'Only CSV files are supported';
      return;
    }
    this.selectedFile = file;
    this.uploadError = '';
    this.uploadResult = null;
  }

  uploadFile() {
    if (!this.selectedFile) return;
    
    this.uploading = true;
    this.uploadError = '';
    this.uploadResult = null;
    
    this.api.uploadCSV(this.selectedFile).subscribe({
      next: (res) => {
        this.uploadResult = res;
        this.uploading = false;
        this.selectedFile = null;
        // Refresh analytics data
        setTimeout(() => this.loadData(), 500);
      },
      error: (err) => {
        this.uploading = false;
        this.uploadError = err.error?.error || err.error?.message || 'Upload failed. Please try again.';
      }
    });
  }

  clearUpload() {
    this.selectedFile = null;
    this.uploadResult = null;
    this.uploadError = '';
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  // ============ Charts ============
  initCharts() {
    if (this.locationRef) {
      const locs = Object.entries(this.locationFraud).sort((a: any, b: any) => b[1] - a[1]).slice(0, 6);
      const colors = ['#ef4444', '#f97316', '#f59e0b', '#8b5cf6', '#6366f1', '#06b6d4'];
      const ch = new Chart(this.locationRef.nativeElement, {
        type: 'doughnut',
        data: { labels: locs.map(l => l[0]), datasets: [{ data: locs.map(l => l[1] as number), backgroundColor: colors, borderWidth: 0 }] },
        options: { responsive: true, maintainAspectRatio: false, cutout: '60%', plugins: { legend: { position: 'right', labels: { color: '#94a3b8', padding: 12, usePointStyle: true, font: { size: 11 } } } } }
      });
      this.charts.push(ch);
    }
    if (this.amountRef) {
      const labels = Object.keys(this.amountRanges);
      const ch = new Chart(this.amountRef.nativeElement, {
        type: 'bar',
        data: { labels, datasets: [{ data: labels.map(l => this.amountRanges[l]), backgroundColor: ['#10b981', '#06b6d4', '#6366f1', '#f59e0b', '#ef4444'], borderRadius: 8, borderSkipped: false }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { color: '#64748b' } }, y: { grid: { color: 'rgba(99,102,241,0.06)' }, ticks: { color: '#64748b' } } } }
      });
      this.charts.push(ch);
    }
    if (this.categoryPolarRef) {
      const cats = Object.entries(this.categoryFraud).sort((a: any, b: any) => b[1] - a[1]).slice(0, 6);
      const colors = ['rgba(99,102,241,0.6)', 'rgba(139,92,246,0.6)', 'rgba(236,72,153,0.6)', 'rgba(6,182,212,0.6)', 'rgba(245,158,11,0.6)', 'rgba(16,185,129,0.6)'];
      const ch = new Chart(this.categoryPolarRef.nativeElement, {
        type: 'polarArea',
        data: { labels: cats.map(c => c[0]), datasets: [{ data: cats.map(c => c[1] as number), backgroundColor: colors, borderWidth: 0 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#94a3b8', padding: 10, usePointStyle: true, font: { size: 11 } } } }, scales: { r: { grid: { color: 'rgba(99,102,241,0.08)' }, ticks: { display: false } } } }
      });
      this.charts.push(ch);
    }
    if (this.trendLineRef && this.hourlyFraud.length) {
      const hours = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
      const ch = new Chart(this.trendLineRef.nativeElement, {
        type: 'line',
        data: {
          labels: hours,
          datasets: [
            {
              label: 'Legitimate',
              data: this.hourlyLegit,
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              fill: true,
              tension: 0.4,
              pointRadius: 2,
              pointHoverRadius: 6,
              borderWidth: 2
            },
            {
              label: 'Fraudulent',
              data: this.hourlyFraud,
              borderColor: '#ef4444',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              fill: true,
              tension: 0.4,
              pointRadius: 2,
              pointHoverRadius: 6,
              borderWidth: 2
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { intersect: false, mode: 'index' },
          plugins: { legend: { position: 'top', labels: { color: '#94a3b8', usePointStyle: true, font: { size: 11 } } } },
          scales: {
            x: { grid: { display: false }, ticks: { color: '#64748b', maxTicksLimit: 12, font: { size: 10 } } },
            y: { grid: { color: 'rgba(99,102,241,0.06)' }, ticks: { color: '#64748b' } }
          }
        }
      });
      this.charts.push(ch);
    }
  }

  getHeatColor(value: number): string {
    if (value === 0) return 'rgba(99, 102, 241, 0.05)';
    const max = Math.max(...this.hourlyFraud, 1);
    const intensity = value / max;
    if (intensity > 0.7) return `rgba(239, 68, 68, ${0.3 + intensity * 0.6})`;
    if (intensity > 0.4) return `rgba(245, 158, 11, ${0.3 + intensity * 0.5})`;
    return `rgba(99, 102, 241, ${0.1 + intensity * 0.4})`;
  }

  getRiskColor(level: string): string {
    switch(level) {
      case 'critical': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6366f1';
    }
  }
}
