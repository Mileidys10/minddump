import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InboxItem } from '../../models';

@Component({
  selector: 'app-inbox-delete-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (visible && item) {
      <div class="modal-overlay" id="modal-delete-inbox-overlay">
        <button
          type="button"
          class="modal-backdrop-dismiss"
          (click)="onCancelar()"
          aria-label="Cerrar confirmación"
        ></button>
        <div class="modal-container glass" role="alertdialog" aria-modal="true" aria-labelledby="modal-delete-inbox-title">
          <div class="danger-icon-wrapper">
            <span class="danger-icon">🗑️</span>
          </div>

          <h2 id="modal-delete-inbox-title">¿Eliminar captura?</h2>

          <p class="modal-description">
            ¿Estás seguro de que deseas eliminar la captura
            <strong class="item-name">"{{ item.titulo }}"</strong> del Inbox?
          </p>
          <p class="sub-text">Esta acción no se puede deshacer.</p>

          <footer class="modal-actions">
            <button
              type="button"
              class="btn btn-secondary"
              id="btn-cancel-delete-inbox"
              (click)="onCancelar()"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="btn btn-danger"
              id="btn-confirm-delete-inbox"
              (click)="onConfirmar()"
            >
              Sí, eliminar
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
      position: relative; width: 100%; max-width: 420px; border-radius: var(--radius-lg, 16px);
      padding: 28px 24px 20px; display: flex; flex-direction: column; align-items: center;
      text-align: center; gap: 12px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
      border: 1px solid rgba(244, 63, 94, 0.3); z-index: 1101; animation: scaleUp 0.2s ease;
    }
    .danger-icon-wrapper {
      width: 52px; height: 52px; border-radius: 50%; background: rgba(244, 63, 94, 0.15);
      display: flex; align-items: center; justify-content: center;
    }
    .danger-icon { font-size: 1.6rem; }
    h2 { font-size: 1.3rem; font-weight: 700; color: var(--text-primary); margin: 0; }
    .modal-description { font-size: 0.95rem; color: var(--text-secondary); margin: 0; line-height: 1.4; }
    .item-name { color: var(--text-primary); }
    .sub-text { font-size: 0.8rem; color: var(--text-muted, #94a3b8); margin: 0; }
    .modal-actions {
      display: flex; gap: 12px; width: 100%; justify-content: center; margin-top: 10px;
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
export class InboxDeleteModalComponent {
  @Input() visible = false;
  @Input() item: InboxItem | null = null;

  @Output() confirmar = new EventEmitter<number>();
  @Output() cancelar = new EventEmitter<void>();

  onConfirmar(): void {
    if (this.item && this.item.id) {
      this.confirmar.emit(this.item.id);
    }
  }

  onCancelar(): void {
    this.cancelar.emit();
  }
}
