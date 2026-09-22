import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-permiso-notificacion-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (visible) {
      <div class="modal-overlay" id="modal-permiso-notificacion-overlay">
        <button
          type="button"
          class="modal-backdrop-dismiss"
          (click)="onCancelar()"
          aria-label="Cerrar modal"
        ></button>
        <div class="modal-container glass" role="dialog" aria-modal="true" aria-labelledby="permiso-modal-title">
          <header class="modal-header">
            <div class="header-icon">🔔</div>
            <h2 id="permiso-modal-title" class="modal-title">¿Activar notificaciones?</h2>
            <button type="button" class="btn-close" (click)="onCancelar()" aria-label="Cerrar">✕</button>
          </header>

          <main class="modal-body">
            <p class="intro-text">
              MindDump necesita tu permiso para mostrar avisos oportunos cuando venza una de tus tareas o esté por comenzar un evento programado.
            </p>

            <div class="info-callout">
              <div class="callout-icon">ℹ️</div>
              <div class="callout-content">
                <strong>Limitación del MVP (Regla R-08):</strong>
                <p>
                  Las notificaciones locales funcionan mientras la aplicación esté abierta o en segundo plano en tu navegador/dispositivo. Para alertas con la app totalmente cerrada se requerirá infraestructura en la nube en fases posteriores.
                </p>
              </div>
            </div>

            <p class="sub-text">
              Si eliges no activarlas ahora, tus recordatorios se seguirán guardando de forma segura en tu base de datos local y podrás activar las notificaciones en cualquier momento desde Configuración.
            </p>
          </main>

          <footer class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              id="btn-permiso-cancelar"
              (click)="onCancelar()"
            >
              Ahora no
            </button>
            <button
              type="button"
              class="btn btn-primary"
              id="btn-permiso-confirmar"
              (click)="onConfirmar()"
            >
              🔔 Activar notificaciones
            </button>
          </footer>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-overlay {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(10, 15, 29, 0.75); backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center;
      z-index: 1100; padding: 16px; animation: fadeIn 0.2s ease;
    }
    .modal-backdrop-dismiss {
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      background: transparent; border: none; cursor: default;
    }
    .modal-container {
      position: relative; width: 100%; max-width: 500px;
      border-radius: var(--radius-lg, 16px); padding: 24px;
      display: flex; flex-direction: column; gap: 18px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4); border: 1px solid var(--border-color);
      z-index: 1101; animation: scaleUp 0.2s ease;
    }
    .modal-header {
      display: flex; align-items: center; justify-content: space-between; gap: 12px;
    }
    .header-icon {
      font-size: 1.8rem; background: rgba(99, 102, 241, 0.15); padding: 8px;
      border-radius: 12px; line-height: 1;
    }
    .modal-title { font-size: 1.3rem; font-weight: 700; color: var(--text-primary); margin: 0; flex: 1; }
    .btn-close {
      background: transparent; border: none; font-size: 1.2rem; color: var(--text-secondary);
      cursor: pointer; padding: 4px 8px; border-radius: 8px;
    }
    .btn-close:hover { background: rgba(255, 255, 255, 0.1); color: var(--text-primary); }
    .modal-body { display: flex; flex-direction: column; gap: 14px; font-size: 0.92rem; line-height: 1.5; color: var(--text-secondary); }
    .intro-text { color: var(--text-primary); font-weight: 500; margin: 0; }
    .info-callout {
      display: flex; gap: 12px; background: rgba(59, 130, 246, 0.1);
      border: 1px solid rgba(59, 130, 246, 0.25); border-radius: 10px; padding: 12px 14px;
    }
    .callout-icon { font-size: 1.2rem; line-height: 1; }
    .callout-content strong { color: #93c5fd; font-size: 0.88rem; display: block; margin-bottom: 4px; }
    .callout-content p { margin: 0; font-size: 0.85rem; color: #bfdbfe; line-height: 1.4; }
    .sub-text { font-size: 0.84rem; color: var(--text-muted); margin: 0; }
    .modal-footer {
      display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid var(--border-color);
      padding-top: 16px;
    }
    .btn {
      padding: 9px 18px; border-radius: 8px; font-size: 0.9rem; font-weight: 600;
      cursor: pointer; border: none; transition: all 0.2s;
    }
    .btn-secondary { background: rgba(255, 255, 255, 0.08); color: var(--text-secondary); }
    .btn-secondary:hover { background: rgba(255, 255, 255, 0.15); color: var(--text-primary); }
    .btn-primary { background: var(--primary, #6366f1); color: #fff; }
    .btn-primary:hover { background: #4f46e5; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35); }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  `]
})
export class PermisoNotificacionModalComponent {
  @Input() visible = false;
  @Output() confirmar = new EventEmitter<void>();
  @Output() cancelar = new EventEmitter<void>();

  onConfirmar(): void {
    this.confirmar.emit();
  }

  onCancelar(): void {
    this.cancelar.emit();
  }
}
