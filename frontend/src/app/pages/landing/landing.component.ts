import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="landing-page">
      <!-- Animated Background -->
      <div class="bg-effects">
        <div class="gradient-orb orb-1"></div>
        <div class="gradient-orb orb-2"></div>
        <div class="gradient-orb orb-3"></div>
        <div class="grid-overlay"></div>
        <div class="particles" *ngFor="let p of particles" 
             [style.left.px]="p.x" [style.top.px]="p.y" 
             [style.animationDelay.s]="p.delay"
             [style.width.px]="p.size" [style.height.px]="p.size">
        </div>
      </div>

      <!-- Navbar -->
      <nav class="navbar">
        <div class="nav-container">
          <div class="nav-brand">
            <div class="brand-icon">
              <span class="material-icons-outlined">shield</span>
            </div>
            <span class="brand-name">SecurePay <span class="brand-ai">AI</span></span>
          </div>
          <div class="nav-links">
            <a href="#features" class="nav-link">Features</a>
            <a href="#how-it-works" class="nav-link">How it Works</a>
            <a href="#stats" class="nav-link">Stats</a>
            <a routerLink="/login" class="nav-link login-link">Sign In</a>
            <a routerLink="/signup" class="btn btn-primary nav-cta">Get Started</a>
          </div>
        </div>
      </nav>

      <!-- Hero Section -->
      <section class="hero">
        <div class="hero-content">
          <div class="hero-badge">
            <span class="live-dot"></span>
            AI-Powered Fraud Detection System
          </div>
          <h1 class="hero-title">
            Protect Every <br>
            <span class="gradient-text-hero">Transaction</span> with <br>
            Intelligent AI
          </h1>
          <p class="hero-subtitle">
            Real-time fraud detection powered by machine learning and secured by blockchain technology.
            Analyze thousands of transactions instantly with 99.7% accuracy.
          </p>
          <div class="hero-actions">
            <a routerLink="/signup" class="btn btn-hero-primary">
              <span class="material-icons-outlined">rocket_launch</span>
              Get Started Free
            </a>
            <a href="#features" class="btn btn-hero-secondary">
              <span class="material-icons-outlined">play_circle</span>
              See How It Works
            </a>
          </div>
          <div class="hero-stats-row">
            <div class="hero-stat">
              <span class="hero-stat-value" id="stat-transactions">{{ animatedStats.transactions }}+</span>
              <span class="hero-stat-label">Transactions Analyzed</span>
            </div>
            <div class="hero-stat-divider"></div>
            <div class="hero-stat">
              <span class="hero-stat-value">99.7%</span>
              <span class="hero-stat-label">Detection Accuracy</span>
            </div>
            <div class="hero-stat-divider"></div>
            <div class="hero-stat">
              <span class="hero-stat-value"><50ms</span>
              <span class="hero-stat-label">Response Time</span>
            </div>
          </div>
        </div>
        <div class="hero-visual">
          <div class="dashboard-preview">
            <div class="preview-header">
              <div class="preview-dots">
                <span class="dot r"></span>
                <span class="dot y"></span>
                <span class="dot g"></span>
              </div>
              <span class="preview-title">Fraud Detection Dashboard</span>
            </div>
            <div class="preview-body">
              <div class="preview-stat-row">
                <div class="preview-stat green">
                  <span class="ps-icon material-icons-outlined">verified</span>
                  <div>
                    <div class="ps-value">2,847</div>
                    <div class="ps-label">Legitimate</div>
                  </div>
                </div>
                <div class="preview-stat red">
                  <span class="ps-icon material-icons-outlined">gpp_bad</span>
                  <div>
                    <div class="ps-value">23</div>
                    <div class="ps-label">Blocked</div>
                  </div>
                </div>
              </div>
              <div class="preview-chart">
                <div class="chart-bar" *ngFor="let h of chartBars; let i = index"
                     [style.height.%]="h" [style.animationDelay.ms]="i * 60"
                     [class.danger]="h > 70">
                </div>
              </div>
              <div class="preview-alert">
                <span class="material-icons-outlined" style="color:#ef4444">warning</span>
                <span>High-risk transaction detected — $8,450 from Unknown Location</span>
                <span class="badge badge-critical">BLOCKED</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section class="features" id="features">
        <div class="section-container">
          <div class="section-header">
            <span class="section-tag">FEATURES</span>
            <h2>Cutting-Edge <span class="gradient-text-hero">Security</span> Infrastructure</h2>
            <p>Built with the latest AI and blockchain technology to keep your finances safe</p>
          </div>
          <div class="features-grid">
            <div class="feature-card" *ngFor="let f of features; let i = index" 
                 [style.animationDelay.ms]="i * 100">
              <div class="feature-icon-wrap" [style.background]="f.bg">
                <span class="material-icons-outlined" [style.color]="f.color">{{ f.icon }}</span>
              </div>
              <h3>{{ f.title }}</h3>
              <p>{{ f.desc }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- How It Works -->
      <section class="how-it-works" id="how-it-works">
        <div class="section-container">
          <div class="section-header">
            <span class="section-tag">HOW IT WORKS</span>
            <h2>Three Steps to <span class="gradient-text-hero">Total Protection</span></h2>
          </div>
          <div class="steps-row">
            <div class="step-card" *ngFor="let s of steps; let i = index">
              <div class="step-number">{{ i + 1 }}</div>
              <div class="step-icon">
                <span class="material-icons-outlined">{{ s.icon }}</span>
              </div>
              <h3>{{ s.title }}</h3>
              <p>{{ s.desc }}</p>
            </div>
            <div class="step-connector" *ngFor="let s of [1,2]"></div>
          </div>
        </div>
      </section>

      <!-- Stats Section -->
      <section class="stats-section" id="stats">
        <div class="section-container">
          <div class="stats-grid">
            <div class="big-stat" *ngFor="let s of bigStats">
              <div class="big-stat-value gradient-text-hero">{{ s.value }}</div>
              <div class="big-stat-label">{{ s.label }}</div>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA Section -->
      <section class="cta-section">
        <div class="section-container">
          <div class="cta-card">
            <div class="cta-glow"></div>
            <h2>Ready to Secure Your <span class="gradient-text-hero">Transactions</span>?</h2>
            <p>Join thousands of businesses using SecurePay AI to detect and prevent fraud in real-time.</p>
            <a routerLink="/signup" class="btn btn-hero-primary btn-lg">
              <span class="material-icons-outlined">rocket_launch</span>
              Start Free Trial
            </a>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="landing-footer">
        <div class="section-container">
          <div class="footer-content">
            <div class="footer-brand">
              <div class="brand-icon small">
                <span class="material-icons-outlined">shield</span>
              </div>
              <span class="brand-name">SecurePay <span class="brand-ai">AI</span></span>
            </div>
            <p class="footer-text">AI-Powered Fraud Detection with Blockchain Security</p>
            <p class="footer-copy">© 2026 SecurePay AI. DYP Hackathon Project — Built with ❤️</p>
          </div>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .landing-page {
      min-height: 100vh;
      background: var(--bg-primary);
      overflow-x: hidden;
      position: relative;
    }

    /* ====== Background Effects ====== */
    .bg-effects {
      position: fixed;
      inset: 0;
      z-index: 0;
      pointer-events: none;
    }

    .gradient-orb {
      position: absolute;
      border-radius: 50%;
      opacity: 0.2;
      will-change: transform;
    }
    .orb-1 { width: 700px; height: 700px; background: radial-gradient(circle, #6366f1 0%, transparent 70%); top: -200px; right: -150px; animation: float 25s ease-in-out infinite; }
    .orb-2 { width: 500px; height: 500px; background: radial-gradient(circle, #a855f7 0%, transparent 70%); bottom: 10%; left: -150px; animation: float 30s ease-in-out infinite reverse; }
    .orb-3 { width: 400px; height: 400px; background: radial-gradient(circle, #06b6d4 0%, transparent 70%); top: 40%; left: 40%; animation: float 20s ease-in-out infinite; }

    .grid-overlay {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(99, 102, 241, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(99, 102, 241, 0.03) 1px, transparent 1px);
      background-size: 80px 80px;
    }

    .particles {
      position: absolute;
      background: rgba(99, 102, 241, 0.25);
      border-radius: 50%;
      animation: floatParticle 12s infinite ease-in-out;
    }

    @keyframes floatParticle {
      0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
      50% { transform: translateY(-60px) scale(1.5); opacity: 0.7; }
    }

    /* ====== Navbar ====== */
    .navbar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 100;
      padding: 16px 0;
      background: rgba(6, 10, 20, 0.7);
      backdrop-filter: blur(20px);
      border-bottom: 1px solid rgba(99, 102, 241, 0.06);
    }

    .nav-container {
      max-width: 1280px;
      margin: 0 auto;
      padding: 0 40px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .nav-brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand-icon {
      width: 40px;
      height: 40px;
      background: var(--gradient-primary);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 20px rgba(99, 102, 241, 0.3);
    }
    .brand-icon .material-icons-outlined { color: white; font-size: 22px; }
    .brand-icon.small { width: 32px; height: 32px; }
    .brand-icon.small .material-icons-outlined { font-size: 18px; }

    .brand-name {
      font-family: var(--font-display);
      font-size: 22px;
      font-weight: 700;
      color: var(--text-primary);
    }
    .brand-ai {
      background: var(--gradient-primary);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .nav-links {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .nav-link {
      padding: 8px 16px;
      font-size: 14px;
      font-weight: 500;
      color: var(--text-secondary);
      border-radius: 8px;
      transition: all 0.2s;
    }
    .nav-link:hover { color: var(--text-primary); background: rgba(99,102,241,0.06); }
    .login-link { color: var(--accent-primary-light) !important; }

    .nav-cta {
      margin-left: 8px;
      padding: 10px 24px !important;
      font-size: 14px !important;
      color: white !important;
    }

    /* ====== Hero ====== */
    .hero {
      position: relative;
      z-index: 1;
      min-height: 100vh;
      display: grid;
      grid-template-columns: 1fr 1fr;
      align-items: center;
      gap: 60px;
      max-width: 1280px;
      margin: 0 auto;
      padding: 120px 40px 80px;
    }

    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 18px;
      background: rgba(99, 102, 241, 0.08);
      border: 1px solid rgba(99, 102, 241, 0.15);
      border-radius: 60px;
      font-size: 13px;
      font-weight: 600;
      color: var(--accent-primary-light);
      margin-bottom: 28px;
      animation: fadeInUp 0.7s ease both;
    }

    .live-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      animation: glow 2s infinite;
    }

    .hero-title {
      font-family: var(--font-display);
      font-size: 60px;
      font-weight: 700;
      line-height: 1.08;
      letter-spacing: -0.035em;
      color: var(--text-primary);
      margin-bottom: 24px;
      animation: fadeInUp 0.7s ease 0.1s both;
    }

    .gradient-text-hero {
      background: linear-gradient(135deg, #6366f1 0%, #a855f7 40%, #ec4899 80%, #6366f1 100%);
      background-size: 300% 300%;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: gradientShift 5s ease infinite;
    }

    .hero-subtitle {
      font-size: 18px;
      line-height: 1.7;
      color: var(--text-secondary);
      max-width: 520px;
      margin-bottom: 36px;
      animation: fadeInUp 0.7s ease 0.2s both;
    }

    .hero-actions {
      display: flex;
      gap: 16px;
      margin-bottom: 52px;
      animation: fadeInUp 0.7s ease 0.3s both;
    }

    .btn-hero-primary {
      background: var(--gradient-primary);
      color: white;
      padding: 14px 32px;
      font-size: 16px;
      font-weight: 600;
      border-radius: var(--radius-md);
      box-shadow: 0 8px 30px rgba(99, 102, 241, 0.35);
      border: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      transition: all 0.3s;
      text-decoration: none;
    }
    .btn-hero-primary:hover { transform: translateY(-3px); box-shadow: 0 12px 40px rgba(99,102,241,0.5); color: white; }
    .btn-hero-primary.btn-lg { padding: 18px 40px; font-size: 17px; }

    .btn-hero-secondary {
      background: rgba(99, 102, 241, 0.08);
      border: 1px solid rgba(99, 102, 241, 0.2);
      color: var(--accent-primary-light);
      padding: 14px 28px;
      font-size: 16px;
      font-weight: 600;
      border-radius: var(--radius-md);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      transition: all 0.3s;
      text-decoration: none;
    }
    .btn-hero-secondary:hover { background: rgba(99,102,241,0.14); border-color: rgba(99,102,241,0.35); color: var(--accent-primary-light); }

    .hero-stats-row {
      display: flex;
      align-items: center;
      gap: 32px;
      animation: fadeInUp 0.7s ease 0.4s both;
    }

    .hero-stat-value {
      font-family: var(--font-display);
      font-size: 28px;
      font-weight: 700;
      color: var(--text-primary);
      display: block;
    }
    .hero-stat-label {
      font-size: 13px;
      color: var(--text-muted);
    }
    .hero-stat-divider {
      width: 1px;
      height: 40px;
      background: var(--border-color);
    }

    /* ====== Dashboard Preview ====== */
    .hero-visual {
      animation: fadeInScale 0.8s ease 0.3s both;
    }

    .dashboard-preview {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      overflow: hidden;
      box-shadow: var(--shadow-xl), var(--shadow-glow-lg);
    }

    .preview-header {
      background: var(--bg-secondary);
      padding: 12px 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      border-bottom: 1px solid var(--border-color);
    }
    .preview-dots { display: flex; gap: 6px; }
    .dot { width: 10px; height: 10px; border-radius: 50%; }
    .dot.r { background: #ef4444; }
    .dot.y { background: #f59e0b; }
    .dot.g { background: #10b981; }
    .preview-title { font-size: 12px; color: var(--text-muted); }

    .preview-body { padding: 20px; }

    .preview-stat-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 20px;
    }

    .preview-stat {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px;
      border-radius: var(--radius-sm);
      background: var(--bg-surface);
    }
    .preview-stat.green { border-left: 3px solid #10b981; }
    .preview-stat.red { border-left: 3px solid #ef4444; }
    .ps-icon { font-size: 24px; }
    .preview-stat.green .ps-icon { color: #10b981; }
    .preview-stat.red .ps-icon { color: #ef4444; }
    .ps-value { font-family: var(--font-display); font-size: 22px; font-weight: 700; }
    .ps-label { font-size: 11px; color: var(--text-muted); }

    .preview-chart {
      display: flex;
      align-items: flex-end;
      gap: 4px;
      height: 80px;
      margin-bottom: 16px;
      padding: 0 4px;
    }
    .chart-bar {
      flex: 1;
      background: rgba(99, 102, 241, 0.5);
      border-radius: 3px 3px 0 0;
      animation: growBar 0.8s ease both;
      min-height: 4px;
    }
    .chart-bar.danger { background: rgba(239, 68, 68, 0.6); }

    @keyframes growBar {
      from { height: 0 !important; }
    }

    .preview-alert {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 14px;
      background: rgba(239, 68, 68, 0.06);
      border: 1px solid rgba(239, 68, 68, 0.12);
      border-radius: var(--radius-sm);
      font-size: 12px;
      color: var(--text-secondary);
      animation: fadeIn 0.5s ease 1.5s both;
    }
    .preview-alert .badge { margin-left: auto; font-size: 9px; padding: 3px 8px; }

    /* ====== Features ====== */
    .section-container {
      max-width: 1280px;
      margin: 0 auto;
      padding: 0 40px;
    }

    .features, .how-it-works, .stats-section, .cta-section {
      position: relative;
      z-index: 1;
      padding: 100px 0;
    }

    .section-header {
      text-align: center;
      margin-bottom: 64px;
    }

    .section-tag {
      display: inline-block;
      padding: 6px 16px;
      background: rgba(99, 102, 241, 0.08);
      border: 1px solid rgba(99, 102, 241, 0.15);
      border-radius: 30px;
      font-size: 12px;
      font-weight: 700;
      color: var(--accent-primary-light);
      letter-spacing: 1.5px;
      margin-bottom: 20px;
    }

    .section-header h2 {
      font-family: var(--font-display);
      font-size: 42px;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 16px;
      letter-spacing: -0.02em;
    }

    .section-header p {
      font-size: 17px;
      color: var(--text-secondary);
      max-width: 560px;
      margin: 0 auto;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
    }

    .feature-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 32px;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      animation: fadeInUp 0.6s ease both;
    }
    .feature-card:hover {
      transform: translateY(-6px);
      border-color: var(--border-hover);
      box-shadow: var(--shadow-glow);
    }

    .feature-icon-wrap {
      width: 56px;
      height: 56px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
    }
    .feature-icon-wrap .material-icons-outlined { font-size: 26px; }

    .feature-card h3 {
      font-family: var(--font-display);
      font-size: 19px;
      font-weight: 600;
      margin-bottom: 10px;
      color: var(--text-primary);
    }
    .feature-card p {
      font-size: 14px;
      color: var(--text-secondary);
      line-height: 1.6;
    }

    /* ====== How It Works ====== */
    .steps-row {
      display: flex;
      align-items: flex-start;
      justify-content: center;
      gap: 0;
      position: relative;
    }

    .step-card {
      flex: 1;
      max-width: 340px;
      text-align: center;
      padding: 40px 32px;
      position: relative;
    }

    .step-number {
      font-family: var(--font-display);
      font-size: 72px;
      font-weight: 700;
      color: rgba(99, 102, 241, 0.06);
      position: absolute;
      top: 0;
      right: 20px;
      line-height: 1;
    }

    .step-icon {
      width: 64px;
      height: 64px;
      margin: 0 auto 20px;
      background: rgba(99, 102, 241, 0.1);
      border: 2px solid rgba(99, 102, 241, 0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .step-icon .material-icons-outlined { font-size: 28px; color: var(--accent-primary-light); }

    .step-card h3 {
      font-family: var(--font-display);
      font-size: 19px;
      margin-bottom: 10px;
    }
    .step-card p {
      font-size: 14px;
      color: var(--text-secondary);
      line-height: 1.6;
    }

    .step-connector {
      width: 80px;
      height: 2px;
      background: linear-gradient(90deg, transparent, var(--accent-primary), transparent);
      margin-top: 72px;
      opacity: 0.3;
    }

    /* ====== Stats ====== */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 32px;
    }

    .big-stat {
      text-align: center;
      padding: 40px 20px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      transition: all 0.3s;
    }
    .big-stat:hover {
      border-color: var(--border-hover);
      box-shadow: var(--shadow-glow);
      transform: translateY(-4px);
    }
    .big-stat-value {
      font-family: var(--font-display);
      font-size: 42px;
      font-weight: 700;
      margin-bottom: 8px;
      display: block;
    }
    .big-stat-label {
      font-size: 14px;
      color: var(--text-secondary);
    }

    /* ====== CTA ====== */
    .cta-card {
      text-align: center;
      padding: 80px 40px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-xl);
      position: relative;
      overflow: hidden;
    }
    .cta-glow {
      position: absolute;
      width: 400px;
      height: 400px;
      border-radius: 50%;
      background: radial-gradient(circle, var(--accent-primary) 0%, transparent 70%);
      opacity: 0.15;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
    }
    .cta-card h2 {
      font-family: var(--font-display);
      font-size: 38px;
      font-weight: 700;
      margin-bottom: 16px;
      position: relative;
    }
    .cta-card p {
      font-size: 17px;
      color: var(--text-secondary);
      max-width: 500px;
      margin: 0 auto 36px;
      position: relative;
    }
    .cta-card .btn-hero-primary { position: relative; }

    /* ====== Footer ====== */
    .landing-footer {
      position: relative;
      z-index: 1;
      padding: 40px 0;
      border-top: 1px solid var(--border-color);
    }
    .footer-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }
    .footer-brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .footer-text { font-size: 14px; color: var(--text-secondary); }
    .footer-copy { font-size: 12px; color: var(--text-muted); }

    /* ====== Responsive ====== */
    @media (max-width: 1024px) {
      .hero { grid-template-columns: 1fr; text-align: center; padding-top: 140px; }
      .hero-subtitle { margin: 0 auto 36px; }
      .hero-actions { justify-content: center; }
      .hero-stats-row { justify-content: center; }
      .hero-visual { max-width: 560px; margin: 0 auto; }
      .features-grid { grid-template-columns: repeat(2, 1fr); }
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      .hero-title { font-size: 44px; }
    }

    @media (max-width: 640px) {
      .features-grid, .stats-grid { grid-template-columns: 1fr; }
      .hero-title { font-size: 36px; }
      .steps-row { flex-direction: column; align-items: center; }
      .step-connector { width: 2px; height: 40px; background: linear-gradient(transparent, var(--accent-primary), transparent); margin: 0; }
      .nav-links .nav-link:not(.login-link) { display: none; }
      .hero-stats-row { flex-direction: column; gap: 20px; }
      .hero-stat-divider { width: 40px; height: 1px; }
    }
  `]
})
export class LandingComponent implements OnInit, OnDestroy {
  particles: any[] = [];
  chartBars = [30, 50, 25, 70, 40, 85, 35, 55, 20, 45, 75, 30, 60, 40, 50, 35, 80, 25, 65, 45];
  
  animatedStats = { transactions: '50K' };
  
  features = [
    { icon: 'psychology', title: 'AI Detection Engine', desc: 'Multi-model ensemble combining Isolation Forest, Logistic Regression, and rule-based analysis for 99.7% accuracy.', bg: 'rgba(99,102,241,0.12)', color: '#818cf8' },
    { icon: 'link', title: 'Blockchain Verification', desc: 'Every flagged transaction is immutably recorded on Polygon Amoy testnet for transparent audit trails.', bg: 'rgba(6,182,212,0.12)', color: '#06b6d4' },
    { icon: 'analytics', title: 'Real-time Analytics', desc: 'Live dashboards with hourly fraud trends, risk distribution, geographic hotspots, and category analysis.', bg: 'rgba(16,185,129,0.12)', color: '#10b981' },
    { icon: 'upload_file', title: 'CSV Bulk Analysis', desc: 'Upload transaction datasets for instant batch analysis. Process hundreds of transactions in seconds.', bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
    { icon: 'smart_toy', title: 'AI Chatbot Assistant', desc: 'Interactive AI assistant to help you navigate fraud patterns, understand alerts, and get instant answers.', bg: 'rgba(168,85,247,0.12)', color: '#a855f7' },
    { icon: 'notifications_active', title: 'Smart Alerts', desc: 'Instant notifications for high-risk transactions with severity classification and recommended actions.', bg: 'rgba(239,68,68,0.12)', color: '#ef4444' },
  ];

  steps = [
    { icon: 'cloud_upload', title: 'Connect & Import', desc: 'Connect your payment gateway or upload transaction data via CSV for instant analysis.' },
    { icon: 'psychology', title: 'AI Analyzes', desc: 'Our multi-model AI engine scores each transaction in under 50ms with risk factor breakdown.' },
    { icon: 'verified_user', title: 'Protect & Record', desc: 'Fraudulent transactions are blocked automatically and recorded on the blockchain for audit.' },
  ];

  bigStats = [
    { value: '50K+', label: 'Transactions Analyzed' },
    { value: '99.7%', label: 'Detection Accuracy' },
    { value: '<50ms', label: 'Avg. Response Time' },
    { value: '24/7', label: 'Real-time Monitoring' },
  ];

  constructor() {}

  ngOnInit() {
    this.generateParticles();
  }

  ngOnDestroy() {}

  generateParticles() {
    for (let i = 0; i < 20; i++) {
      this.particles.push({
        x: Math.random() * 1400,
        y: Math.random() * 2000,
        delay: Math.random() * 6,
        size: 2 + Math.random() * 4
      });
    }
  }
}
