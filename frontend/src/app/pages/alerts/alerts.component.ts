import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alerts.component.html',
  styleUrls: ['./alerts.component.css']
})
export class AlertsComponent implements OnInit {
  alerts: any[] = [];
  loading = true;

  get unreadCount(): number { return this.alerts.filter(a => !a.is_read).length; }

  constructor(private api: ApiService) {}
  ngOnInit() { this.loadAlerts(); }

  loadAlerts() {
    this.loading = true;
    this.api.getAlerts(100).subscribe({
      next: (res) => { this.alerts = res.alerts; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  markRead(id: string) {
    this.api.markAlertRead(id).subscribe({ next: () => this.loadAlerts() });
  }

  markAllRead() {
    this.api.markAllAlertsRead().subscribe({ next: () => this.loadAlerts() });
  }

  getSeverityIcon(severity: string): string {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      default: return 'info';
    }
  }

  getTimeAgo(timestamp: string): string {
    if (!timestamp) return '';
    const diff = Date.now() - new Date(timestamp).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }
}
