import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.css'
})
export class AnalyticsComponent implements OnInit {
  @ViewChild('locationChart') locationRef!: ElementRef;
  @ViewChild('amountChart') amountRef!: ElementRef;
  @ViewChild('categoryPolarChart') categoryPolarRef!: ElementRef;

  loading = true;
  hourlyFraud: number[] = [];
  locationFraud: any = {};
  categoryFraud: any = {};
  amountRanges: any = {};
  topLocation = 'N/A';
  locationPercent = 0;
  peakFraudHour = 'N/A';
  peakFraudCount = 0;
  timePercent = 0;
  avgFraudAmount = 0;
  spendingPercent = 0;
  private charts: Chart[] = [];

  constructor(private api: ApiService) {}
  ngOnInit() { this.loadData(); }

  refreshData() {
    this.charts.forEach(c => c.destroy());
    this.charts = [];
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.api.getDashboardOverview().subscribe({
      next: (res) => {
        this.hourlyFraud = res.hourly_fraud || [];
        this.locationFraud = res.location_fraud || {};
        this.categoryFraud = res.category_fraud || {};
        this.amountRanges = res.amount_ranges || {};
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
        this.avgFraudAmount = res.overview?.blocked_amount / Math.max(1, res.overview?.fraud_count) || 0;
        const avgNormal = res.overview?.avg_transaction || 100;
        this.spendingPercent = Math.min(100, ((this.avgFraudAmount - avgNormal) / Math.max(1, avgNormal)) * 100);
        this.loading = false;
        setTimeout(() => this.initCharts(), 100);
      },
      error: () => { this.loading = false; }
    });
  }

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
  }

  getHeatColor(value: number): string {
    if (value === 0) return 'rgba(99, 102, 241, 0.05)';
    const max = Math.max(...this.hourlyFraud, 1);
    const intensity = value / max;
    if (intensity > 0.7) return `rgba(239, 68, 68, ${0.3 + intensity * 0.6})`;
    if (intensity > 0.4) return `rgba(245, 158, 11, ${0.3 + intensity * 0.5})`;
    return `rgba(99, 102, 241, ${0.1 + intensity * 0.4})`;
  }
}
