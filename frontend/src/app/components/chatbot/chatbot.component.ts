import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
  time: string;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Floating Chat Button -->
    <button class="chat-fab" (click)="toggleChat()" [class.active]="isOpen">
      <span class="material-icons-outlined" *ngIf="!isOpen">smart_toy</span>
      <span class="material-icons-outlined" *ngIf="isOpen">close</span>
      <span class="fab-pulse" *ngIf="!isOpen"></span>
    </button>

    <!-- Chat Panel -->
    <div class="chat-panel" [class.open]="isOpen">
      <div class="chat-header">
        <div class="chat-header-left">
          <div class="bot-avatar">
            <span class="material-icons-outlined">smart_toy</span>
          </div>
          <div>
            <h4>SecurePay AI Assistant</h4>
            <span class="bot-status"><span class="status-dot"></span> Online</span>
          </div>
        </div>
        <button class="chat-close" (click)="toggleChat()">
          <span class="material-icons-outlined">close</span>
        </button>
      </div>

      <div class="chat-messages" #messagesContainer>
        <div class="message" *ngFor="let msg of messages" [class]="msg.role">
          <div class="msg-avatar" *ngIf="msg.role === 'bot'">
            <span class="material-icons-outlined">smart_toy</span>
          </div>
          <div class="msg-bubble">
            <div class="msg-text" [innerHTML]="msg.text"></div>
            <span class="msg-time">{{ msg.time }}</span>
          </div>
        </div>
        <div class="typing-indicator" *ngIf="isTyping">
          <div class="msg-avatar"><span class="material-icons-outlined">smart_toy</span></div>
          <div class="typing-dots">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>

      <div class="quick-actions" *ngIf="messages.length <= 1">
        <button class="quick-btn" *ngFor="let q of quickQuestions" (click)="sendQuick(q)">
          {{ q }}
        </button>
      </div>

      <div class="chat-input-area">
        <input class="chat-input" [(ngModel)]="userInput" 
               (keydown.enter)="sendMessage()" 
               placeholder="Ask about fraud detection..."
               [disabled]="isTyping">
        <button class="send-btn" (click)="sendMessage()" [disabled]="!userInput.trim() || isTyping">
          <span class="material-icons-outlined">send</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999;
    }

    .chat-fab {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: var(--gradient-primary);
      border: none;
      color: white;
      font-size: 28px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 32px rgba(99, 102, 241, 0.4);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
    }
    .chat-fab:hover { transform: scale(1.08); box-shadow: 0 12px 40px rgba(99, 102, 241, 0.5); }
    .chat-fab.active { background: var(--bg-surface); box-shadow: var(--shadow-md); }
    .chat-fab .material-icons-outlined { font-size: 28px; }

    .fab-pulse {
      position: absolute;
      inset: -4px;
      border-radius: 50%;
      border: 2px solid rgba(99, 102, 241, 0.4);
      animation: fabPulse 2s infinite;
    }
    @keyframes fabPulse {
      0% { transform: scale(1); opacity: 1; }
      100% { transform: scale(1.4); opacity: 0; }
    }

    .chat-panel {
      position: absolute;
      bottom: 76px;
      right: 0;
      width: 380px;
      height: 520px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-xl);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transform: scale(0.8) translateY(20px);
      opacity: 0;
      pointer-events: none;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      transform-origin: bottom right;
    }
    .chat-panel.open {
      transform: scale(1) translateY(0);
      opacity: 1;
      pointer-events: all;
    }

    .chat-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      background: var(--bg-secondary);
      border-bottom: 1px solid var(--border-color);
    }
    .chat-header-left { display: flex; align-items: center; gap: 12px; }
    .bot-avatar {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: var(--gradient-primary);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .bot-avatar .material-icons-outlined { color: white; font-size: 20px; }
    .chat-header h4 { font-family: var(--font-display); font-size: 15px; font-weight: 600; }
    .bot-status { font-size: 11px; color: #10b981; display: flex; align-items: center; gap: 4px; }
    .status-dot { width: 6px; height: 6px; border-radius: 50%; background: #10b981; }
    .chat-close {
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 4px;
    }

    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .message { display: flex; gap: 8px; animation: fadeInUp 0.3s ease; }
    .message.user { flex-direction: row-reverse; }

    .msg-avatar {
      width: 30px;
      height: 30px;
      min-width: 30px;
      border-radius: 50%;
      background: rgba(99, 102, 241, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .msg-avatar .material-icons-outlined { font-size: 16px; color: var(--accent-primary-light); }

    .msg-bubble {
      max-width: 80%;
      padding: 10px 14px;
      border-radius: 12px;
      font-size: 13px;
      line-height: 1.5;
    }
    .bot .msg-bubble {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-top-left-radius: 4px;
    }
    .user .msg-bubble {
      background: var(--accent-primary-dark);
      color: white;
      border-top-right-radius: 4px;
    }
    .msg-time { display: block; font-size: 10px; color: var(--text-muted); margin-top: 4px; text-align: right; }
    .user .msg-time { color: rgba(255,255,255,0.5); }

    .typing-indicator { display: flex; gap: 8px; align-items: center; }
    .typing-dots { display: flex; gap: 4px; padding: 12px 16px; background: var(--bg-surface); border-radius: 12px; border: 1px solid var(--border-color); }
    .typing-dots span {
      width: 6px; height: 6px; border-radius: 50%; background: var(--text-muted);
      animation: typingBounce 1.4s infinite;
    }
    .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
    .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes typingBounce {
      0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-6px); }
    }

    .quick-actions {
      padding: 8px 16px;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .quick-btn {
      padding: 6px 12px;
      background: rgba(99,102,241,0.08);
      border: 1px solid rgba(99,102,241,0.15);
      border-radius: 20px;
      color: var(--accent-primary-light);
      font-size: 11px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      font-family: var(--font-primary);
    }
    .quick-btn:hover { background: rgba(99,102,241,0.15); border-color: rgba(99,102,241,0.3); }

    .chat-input-area {
      display: flex;
      gap: 8px;
      padding: 12px 16px;
      border-top: 1px solid var(--border-color);
      background: var(--bg-secondary);
    }
    .chat-input {
      flex: 1;
      padding: 10px 14px;
      background: var(--bg-input);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      color: var(--text-primary);
      font-family: var(--font-primary);
      font-size: 13px;
      outline: none;
    }
    .chat-input:focus { border-color: var(--accent-primary); }
    .chat-input::placeholder { color: var(--text-muted); }

    .send-btn {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-sm);
      background: var(--gradient-primary);
      border: none;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    .send-btn:hover:not(:disabled) { transform: scale(1.05); }
    .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .send-btn .material-icons-outlined { font-size: 18px; }

    @media (max-width: 480px) {
      .chat-panel { width: calc(100vw - 32px); right: -8px; }
    }
  `]
})
export class ChatbotComponent {
  isOpen = false;
  isTyping = false;
  userInput = '';
  messages: ChatMessage[] = [];

  quickQuestions = [
    'What is fraud detection?',
    'How does AI scoring work?',
    'What is blockchain verification?',
    'Show risk levels',
    'How to upload CSV?',
  ];

  private botResponses: { [key: string]: string } = {
    'fraud detection': `<b>AI Fraud Detection</b> analyzes each transaction using multiple signals: amount patterns, timing, location risk, merchant category, and device type. Our ensemble model combines <b>Isolation Forest</b> (anomaly detection) + <b>Logistic Regression</b> + rule-based scoring to compute a fraud probability score from 0 to 1.`,
    'scoring': `<b>How AI Scoring Works:</b><br>• Scores range from <b>0.0</b> (safe) to <b>1.0</b> (fraudulent)<br>• <span style="color:#10b981">Low (0-0.35):</span> Approved automatically<br>• <span style="color:#f59e0b">Medium (0.35-0.6):</span> Monitored<br>• <span style="color:#f97316">High (0.6-0.8):</span> Flagged for review<br>• <span style="color:#ef4444">Critical (0.8+):</span> Blocked immediately`,
    'blockchain': `<b>Blockchain Verification:</b><br>All flagged transactions are immutably recorded on the <b>Polygon Amoy testnet</b> (Ethereum L2). This creates a transparent, tamper-proof audit trail that cannot be altered. Each record includes the transaction hash, fraud score, and timestamp.`,
    'risk level': `<b>Risk Levels:</b><br>🟢 <b>Low:</b> Score < 0.35 — Transaction approved<br>🟡 <b>Medium:</b> Score 0.35-0.60 — Monitor closely<br>🟠 <b>High:</b> Score 0.60-0.80 — Flag for review<br>🔴 <b>Critical:</b> Score > 0.80 — Auto-blocked`,
    'csv': `<b>CSV Upload:</b><br>1. Go to <b>Analytics</b> page<br>2. Drag & drop or click to upload a CSV file<br>3. The CSV should have columns like: amount, merchant_category, location, hour_of_day<br>4. Each row is analyzed by the AI engine instantly<br>5. Results show risk summary and flagged transactions`,
    'help': `<b>I can help with:</b><br>• How fraud detection works<br>• Understanding risk scores<br>• Blockchain verification details<br>• CSV upload instructions<br>• Dashboard navigation<br>• Alert management<br><br>Just ask me anything! 🤖`,
    'dashboard': `<b>Dashboard Features:</b><br>• <b>Stats Cards:</b> Total transactions, fraud count, blocked amounts<br>• <b>Charts:</b> Fraud vs legitimate distribution, risk levels, hourly trends<br>• <b>Recent Flagged:</b> Latest high-risk transactions<br>• <b>Simulate + Analyze:</b> Generate test data and run AI analysis`,
    'alert': `<b>Alerts System:</b><br>Alerts are auto-generated when the AI detects high-risk or critical transactions. Each alert shows:<br>• Transaction ID & amount<br>• Fraud score & risk level<br>• Recommended action (Block/Review/Monitor)<br>• Timestamp<br><br>You can mark alerts as read or view the linked transaction.`,
  };

  constructor() {
    this.addBotMessage(`Hi! 👋 I'm the <b>SecurePay AI Assistant</b>. I can help you understand fraud detection, risk scoring, blockchain verification, and more. How can I help?`);
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
  }

  sendQuick(q: string) {
    this.userInput = q;
    this.sendMessage();
  }

  sendMessage() {
    const text = this.userInput.trim();
    if (!text) return;

    this.addUserMessage(text);
    this.userInput = '';
    this.isTyping = true;

    setTimeout(() => {
      this.isTyping = false;
      const response = this.generateResponse(text);
      this.addBotMessage(response);
    }, 800 + Math.random() * 600);
  }

  generateResponse(input: string): string {
    const q = input.toLowerCase();
    
    for (const [key, response] of Object.entries(this.botResponses)) {
      if (q.includes(key)) return response;
    }

    if (q.includes('hello') || q.includes('hi') || q.includes('hey')) {
      return `Hello! 👋 How can I help you today? Ask me about fraud detection, risk scores, blockchain, or anything else!`;
    }
    if (q.includes('thank')) {
      return `You're welcome! 😊 Let me know if you have any other questions about SecurePay AI.`;
    }
    if (q.includes('transaction')) {
      return this.botResponses['fraud detection'];
    }
    if (q.includes('score') || q.includes('ai')) {
      return this.botResponses['scoring'];
    }
    if (q.includes('upload') || q.includes('file')) {
      return this.botResponses['csv'];
    }

    return `I understand you're asking about "<b>${input}</b>". Here's what I can help with:<br><br>• Fraud detection & AI scoring<br>• Blockchain verification<br>• Risk level explanations<br>• CSV upload guidance<br>• Dashboard & alert navigation<br><br>Try asking about any of these topics! 🤖`;
  }

  private addUserMessage(text: string) {
    this.messages.push({
      id: Date.now().toString(),
      role: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    this.scrollToBottom();
  }

  private addBotMessage(text: string) {
    this.messages.push({
      id: Date.now().toString(),
      role: 'bot',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    this.scrollToBottom();
  }

  private scrollToBottom() {
    setTimeout(() => {
      const el = document.querySelector('.chat-messages');
      if (el) el.scrollTop = el.scrollHeight;
    }, 50);
  }
}
