import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Espacio } from '../../models';

@Component({
  selector: 'app-espacio-delete-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop" role="dialog" aria-modal="true" aria-label="Confirmar eliminación de espacio">
      <button type="button" class="modal-overlay-dismiss" (click)="onCancel()" aria-label="Cerrar modal"></button>
      <div class="modal-card glass" id="delete-confirm-modal">
        <header class="modal-header">
          <div class="warning-icon">⚠️</div>
          <h3>¿Eliminar espacio?</h3>
        </header>

        <div class="modal-body">
          <p class="warning-main">
            Estás a punto de eliminar el espacio <strong>«{{ espacio?.nombre }}»</strong>.
          </p>
          <div class="orphan-alert glass">
            <span class="alert-icon">ℹ️</span>
            <p>
              <strong>Aviso sobre elementos asociados:</strong> Las notas, tareas y eventos que pertenezcan a este espacio <em>NO</em> se eliminarán. Quedarán sin clasificar (<code>espacioId: null</code>) y podrás acceder a ellos a través de la <strong>Búsqueda Global</strong>.
            </p>
          </div>
        </div>

        <footer class="modal-footer">
          <button type="button" class="btn btn-secondary" (click)="onCancel()" id="btn-cancel-delete">
            Cancelar
          </button>
          <button type="button" class="btn btn-danger" (click)="onConfirm()" id="btn-confirm-delete">
            Sí, eliminar espacio
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
    .modal-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; }
    .warning-main { font-size: 0.95rem; color: var(--text-primary); }
    .orphan-alert {
      padding: 12px 16px; border-radius: var(--radius-md); background: rgba(99, 102, 241, 0.1);
      border: 1px solid rgba(99, 102, 241, 0.25); display: flex; gap: 12px; align-items: flex-start;
    }
    .alert-icon { font-size: 1.2rem; flex-shrink: 0; margin-top: 2px; }
    .orphan-alert p { font-size: 0.85rem; color: var(--text-secondary); line-height: 1.4; }
    .orphan-alert strong { color: #818cf8; }
    code {
      font-family: monospace; font-size: 0.8rem; background: rgba(255, 255, 255, 0.08);
      padding: 2px 6px; border-radius: var(--radius-sm); color: #a78bfa;
    }
    .modal-footer {
      display: flex; justify-content: flex-end; gap: 12px; padding: 16px 24px;
      border-top: 1px solid var(--border-color); background: rgba(0, 0, 0, 0.15);
    }
    .btn {
      padding: 10px 18px; border-radius: var(--radius-md); font-size: 0.92rem;
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
export class EspacioDeleteModalComponent {
  @Input() espacio?: Espacio | null = null;
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
