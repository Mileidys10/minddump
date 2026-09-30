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
          <!-- Vector Brain Icon (Precision Instrument SVG) -->
          <svg class="brand-svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/>
            <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/>
            <path d="M12 5v13"/>
            <path d="m9 10 3-3 3 3"/>
          </svg>
        </div>

        <h1 class="brand-title">MindDump</h1>
        <p class="brand-subtitle">Capturador cognitivo y sincronizacion de pensamiento</p>

        <!-- Mensaje de Alerta si hay error -->
        <div *ngIf="authService.authError()" class="alert alert-error">
          <svg class="alert-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" x2="12" y1="8" y2="12"/>
            <line x1="12" x2="12.01" y1="16" y2="16"/>
          </svg>
          <span>{{ authService.authError() }}</span>
        </div>

        <!-- Propuesta de Valor / Features con SVGs vectoriales elegantes -->
        <div class="features-list">
          <div class="feature-item">
            <span class="feature-icon feature-emerald">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            </span>
            <div class="feature-text">
              <strong>Offline &bull; Latencia Cero</strong>
              <span>Tus ideas se guardan al instante en tu dispositivo</span>
            </div>
          </div>

          <div class="feature-item">
            <span class="feature-icon feature-amber">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>
                <path d="m11 13 2 2 4-4"/>
              </svg>
            </span>
            <div class="feature-text">
              <strong>Sincronizacion en la Nube</strong>
              <span>Conecta tus notas en tiempo real entre celular y PC</span>
            </div>
          </div>

          <div class="feature-item">
            <span class="feature-icon feature-titanium">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>
                <path d="m9 12 2 2 4-4"/>
              </svg>
            </span>
            <div class="feature-text">
              <strong>Privacidad y Control</strong>
              <span>Cifrado y persistencia local sin tarifas ni intermediarios</span>
            </div>
          </div>
        </div>

        <!-- Acciones de Inicio de Sesion -->
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
            <svg class="btn-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
            </svg>
            <span>Ingresar en Modo Demo (Estudiante U)</span>
          </button>

          <button
            type="button"
            class="btn btn-guest"
            id="btn-login-guest"
            (click)="onContinueGuest()"
            [disabled]="authService.isLoading()"
          >
            <svg class="btn-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect width="20" height="8" x="2" y="14" rx="2"/>
              <path d="M6 18h.01"/>
              <path d="M10 18h.01"/>
              <path d="M2 14v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4"/>
            </svg>
            <span>Usar solo en este dispositivo (Modo Local)</span>
          </button>
        </div>

        <div class="footer-note">
          <small>Tus notas se guardan con seguridad local en IndexedDB y se sincronizan via Firebase.</small>
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
      background: radial-gradient(circle at 50% 15%, rgba(245, 158, 11, 0.04), transparent 60%),
                  radial-gradient(circle at 80% 80%, rgba(16, 185, 129, 0.02), transparent 50%),
                  #09090b;
    }

    .login-card {
      width: 100%;
      max-width: 460px;
      padding: 2.5rem 2.25rem;
      border-radius: 20px;
      background: rgba(24, 24, 27, 0.88);
      backdrop-filter: blur(24px) saturate(160%);
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.7), inset 0 1px 0 0 rgba(255, 255, 255, 0.06);
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
      letter-spacing: 0.05em;
      text-transform: uppercase;
      background: rgba(245, 158, 11, 0.08);
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.2);
      margin-bottom: 1.25rem;
    }

    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
    }

    .brand-icon-wrapper {
      width: 60px;
      height: 60px;
      margin: 0 auto 1.15rem auto;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 16px;
      background: #18191d;
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.08);
      color: #f59e0b;
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .brand-icon-wrapper:hover {
      transform: scale(1.05);
    }

    .brand-svg {
      color: #fbbf24;
    }

    .brand-title {
      font-size: 2.1rem;
      font-weight: 800;
      margin: 0;
      color: #fafafa;
      letter-spacing: -0.035em;
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
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.06);
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .feature-item:hover {
      background: rgba(255, 255, 255, 0.04);
      border-color: rgba(255, 255, 255, 0.12);
      transform: translateY(-1px);
    }

    .feature-icon {
      flex-shrink: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.06);
    }

    .feature-emerald { 
      color: #34d399; 
      background: rgba(16, 185, 129, 0.08);
      border-color: rgba(16, 185, 129, 0.16);
    }
    .feature-amber { 
      color: #fbbf24; 
      background: rgba(245, 158, 11, 0.08);
      border-color: rgba(245, 158, 11, 0.16);
    }
    .feature-titanium { 
      color: #e4e4e7; 
      background: rgba(228, 228, 231, 0.06);
      border-color: rgba(228, 228, 231, 0.12);
    }

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
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border-radius: 10px;
      margin-bottom: 1.5rem;
      text-align: left;
      font-size: 0.84rem;
      line-height: 1.4;
    }

    .alert-error {
      background: rgba(244, 63, 94, 0.08);
      border: 1px solid rgba(244, 63, 94, 0.22);
      color: #fda4af;
    }

    .alert-svg {
      flex-shrink: 0;
      color: #fb7185;
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

    .btn-icon {
      flex-shrink: 0;
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
      background: rgba(245, 158, 11, 0.14);
      border-color: rgba(245, 158, 11, 0.32);
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
