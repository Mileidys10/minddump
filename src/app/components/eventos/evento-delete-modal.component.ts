import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Evento } from '../../models';

@Component({
  selector: 'app-evento-delete-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (visible && evento) {
      <div class="modal-overlay" id="modal-delete-evento-overlay">
        <button
          type="button"
          class="modal-backdrop-dismiss"
          (click)="onCancelar()"
          aria-label="Cancelar eliminación"
        ></button>
        <div
          class="modal-container glass"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-delete-evento-title"
        >
          <header class="modal-header">
            <h2 id="modal-delete-evento-title" class="modal-title">
              🗑️ ¿Eliminar Evento?
            </h2>
            <button
              type="button"
              class="btn-close"
              (click)="onCancelar()"
              aria-label="Cerrar"
            >
              ✕
            </button>
          </header>

          <main class="modal-body">
            <p class="warning-text">
              ¿Estás seguro de que deseas eliminar permanentemente el siguiente evento de tu agenda?
            </p>

            <div class="evento-preview">
              <span class="preview-icon">📅</span>
              <div class="preview-content">
                <strong>{{ evento.titulo }}</strong>
                @if (evento.descripcion) {
                  <small>{{ evento.descripcion }}</small>
                }
              </div>
            </div>

            <div class="cascade-alert">
              <span class="alert-icon">⚠️</span>
              <span>
                Esta acción es irreversible y eliminará también todos los <strong>recordatorios y notificaciones</strong> asociados a este evento en la base de datos local.
              </span>
            </div>
          </main>

          <footer class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              id="btn-cancelar-delete-evento"
              (click)="onCancelar()"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="btn btn-danger"
              id="btn-confirmar-delete-evento"
              (click)="onConfirmar()"
            >
              Sí, Eliminar Evento
            </button>
          </footer>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-overlay {
      position: fixed; inset: 0; z-index: 1100;
      display: flex; align-items: center; justify-content: center;
      padding: 16px; background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(6px); animation: fadeIn 0.2s ease-out;
    }
    .modal-backdrop-dismiss {
      position: absolute; inset: 0; background: transparent;
      border: none; cursor: default; width: 100%; height: 100%;
    }
    .modal-container {
      position: relative; width: 100%; max-width: 480px;
      border-radius: var(--radius-lg, 16px);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
      border: 1px solid rgba(244, 63, 94, 0.25);
      overflow: hidden; animation: scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      z-index: 1;
    }
    .modal-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(244, 63, 94, 0.08);
    }
    .modal-title { font-size: 1.15rem; font-weight: 700; color: #fb7185; margin: 0; }
    .btn-close {
      background: transparent; border: none; font-size: 1.1rem;
      color: var(--text-secondary); cursor: pointer; padding: 4px 8px;
      border-radius: 6px; transition: all 0.2s;
    }
    .btn-close:hover { background: rgba(255, 255, 255, 0.1); color: var(--text-primary); }
    .modal-body { padding: 20px; display: flex; flex-direction: column; gap: 14px; }
    .warning-text { font-size: 0.95rem; color: var(--text-primary); margin: 0; }
    .evento-preview {
      display: flex; align-items: center; gap: 12px; padding: 12px 14px;
      background: rgba(255, 255, 255, 0.04); border-radius: var(--radius-md, 8px);
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    .preview-icon { font-size: 1.5rem; }
    .preview-content { display: flex; flex-direction: column; gap: 2px; }
    .preview-content strong { color: var(--text-primary); font-size: 0.95rem; }
    .preview-content small { color: var(--text-secondary); font-size: 0.8rem; }
    .cascade-alert {
      display: flex; align-items: flex-start; gap: 10px; padding: 10px 14px;
      background: rgba(244, 63, 94, 0.1); border-radius: var(--radius-md, 8px);
      border: 1px solid rgba(244, 63, 94, 0.2); font-size: 0.82rem; color: #fda4af;
      line-height: 1.4;
    }
    .alert-icon { font-size: 1rem; flex-shrink: 0; margin-top: 2px; }
    .modal-footer {
      display: flex; justify-content: flex-end; gap: 12px;
      padding: 14px 20px; border-top: 1px solid rgba(255, 255, 255, 0.08);
    }
    .btn {
      padding: 10px 18px; border-radius: var(--radius-md, 8px); font-weight: 600;
      font-size: 0.9rem; cursor: pointer; transition: all 0.2s; border: none;
    }
    .btn-secondary { background: rgba(255, 255, 255, 0.08); color: var(--text-secondary); }
    .btn-secondary:hover { background: rgba(255, 255, 255, 0.15); color: var(--text-primary); }
    .btn-danger {
      background: #e11d48; color: #fff;
    }
    .btn-danger:hover {
      background: #be123c; box-shadow: 0 4px 12px rgba(225, 29, 72, 0.4);
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  `]
})
export class EventoDeleteModalComponent {
  @Input() visible = false;
  @Input() evento: Evento | null = null;

  @Output() confirmar = new EventEmitter<number>();
  @Output() cancelar = new EventEmitter<void>();

  onConfirmar(): void {
    if (this.evento && this.evento.id !== undefined) {
      this.confirmar.emit(this.evento.id);
    }
  }

  onCancelar(): void {
    this.cancelar.emit();
  }
}
