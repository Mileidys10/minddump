import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FirebaseService } from '../../services/firebase.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="login-container">
      <div class="login-card glass">
        <!-- Encabezado de Marca -->
        <div class="brand-header">
          <div class="brand-badge">⚡ Cloud Sync</div>
          <div class="brand-icon-wrapper">
            <span class="brand-icon">🧠</span>
          </div>
          <h1 class="brand-title">MindDump</h1>
          <p class="brand-subtitle">Tu Segundo Cerebro Digital</p>
        </div>

        <!-- Propuesta de Valor -->
        <div class="features-list">
          <div class="feature-item">
            <span class="feature-icon">📱</span>
            <div class="feature-text">
              <strong>Android en la U</strong>
              <span>Anota rápido en clase sin preocuparte si hay internet.</span>
            </div>
          </div>

          <div class="feature-item">
            <span class="feature-icon">💻</span>
            <div class="feature-text">
              <strong>PC en Casa</strong>
              <span>Tus notas y tareas se sincronizan solas cuando te conectas.</span>
            </div>
          </div>

          <div class="feature-item">
            <span class="feature-icon">🛡️</span>
            <div class="feature-text">
              <strong>100% Offline-First</strong>
              <span>Tus datos se guardan en tu dispositivo primero, siempre.</span>
            </div>
          </div>
        </div>

        <!-- Mensaje de Error si ocurre -->
        <div *ngIf="authService.authError()" class="alert alert-error" id="login-error-alert">
          <span class="alert-icon">⚠️</span>
          <div class="alert-content">
            <p>{{ authService.authError() }}</p>
            <small *ngIf="!firebaseService.isInitialized()">
              Configura las credenciales de Firebase en Configuración o prueba el modo Demo.
            </small>
          </div>
        </div>

        <!-- Acciones de Inicio de Sesión -->
        <div class="auth-actions">
          <button
            type="button"
            class="btn btn-google"
            id="btn-login-google"
            (click)="onLoginGoogle()"
            [disabled]="authService.isLoading()"
          >
            <svg class="google-icon" viewBox="0 0 24 24" width="20" height="20">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.35 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.16 0 9.98 0 12s.45 3.84 1.24 5.42l4.04-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>{{ authService.isLoading() ? 'Iniciando...' : 'Continuar con Google' }}</span>
          </button>

          <div class="divider">
            <span>o alternativas</span>
          </div>

          <button
            type="button"
            class="btn btn-demo"
            id="btn-login-demo"
            (click)="onLoginDemo()"
            [disabled]="authService.isLoading()"
          >
            🎓 Continuar como Estudiante U (Demo Local)
          </button>

          <button
            type="button"
            class="btn btn-guest"
            id="btn-login-guest"
            (click)="onContinueGuest()"
            [disabled]="authService.isLoading()"
          >
            📴 Usar solo en este dispositivo (Sin cuenta)
          </button>
        </div>

        <div class="footer-note">
          <small>Tus datos siempre se guardan primero en tu navegador con IndexedDB.</small>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: calc(100vh - 4rem);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      background: radial-gradient(circle at 50% 10%, rgba(99, 102, 241, 0.15), transparent 70%);
    }

    .login-card {
      width: 100%;
      max-width: 480px;
      padding: 2.5rem 2rem;
      border-radius: 1.5rem;
      background: rgba(30, 32, 44, 0.85);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.5), 0 0 50px -20px rgba(99, 102, 241, 0.3);
      text-align: center;
    }

    .brand-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      background: rgba(99, 102, 241, 0.2);
      color: #818cf8;
      border: 1px solid rgba(99, 102, 241, 0.4);
      margin-bottom: 1rem;
    }

    .brand-icon-wrapper {
      width: 72px;
      height: 72px;
      margin: 0 auto 0.75rem auto;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 1.25rem;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(168, 85, 247, 0.3));
      border: 1px solid rgba(255, 255, 255, 0.15);
      box-shadow: 0 8px 24px -6px rgba(99, 102, 241, 0.4);
    }

    .brand-icon {
      font-size: 2.5rem;
    }

    .brand-title {
      font-size: 2rem;
      font-weight: 800;
      margin: 0;
      background: linear-gradient(135deg, #ffffff 40%, #a5b4fc 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .brand-subtitle {
      color: #94a3b8;
      font-size: 0.95rem;
      margin-top: 0.25rem;
      margin-bottom: 1.75rem;
    }

    .features-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 2rem;
      text-align: left;
    }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border-radius: 0.85rem;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.05);
      transition: transform 0.2s ease, background 0.2s ease;
    }

    .feature-item:hover {
      background: rgba(255, 255, 255, 0.06);
      transform: translateY(-1px);
    }

    .feature-icon {
      font-size: 1.4rem;
      flex-shrink: 0;
    }

    .feature-text {
      display: flex;
      flex-direction: column;
      font-size: 0.82rem;
      line-height: 1.3;
    }

    .feature-text strong {
      color: #f1f5f9;
      font-size: 0.88rem;
    }

    .feature-text span {
      color: #94a3b8;
    }

    .alert {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border-radius: 0.75rem;
      margin-bottom: 1.5rem;
      text-align: left;
      font-size: 0.85rem;
    }

    .alert-error {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #fca5a5;
    }

    .auth-actions {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 0.85rem 1.25rem;
      border-radius: 0.85rem;
      font-weight: 600;
      font-size: 0.95rem;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
      outline: none;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-google {
      background: #ffffff;
      color: #1e293b;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .btn-google:hover:not(:disabled) {
      background: #f8fafc;
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
    }

    .divider {
      display: flex;
      align-items: center;
      margin: 0.5rem 0;
      color: #64748b;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .divider::before,
    .divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: rgba(255, 255, 255, 0.1);
    }

    .divider span {
      padding: 0 0.75rem;
    }

    .btn-demo {
      background: rgba(99, 102, 241, 0.2);
      color: #c7d2fe;
      border: 1px solid rgba(99, 102, 241, 0.4);
    }

    .btn-demo:hover:not(:disabled) {
      background: rgba(99, 102, 241, 0.35);
      color: #ffffff;
    }

    .btn-guest {
      background: transparent;
      color: #94a3b8;
      border: 1px solid rgba(255, 255, 255, 0.1);
      font-size: 0.88rem;
    }

    .btn-guest:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.05);
      color: #f1f5f9;
    }

    .footer-note {
      margin-top: 1.5rem;
      color: #64748b;
      font-size: 0.75rem;
    }
  `]
})
export class LoginComponent {
  readonly authService = inject(AuthService);
  readonly firebaseService = inject(FirebaseService);
  private readonly router = inject(Router);

  async onLoginGoogle(): Promise<void> {
    const success = await this.authService.loginWithGoogle();
    if (success) {
      this.router.navigate(['/inicio']);
    }
  }

  onLoginDemo(): void {
    this.authService.loginAsDemo();
    this.router.navigate(['/inicio']);
  }

  onContinueGuest(): void {
    this.authService.enableOfflineGuestMode();
    this.router.navigate(['/inicio']);
  }
}
