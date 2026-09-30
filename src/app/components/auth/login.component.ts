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
        <!-- Brand Header -->
        <div class="brand-badge">
          <span class="status-dot"></span>
          <span>Cloud Sync &bull; Local-First</span>
        </div>

        <div class="brand-icon-wrapper">
          <span class="brand-icon">⚡</span>
        </div>

        <h1 class="brand-title">MindDump</h1>
        <p class="brand-subtitle">Capturador cognitivo y sincronización de pensamiento</p>

        <!-- Mensaje de Alerta si hay error -->
        <div *ngIf="authService.authError()" class="alert alert-error">
          <span class="alert-icon">⚠️</span>
          <span>{{ authService.authError() }}</span>
        </div>

        <!-- Propuesta de Valor / Features -->
        <div class="features-list">
          <div class="feature-item">
            <span class="feature-icon feature-emerald">⚡</span>
            <div class="feature-text">
              <strong>Offline &bull; Latencia Cero</strong>
              <span>Tus ideas se guardan al instante en tu dispositivo</span>
            </div>
          </div>

          <div class="feature-item">
            <span class="feature-icon feature-amber">☁️</span>
            <div class="feature-text">
              <strong>Sincronización en la Nube</strong>
              <span>Conecta tus notas en tiempo real entre celular y PC</span>
            </div>
          </div>

          <div class="feature-item">
            <span class="feature-icon feature-titanium">🔒</span>
            <div class="feature-text">
              <strong>Privacidad y Control</strong>
              <span>Cifrado de extremo a extremo sin tarifas ni intermediarios</span>
            </div>
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
            <svg class="google-icon" viewBox="0 0 24 24" width="18" height="18">
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
            <span>{{ authService.isLoading() ? 'Conectando...' : 'Continuar con Google' }}</span>
          </button>

          <div class="divider">
            <span>o acceso inmediato</span>
          </div>

          <button
            type="button"
            class="btn btn-demo"
            id="btn-login-demo"
            (click)="onLoginDemo()"
            [disabled]="authService.isLoading()"
          >
            🎓 Ingresar en Modo Demo (Estudiante U)
          </button>

          <button
            type="button"
            class="btn btn-guest"
            id="btn-login-guest"
            (click)="onContinueGuest()"
            [disabled]="authService.isLoading()"
          >
            📱 Usar solo en este dispositivo (Sin cuenta)
          </button>
        </div>

        <div class="footer-note">
          <small>Tus notas se guardan con seguridad local en IndexedDB y se sincronizan vía Firebase.</small>
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
      background: radial-gradient(circle at 50% 15%, rgba(245, 158, 11, 0.05), transparent 60%),
                  radial-gradient(circle at 80% 80%, rgba(16, 185, 129, 0.03), transparent 50%),
                  #0c0d0f;
    }

    .login-card {
      width: 100%;
      max-width: 460px;
      padding: 2.5rem 2.25rem;
      border-radius: 20px;
      background: rgba(20, 21, 24, 0.88);
      backdrop-filter: blur(24px) saturate(160%);
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.7), 0 0 1px 1px rgba(255, 255, 255, 0.05);
      text-align: center;
    }

    .brand-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 0.28rem 0.85rem;
      border-radius: 9999px;
      font-size: 0.72rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      background: rgba(245, 158, 11, 0.08);
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.22);
      margin-bottom: 1.25rem;
    }

    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 8px #10b981;
    }

    .brand-icon-wrapper {
      width: 64px;
      height: 64px;
      margin: 0 auto 1rem auto;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 16px;
      background: #18191d;
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
    }

    .brand-icon {
      font-size: 2rem;
    }

    .brand-title {
      font-size: 2.1rem;
      font-weight: 800;
      margin: 0;
      color: #f4f4f5;
      letter-spacing: -0.03em;
    }

    .brand-subtitle {
      color: #a1a1aa;
      font-size: 0.92rem;
      margin-top: 0.35rem;
      margin-bottom: 1.75rem;
    }

    .features-list {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      margin-bottom: 2rem;
      text-align: left;
    }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      padding: 0.75rem 1rem;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.025);
      border: 1px solid rgba(255, 255, 255, 0.05);
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .feature-item:hover {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.1);
      transform: translateY(-1px);
    }

    .feature-icon {
      font-size: 1.25rem;
      flex-shrink: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.04);
    }

    .feature-emerald { color: #10b981; }
    .feature-amber { color: #f59e0b; }
    .feature-titanium { color: #e4e4e7; }

    .feature-text {
      display: flex;
      flex-direction: column;
      font-size: 0.8rem;
      line-height: 1.35;
    }

    .feature-text strong {
      color: #f4f4f5;
      font-size: 0.86rem;
      font-weight: 600;
    }

    .feature-text span {
      color: #71717a;
    }

    .alert {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border-radius: 10px;
      margin-bottom: 1.5rem;
      text-align: left;
      font-size: 0.84rem;
      line-height: 1.4;
    }

    .alert-error {
      background: rgba(244, 63, 94, 0.1);
      border: 1px solid rgba(244, 63, 94, 0.25);
      color: #fda4af;
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
      gap: 0.65rem;
      padding: 0.85rem 1.25rem;
      border-radius: 12px;
      font-weight: 600;
      font-size: 0.92rem;
      cursor: pointer;
      transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
      border: none;
      outline: none;
    }

    .btn:active {
      transform: scale(0.98);
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-google {
      background: #f4f4f5;
      color: #09090b;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);
    }

    .btn-google:hover:not(:disabled) {
      background: #ffffff;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.45);
      transform: translateY(-1px);
    }

    .divider {
      display: flex;
      align-items: center;
      margin: 0.35rem 0;
      color: #52525b;
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .divider::before,
    .divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: rgba(255, 255, 255, 0.06);
    }

    .divider span {
      padding: 0 0.75rem;
    }

    .btn-demo {
      background: rgba(245, 158, 11, 0.08);
      color: #fde68a;
      border: 1px solid rgba(245, 158, 11, 0.22);
    }

    .btn-demo:hover:not(:disabled) {
      background: rgba(245, 158, 11, 0.15);
      border-color: rgba(245, 158, 11, 0.35);
      color: #ffffff;
    }

    .btn-guest {
      background: transparent;
      color: #a1a1aa;
      border: 1px solid rgba(255, 255, 255, 0.08);
      font-size: 0.86rem;
    }

    .btn-guest:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.04);
      border-color: rgba(255, 255, 255, 0.15);
      color: #f4f4f5;
    }

    .footer-note {
      margin-top: 1.5rem;
      color: #52525b;
      font-size: 0.74rem;
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
