import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Tarea } from '../../models';

@Component({
  selector: 'app-tarea-delete-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (visible && tarea) {
      <div class="modal-overlay" id="modal-delete-tarea-overlay">
        <button
          type="button"
          class="modal-backdrop-dismiss"
          (click)="onCancelar()"
          aria-label="Cerrar confirmación"
        ></button>
        <div class="modal-container glass" role="alertdialog" aria-modal="true" aria-labelledby="modal-delete-title">
          <div class="danger-icon-wrapper">
            <span class="danger-icon">⚠️</span>
          </div>

          <h2 id="modal-delete-title">¿Eliminar tarea?</h2>

          <p class="modal-description">
            Estás a punto de eliminar permanentemente la tarea
            <strong class="tarea-name">"{{ tarea.titulo }}"</strong>.
          </p>

          <p class="warning-box">
            🔔 <strong>Aviso:</strong> Todos los recordatorios asociados a esta tarea también se eliminarán de IndexedDB.
          </p>

          <footer class="modal-actions">
            <button
              type="button"
              class="btn btn-secondary"
              id="btn-cancel-delete-tarea"
              (click)="onCancelar()"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="btn btn-danger"
              id="btn-confirm-delete-tarea"
              (click)="onConfirmar()"
            >
              Sí, eliminar tarea
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
      z-index: 1050; padding: 16px; animation: fadeIn 0.2s ease;
    }
    .modal-backdrop-dismiss {
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      background: transparent; border: none; cursor: default;
    }
    .modal-container {
      position: relative; width: 100%; max-width: 440px; border-radius: var(--radius-lg, 16px);
      padding: 28px 24px 20px; display: flex; flex-direction: column; align-items: center;
      text-align: center; gap: 14px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
      border: 1px solid rgba(244, 63, 94, 0.3); z-index: 1051; animation: scaleUp 0.2s ease;
    }
    .danger-icon-wrapper {
      width: 56px; height: 56px; border-radius: 50%; background: rgba(244, 63, 94, 0.15);
      display: flex; align-items: center; justify-content: center;
    }
    .danger-icon { font-size: 1.8rem; }
    h2 { font-size: 1.3rem; font-weight: 700; color: var(--text-primary); margin: 0; }
    .modal-description { font-size: 0.95rem; color: var(--text-secondary); margin: 0; line-height: 1.4; }
    .tarea-name { color: var(--text-primary); }
    .warning-box {
      width: 100%; box-sizing: border-box; background: rgba(244, 63, 94, 0.1);
      border: 1px solid rgba(244, 63, 94, 0.25); border-radius: 8px;
      padding: 10px 12px; font-size: 0.85rem; color: #fb7185; text-align: left;
    }
    .modal-actions {
      display: flex; gap: 12px; width: 100%; justify-content: center; margin-top: 8px;
    }
    .btn {
      flex: 1; padding: 10px 16px; border-radius: var(--radius-md, 8px);
      font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: all 0.2s; border: none;
    }
    .btn-secondary {
      background: rgba(255, 255, 255, 0.08); color: var(--text-secondary);
    }
    .btn-secondary:hover { background: rgba(255, 255, 255, 0.15); color: var(--text-primary); }
    .btn-danger {
      background: #f43f5e; color: #fff;
    }
    .btn-danger:hover {
      background: #e11d48; box-shadow: 0 4px 14px rgba(244, 63, 94, 0.4);
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  `]
})
export class TareaDeleteModalComponent {
  @Input() visible = false;
  @Input() tarea: Tarea | null = null;

  @Output() confirmar = new EventEmitter<number>();
  @Output() cancelar = new EventEmitter<void>();

  onConfirmar(): void {
    if (this.tarea && this.tarea.id) {
      this.confirmar.emit(this.tarea.id);
    }
  }

  onCancelar(): void {
    this.cancelar.emit();
  }
}
