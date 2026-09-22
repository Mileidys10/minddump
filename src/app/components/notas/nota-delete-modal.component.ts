import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Nota } from '../../models';

@Component({
  selector: 'app-nota-delete-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop" role="dialog" aria-modal="true" aria-label="Confirmar eliminación de nota">
      <button type="button" class="modal-overlay-dismiss" (click)="onCancel()" aria-label="Cerrar modal"></button>
      <div class="modal-card glass" id="delete-nota-confirm-modal">
        <header class="modal-header">
          <div class="warning-icon">🗑️</div>
          <h3>¿Eliminar nota?</h3>
        </header>

        <div class="modal-body">
          <p class="warning-main">
            ¿Estás seguro de que deseas eliminar la nota <strong>«{{ nota?.titulo }}»</strong>?
          </p>
          <p class="warning-sub">
            Esta acción no se puede deshacer. La nota se eliminará permanentemente de tu base de datos local.
          </p>
        </div>

        <footer class="modal-footer">
          <button type="button" class="btn btn-secondary" (click)="onCancel()" id="btn-cancel-delete-nota">
            Cancelar
          </button>
          <button type="button" class="btn btn-danger" (click)="onConfirm()" id="btn-confirm-delete-nota">
            Sí, eliminar nota
          </button>
        </footer>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center;
      padding: 16px; z-index: 450; animation: fadeIn 0.2s ease;
    }
    .modal-overlay-dismiss {
      position: absolute; inset: 0; background: transparent; border: none;
      width: 100%; height: 100%; cursor: pointer; z-index: 1;
    }
    .modal-card {
      position: relative; z-index: 2;
      width: 100%; max-width: 440px; background: var(--bg-surface);
      border-radius: var(--radius-lg); border: 1px solid rgba(244, 63, 94, 0.3);
      box-shadow: 0 16px 36px rgba(0, 0, 0, 0.45); display: flex; flex-direction: column;
      overflow: hidden; animation: scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .modal-header {
      display: flex; align-items: center; gap: 12px; padding: 20px 24px;
      border-bottom: 1px solid var(--border-color);
    }
    .warning-icon { font-size: 1.5rem; }
    .modal-header h3 { font-size: 1.25rem; font-weight: 600; color: var(--text-primary); }
    .modal-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 10px; }
    .warning-main { font-size: 0.98rem; color: var(--text-primary); line-height: 1.4; }
    .warning-sub { font-size: 0.85rem; color: var(--text-secondary); line-height: 1.4; }
    .modal-footer {
      display: flex; justify-content: flex-end; gap: 12px; padding: 16px 24px;
      border-top: 1px solid var(--border-color); background: rgba(0, 0, 0, 0.15);
    }
    .btn {
      padding: 9px 18px; border-radius: var(--radius-md); font-size: 0.9rem;
      font-weight: 600; transition: background var(--transition-fast);
    }
    .btn-secondary {
      background: rgba(255, 255, 255, 0.05); color: var(--text-secondary);
      border: 1px solid var(--border-color);
    }
    .btn-secondary:hover { background: rgba(255, 255, 255, 0.1); color: var(--text-primary); }
    .btn-danger {
      background: var(--accent-rose); color: white;
      box-shadow: 0 2px 10px rgba(244, 63, 94, 0.35);
    }
    .btn-danger:hover { background: #e11d48; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes scaleUp { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
  `]
})
export class NotaDeleteModalComponent {
  @Input() nota?: Nota | null = null;
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
