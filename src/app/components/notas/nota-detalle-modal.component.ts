import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Nota, Espacio } from '../../models';

@Component({
  selector: 'app-nota-detalle-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop" role="dialog" aria-modal="true" aria-label="Detalle de nota">
      <button type="button" class="modal-overlay-dismiss" (click)="onClose()" aria-label="Cerrar modal"></button>
      <div class="modal-card glass" id="nota-detalle-modal">
        <header class="modal-header">
          <div class="header-tags">
            @if (espacio) {
              <span class="space-badge" [style.border-color]="espacio.color">
                <span class="space-dot" [style.background-color]="espacio.color"></span>
                {{ espacio.nombre }}
              </span>
            } @else {
              <span class="unclassified-badge">Sin espacio (Búsqueda global)</span>
            }

            @if (nota?.categoria) {
              <span class="category-badge">🏷️ {{ nota?.categoria }}</span>
            }
          </div>
          <button type="button" class="close-btn" (click)="onClose()" aria-label="Cerrar modal">✕</button>
        </header>

        <div class="modal-body">
          <h2 class="nota-title" id="detalle-nota-titulo">{{ nota?.titulo }}</h2>

          <div class="nota-dates">
            <span>📅 Creada: {{ formatDate(nota?.fechaCreacion) }}</span>
            <span>🔄 Modificada: {{ formatDate(nota?.fechaActualizacion) }}</span>
          </div>

          <div class="nota-content" id="detalle-nota-contenido">
            @if (nota?.contenido && nota?.contenido?.length) {
              <p class="content-text">{{ nota?.contenido }}</p>
            } @else {
              <p class="empty-content"><em>Sin contenido adicional.</em></p>
            }
          </div>
        </div>

        <footer class="modal-footer">
          <div class="footer-left">
            <button
              type="button"
              class="btn btn-danger"
              (click)="onDelete()"
              id="btn-delete-from-detalle"
            >
              🗑️ Eliminar
            </button>
          </div>
          <div class="footer-right">
            <button
              type="button"
              class="btn btn-secondary"
              (click)="onClose()"
              id="btn-close-detalle"
            >
              Cerrar
            </button>
            <button
              type="button"
              class="btn btn-primary"
              (click)="onEdit()"
              id="btn-edit-from-detalle"
            >
              ✏️ Editar
            </button>
          </div>
        </footer>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center;
      padding: 16px; z-index: 400; animation: fadeIn 0.2s ease;
    }
    .modal-overlay-dismiss {
      position: absolute; inset: 0; background: transparent; border: none;
      width: 100%; height: 100%; cursor: pointer; z-index: 1;
    }
    .modal-card {
      position: relative; z-index: 2;
      width: 100%; max-width: 620px; background: var(--bg-surface);
      border-radius: var(--radius-lg); border: 1px solid var(--border-color);
      box-shadow: var(--shadow-md); display: flex; flex-direction: column;
      overflow: hidden; max-height: 90vh; animation: scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .modal-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 18px 24px; border-bottom: 1px solid var(--border-color);
    }
    .header-tags { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .space-badge {
      display: inline-flex; align-items: center; gap: 6px; font-size: 0.75rem;
      font-weight: 600; padding: 3px 10px; border-radius: var(--radius-full);
      background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-color);
    }
    .space-dot { width: 8px; height: 8px; border-radius: 50%; }
    .unclassified-badge {
      font-size: 0.75rem; font-weight: 600; padding: 3px 10px; border-radius: var(--radius-full);
      background: rgba(148, 163, 184, 0.15); color: #94a3b8;
    }
    .category-badge {
      font-size: 0.75rem; font-weight: 600; padding: 3px 10px; border-radius: var(--radius-full);
      background: rgba(245, 158, 11, 0.15); color: #fbbf24;
    }
    .close-btn { font-size: 1.1rem; color: var(--text-muted); padding: 4px 8px; border-radius: var(--radius-sm); }
    .close-btn:hover { color: var(--text-primary); }
    .modal-body {
      padding: 24px; display: flex; flex-direction: column; gap: 16px;
      overflow-y: auto; flex: 1;
    }
    .nota-title {
      font-size: 1.5rem; font-weight: 700; color: var(--text-primary); line-height: 1.3;
    }
    .nota-dates {
      display: flex; gap: 16px; font-size: 0.8rem; color: var(--text-muted);
      border-bottom: 1px solid var(--border-color); padding-bottom: 12px;
    }
    .nota-content {
      padding-top: 4px; line-height: 1.65; color: #cbd5e1; font-size: 1rem;
    }
    .content-text { white-space: pre-wrap; word-break: break-word; }
    .empty-content { color: var(--text-muted); }
    .modal-footer {
      display: flex; justify-content: space-between; align-items: center;
      padding: 16px 24px; border-top: 1px solid var(--border-color);
      background: rgba(0, 0, 0, 0.15);
    }
    .footer-right { display: flex; gap: 12px; }
    .btn {
      padding: 9px 18px; border-radius: var(--radius-md); font-size: 0.9rem;
      font-weight: 600; transition: background var(--transition-fast);
    }
    .btn-secondary {
      background: rgba(255, 255, 255, 0.05); color: var(--text-secondary);
      border: 1px solid var(--border-color);
    }
    .btn-secondary:hover { background: rgba(255, 255, 255, 0.1); color: var(--text-primary); }
    .btn-primary { background: var(--primary); color: white; box-shadow: 0 2px 10px var(--primary-glow); }
    .btn-primary:hover { background: var(--primary-hover); }
    .btn-danger {
      background: rgba(244, 63, 94, 0.12); color: #fb7185; border: 1px solid rgba(244, 63, 94, 0.3);
    }
    .btn-danger:hover { background: rgba(244, 63, 94, 0.25); }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes scaleUp { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
  `]
})
export class NotaDetalleModalComponent {
  @Input() nota?: Nota | null = null;
  @Input() espacio?: Espacio | null = null;

  @Output() edit = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  onEdit(): void {
    this.edit.emit();
  }

  onDelete(): void {
    this.delete.emit();
  }

  onClose(): void {
    this.closed.emit();
  }

  formatDate(isoString?: string): string {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
