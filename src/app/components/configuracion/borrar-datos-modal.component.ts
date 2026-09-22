import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-borrar-datos-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (visible) {
      <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-borrar-title">
        <button type="button" class="modal-dismiss-overlay" (click)="onCancelar()" aria-label="Cerrar"></button>

        <div class="modal-card glass danger-card">
          <header class="modal-header">
            <div class="header-badge">
              <span class="danger-icon">⚠️</span>
              <span class="danger-tag">Zona de Peligro &mdash; Acción Irreversible</span>
            </div>
            <button type="button" class="close-btn" (click)="onCancelar()" aria-label="Cerrar">✕</button>
          </header>

          <div class="modal-body">
            @if (pasoActual() === 1) {
              <!-- Paso 1: Advertencia detallada -->
              <h2 id="modal-borrar-title" class="danger-title">¿Borrar todos los datos locales? (Paso 1 de 2)</h2>
              
              <p class="danger-text">
                Esta acción eliminará de forma permanente todos los elementos almacenados en este dispositivo:
              </p>

              <ul class="danger-list">
                <li>📥 Todas las capturas del Inbox</li>
                <li>📝 Todas las notas</li>
                <li>✅ Todas las tareas y subtareas</li>
                <li>📅 Todos los eventos programados</li>
                <li>⏰ Todos los recordatorios configurados</li>
                <li>🗂️ Todos los espacios personalizados (el espacio de sistema <strong>Útiles</strong> se regenerará vacío automáticamente)</li>
              </ul>

              <div class="step-notice">
                ℹ️ Para proceder, pulsa "Continuar al paso final" donde se te solicitará una segunda confirmación explícita.
              </div>
            } @else {
              <!-- Paso 2: Segunda confirmación explícita -->
              <h2 id="modal-borrar-title" class="danger-title">Confirmación Final Requerida (Paso 2 de 2)</h2>
              
              <p class="danger-text bold">
                Estás a punto de destruir toda tu base de datos de MindDump. No hay copia de seguridad remota porque tus datos viven exclusivamente en este navegador.
              </p>

              <div class="confirm-box">
                <label class="checkbox-label" for="confirm-checkbox">
                  <input
                    type="checkbox"
                    id="confirm-checkbox"
                    [(ngModel)]="confirmacionMarcada"
                  />
                  <span>Comprendo que todos mis datos serán eliminados permanentemente y que esta acción no se puede deshacer.</span>
                </label>
              </div>

              <div class="keyword-box">
                <label for="input-borrar-confirm" class="input-label">
                  Escribe la palabra <strong>BORRAR</strong> para desbloquear el borrado definitivo:
                </label>
                <input
                  type="text"
                  id="input-borrar-confirm"
                  class="keyword-input"
                  placeholder="Escribe BORRAR aquí"
                  [(ngModel)]="textoConfirmacion"
                  autocomplete="off"
                />
              </div>
            }
          </div>

          <footer class="modal-footer">
            <button
              type="button"
              class="btn-secondary"
              id="btn-cancelar-borrado"
              (click)="onCancelar()"
            >
              Cancelar
            </button>

            @if (pasoActual() === 1) {
              <button
                type="button"
                class="btn-warning-step"
                id="btn-continuar-paso-2"
                (click)="irAPaso2()"
              >
                Continuar al paso final →
              </button>
            } @else {
              <button
                type="button"
                class="btn-danger-final"
                id="btn-confirmar-borrado-definitivo"
                [disabled]="!puedeConfirmarFinal()"
                (click)="onConfirmarFinal()"
              >
                🗑️ Borrar definitivamente todo
              </button>
            }
          </footer>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(0, 0, 0, 0.82);
      backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
      display: flex; align-items: center; justify-content: center;
      padding: 16px; z-index: 500; animation: fadeIn 0.2s ease;
    }
    .modal-dismiss-overlay {
      position: absolute; inset: 0; background: transparent; border: none; width: 100%; height: 100%; cursor: pointer; z-index: 1;
    }
    .modal-card {
      position: relative; z-index: 2; width: 100%; max-width: 540px;
      background: var(--bg-surface, #121829); border-radius: var(--radius-lg, 16px);
      border: 1px solid rgba(244, 63, 94, 0.4); box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(244, 63, 94, 0.2);
      display: flex; flex-direction: column; overflow: hidden; animation: scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .modal-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 18px 24px; border-bottom: 1px solid rgba(244, 63, 94, 0.2);
      background: rgba(244, 63, 94, 0.08);
    }
    .header-badge { display: flex; align-items: center; gap: 8px; }
    .danger-icon { font-size: 1.25rem; }
    .danger-tag { font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #fb7185; }
    .close-btn { color: var(--text-muted, #94a3b8); font-size: 1.2rem; cursor: pointer; border: none; background: none; }
    .close-btn:hover { color: #fff; }
    .modal-body { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
    .danger-title { font-size: 1.25rem; font-weight: 700; color: #f43f5e; margin: 0; line-height: 1.3; }
    .danger-text { font-size: 0.92rem; color: var(--text-secondary, #94a3b8); line-height: 1.5; margin: 0; }
    .danger-text.bold { color: #fecdd3; font-weight: 500; }
    .danger-list {
      margin: 0; padding-left: 20px; font-size: 0.88rem; color: var(--text-primary, #f8fafc);
      display: flex; flex-direction: column; gap: 6px;
    }
    .step-notice {
      background: rgba(255, 255, 255, 0.04); border: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
      padding: 10px 14px; border-radius: 8px; font-size: 0.84rem; color: var(--text-muted, #94a3b8);
    }
    .confirm-box {
      background: rgba(244, 63, 94, 0.06); border: 1px solid rgba(244, 63, 94, 0.25);
      border-radius: 10px; padding: 14px;
    }
    .checkbox-label {
      display: flex; gap: 12px; align-items: flex-start; cursor: pointer; font-size: 0.88rem;
      color: #fecdd3; line-height: 1.4; user-select: none;
    }
    .checkbox-label input { width: 18px; height: 18px; margin-top: 2px; accent-color: #f43f5e; }
    .keyword-box { display: flex; flex-direction: column; gap: 6px; }
    .input-label { font-size: 0.85rem; color: var(--text-secondary, #94a3b8); }
    .keyword-input {
      padding: 10px 14px; border-radius: 8px; background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(244, 63, 94, 0.3); color: #fff; font-size: 0.95rem; font-family: inherit;
    }
    .keyword-input:focus { outline: none; border-color: #f43f5e; box-shadow: 0 0 10px rgba(244, 63, 94, 0.3); }
    .modal-footer {
      display: flex; justify-content: flex-end; align-items: center; gap: 12px;
      padding: 16px 24px; border-top: 1px solid rgba(255, 255, 255, 0.08); background: rgba(0, 0, 0, 0.2);
    }
    .btn-secondary {
      padding: 9px 18px; border-radius: 8px; font-size: 0.88rem; font-weight: 600;
      background: rgba(255, 255, 255, 0.08); color: var(--text-secondary, #94a3b8); border: none; cursor: pointer;
    }
    .btn-secondary:hover { background: rgba(255, 255, 255, 0.14); color: #fff; }
    .btn-warning-step {
      padding: 9px 18px; border-radius: 8px; font-size: 0.88rem; font-weight: 600;
      background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4);
      cursor: pointer; transition: all 0.2s;
    }
    .btn-warning-step:hover { background: rgba(245, 158, 11, 0.3); }
    .btn-danger-final {
      padding: 10px 20px; border-radius: 8px; font-size: 0.88rem; font-weight: 700;
      background: #e11d48; color: #fff; border: none; cursor: pointer; transition: all 0.2s;
      box-shadow: 0 4px 14px rgba(225, 29, 72, 0.4);
    }
    .btn-danger-final:hover:not(:disabled) { background: #be123c; }
    .btn-danger-final:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes scaleUp { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
  `]
})
export class BorrarDatosModalComponent {
  @Input() visible = false;
  @Output() cancelado = new EventEmitter<void>();
  @Output() confirmado = new EventEmitter<void>();

  readonly pasoActual = signal<1 | 2>(1);
  confirmacionMarcada = false;
  textoConfirmacion = '';

  irAPaso2(): void {
    this.pasoActual.set(2);
  }

  puedeConfirmarFinal(): boolean {
    return this.confirmacionMarcada && this.textoConfirmacion.trim().toUpperCase() === 'BORRAR';
  }

  onConfirmarFinal(): void {
    if (this.puedeConfirmarFinal()) {
      this.confirmado.emit();
      this.resetState();
    }
  }

  onCancelar(): void {
    this.cancelado.emit();
    this.resetState();
  }

  private resetState(): void {
    this.pasoActual.set(1);
    this.confirmacionMarcada = false;
    this.textoConfirmacion = '';
  }
}
