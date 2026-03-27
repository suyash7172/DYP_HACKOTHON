import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Dashboard
  getDashboardOverview(): Observable<any> {
    return this.http.get(`${this.apiUrl}/dashboard/overview`);
  }

  getAlerts(limit: number = 50): Observable<any> {
    return this.http.get(`${this.apiUrl}/dashboard/alerts?limit=${limit}`);
  }

  markAlertRead(alertId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/dashboard/alerts/${alertId}/read`, {});
  }

  markAllAlertsRead(): Observable<any> {
    return this.http.put(`${this.apiUrl}/dashboard/alerts/read-all`, {});
  }

  // Transactions
  getTransactions(limit: number = 50, status?: string): Observable<any> {
    let url = `${this.apiUrl}/transactions/?limit=${limit}`;
    if (status) url += `&status=${status}`;
    return this.http.get(url);
  }

  createTransaction(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/transactions/`, data);
  }

  simulateTransactions(count: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/transactions/simulate`, { count });
  }

  flagTransaction(transactionId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/transactions/${transactionId}/flag`, {});
  }

  getTransactionStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/transactions/stats`);
  }

  // Predictions
  analyzeTransaction(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/predictions/analyze`, data);
  }

  batchAnalyze(): Observable<any> {
    return this.http.post(`${this.apiUrl}/predictions/batch`, {});
  }

  // Blockchain
  logToBlockchain(transactionId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/blockchain/log`, { transaction_id: transactionId });
  }

  verifyTransaction(transactionId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/blockchain/verify/${transactionId}`);
  }

  getBlockchainRecords(limit: number = 50): Observable<any> {
    return this.http.get(`${this.apiUrl}/blockchain/records?limit=${limit}`);
  }

  batchLogToBlockchain(): Observable<any> {
    return this.http.post(`${this.apiUrl}/blockchain/batch-log`, {});
  }
}
