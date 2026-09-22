import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Tarea, Espacio, EstadoTarea } from '../../models';
import { RecordatoriosSeccionComponent } from '../recordatorios/recordatorios-seccion.component';

@Component({
  selector: 'app-tarea-detalle-modal',
  standalone: true,
  imports: [CommonModule, RecordatoriosSeccionComponent],
  template: `
    @if (visible && tarea) {
      <div class="modal-overlay" id="modal-detalle-tarea-overlay">
        <button
          type="button"
          class="modal-backdrop-dismiss"
          (click)="onCerrar()"
          aria-label="Cerrar detalle"
        ></button>
        <div class="modal-container glass" role="dialog" aria-modal="true" aria-labelledby="modal-detalle-title">
          <header class="modal-header">
            <div class="header-badges">
              <span class="badge badge-prioridad" [class]="'prio-' + tarea.prioridad.toLowerCase()">
                {{ getPrioridadIcon(tarea.prioridad) }} {{ tarea.prioridad }}
              </span>
              <span class="badge badge-estado" [class]="'estado-' + sanitizeClassName(tarea.estado)">
                {{ getEstadoIcon(tarea.estado) }} {{ tarea.estado }}
              </span>
              @if (tarea.categoria) {
                <span class="badge badge-cat">🏷️ {{ tarea.categoria }}</span>
              }
            </div>
            <button
              type="button"
              class="btn-close"
              (click)="onCerrar()"
              aria-label="Cerrar"
            >
              ✕
            </button>
          </header>

          <main class="modal-body">
            <h2 id="modal-detalle-title" class="tarea-title" [class.completed]="tarea.estado === 'Completada'">
              {{ tarea.titulo }}
            </h2>

            <!-- Espacio y Fecha Límite -->
            <div class="meta-row">
              <div class="meta-item">
                <span class="meta-label">Espacio:</span>
                @if (espacio) {
                  <span class="espacio-pill">
                    <span class="espacio-color" [style.background-color]="espacio.color"></span>
                    {{ espacio.nombre }}
                  </span>
                } @else {
                  <span class="espacio-pill sin-espacio">
                    🚫 Sin clasificar (Huérfana)
                  </span>
                }
              </div>

              <div class="meta-item">
                <span class="meta-label">Fecha Límite:</span>
                @if (getFechaLimite(tarea)) {
                  <span class="fecha-limite-val" [class.vencida]="isVencida(tarea)">
                    ⏰ {{ formatFecha(getFechaLimite(tarea)) }}
                    @if (isVencida(tarea)) {
                      <strong class="vencida-tag">(Vencida)</strong>
                    }
                  </span>
                } @else {
                  <span class="sin-fecha">Sin fecha límite</span>
                }
              </div>
            </div>

            <!-- Descripción -->
            <div class="descripcion-section">
              <h3 class="section-subtitle">Descripción</h3>
              <div class="descripcion-content">
                {{ tarea.descripcion || 'Sin descripción adicional para esta tarea.' }}
              </div>
            </div>

            <!-- Sección de Recordatorios (T-07.4) -->
            <app-recordatorios-seccion
              [tareaId]="tarea.id"
              [fechaReferencia]="getFechaLimite(tarea)"
            ></app-recordatorios-seccion>

            <!-- Timestamps -->
            <div class="timestamps-footer">
              <span>📅 Creada: {{ formatFecha(tarea.fechaCreacion) }}</span>
              <span>🔄 Actualizada: {{ formatFecha(tarea.fechaActualizacion) }}</span>
            </div>
          </main>

          <footer class="modal-footer">
            <div class="quick-state-actions">
              @if (tarea.estado !== 'Completada') {
                <button
                  type="button"
                  class="btn-state btn-state-complete"
                  (click)="onCambiarEstado('Completada')"
                >
                  ✔️ Marcar Completada
                </button>
              } @else {
                <button
                  type="button"
                  class="btn-state btn-state-reopen"
                  (click)="onCambiarEstado('Pendiente')"
                >
                  ↩️ Reabrir Tarea
                </button>
              }
            </div>

            <div class="main-actions">
              <button
                type="button"
                class="btn btn-secondary"
                id="btn-eliminar-tarea-modal"
                (click)="onEliminar()"
              >
                🗑️ Eliminar
              </button>
              <button
                type="button"
                class="btn btn-primary"
                id="btn-editar-tarea-modal"
                (click)="onEditar()"
              >
                ✏️ Editar Tarea
              </button>
            </div>
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
      z-index: 1000; padding: 16px; animation: fadeIn 0.2s ease;
    }
    .modal-backdrop-dismiss {
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      background: transparent; border: none; cursor: default;
    }
    .modal-container {
      position: relative; width: 100%; max-width: 600px; max-height: 90vh;
      overflow-y: auto; border-radius: var(--radius-lg, 16px);
      padding: 24px; display: flex; flex-direction: column; gap: 20px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4); border: 1px solid var(--border-color);
      z-index: 1001; animation: scaleUp 0.2s ease;
    }
    .modal-header {
      display: flex; align-items: center; justify-content: space-between;
      border-bottom: 1px solid var(--border-color); padding-bottom: 12px;
    }
    .header-badges { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
    .badge {
      font-size: 0.75rem; font-weight: 600; padding: 3px 8px; border-radius: 999px;
      display: inline-flex; align-items: center; gap: 4px;
    }
    .badge-prioridad.prio-urgente { background: rgba(244, 63, 94, 0.2); color: #fb7185; }
    .badge-prioridad.prio-normal { background: rgba(234, 179, 8, 0.2); color: #facc15; }
    .badge-prioridad.prio-baja { background: rgba(16, 185, 129, 0.2); color: #34d399; }
    .badge-estado.estado-pendiente { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }
    .badge-estado.estado-en-progreso { background: rgba(168, 85, 247, 0.2); color: #c084fc; }
    .badge-estado.estado-completada { background: rgba(34, 197, 94, 0.2); color: #4ade80; }
    .badge-estado.estado-cancelada { background: rgba(148, 163, 184, 0.2); color: #94a3b8; }
    .badge-cat { background: rgba(255, 255, 255, 0.08); color: var(--text-secondary); }
    .btn-close {
      background: transparent; border: none; font-size: 1.25rem; color: var(--text-secondary);
      cursor: pointer; padding: 4px 8px; border-radius: 8px; transition: all 0.2s;
    }
    .btn-close:hover { background: rgba(255, 255, 255, 0.1); color: var(--text-primary); }
    .modal-body { display: flex; flex-direction: column; gap: 16px; }
    .tarea-title {
      font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin: 0; line-height: 1.3;
    }
    .tarea-title.completed { text-decoration: line-through; opacity: 0.7; }
    .meta-row {
      display: flex; flex-wrap: wrap; gap: 20px; align-items: center;
      background: rgba(15, 23, 42, 0.4); padding: 12px 16px; border-radius: 10px;
      border: 1px solid var(--border-color);
    }
    .meta-item { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; }
    .meta-label { color: var(--text-muted, #94a3b8); font-weight: 600; }
    .espacio-pill {
      display: inline-flex; align-items: center; gap: 6px; font-weight: 500;
      color: var(--text-primary);
    }
    .espacio-color { width: 10px; height: 10px; border-radius: 50%; }
    .sin-espacio { color: var(--text-muted); font-style: italic; }
    .fecha-limite-val { color: var(--text-primary); font-weight: 500; }
    .fecha-limite-val.vencida { color: #f43f5e; font-weight: 600; }
    .vencida-tag { margin-left: 4px; }
    .sin-fecha { color: var(--text-muted); font-style: italic; }
    .descripcion-section { display: flex; flex-direction: column; gap: 8px; }
    .section-subtitle { font-size: 0.9rem; font-weight: 600; color: var(--text-secondary); margin: 0; text-transform: uppercase; letter-spacing: 0.05em; }
    .descripcion-content {
      font-size: 0.95rem; line-height: 1.6; color: var(--text-primary);
      white-space: pre-wrap; word-break: break-word; background: rgba(0, 0, 0, 0.2);
      padding: 14px; border-radius: 10px; border: 1px solid rgba(255, 255, 255, 0.05);
      min-height: 60px;
    }
    .timestamps-footer {
      display: flex; flex-wrap: wrap; gap: 16px; font-size: 0.75rem;
      color: var(--text-muted, #94a3b8); border-top: 1px solid var(--border-color);
      padding-top: 12px; margin-top: 4px;
    }
    .modal-footer {
      display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;
      border-top: 1px solid var(--border-color); padding-top: 16px;
    }
    .quick-state-actions { display: flex; gap: 8px; }
    .btn-state {
      padding: 8px 12px; border-radius: 8px; font-size: 0.85rem; font-weight: 600;
      border: 1px solid transparent; cursor: pointer; transition: all 0.2s;
    }
    .btn-state-complete {
      background: rgba(34, 197, 94, 0.15); color: #4ade80; border-color: rgba(34, 197, 94, 0.3);
    }
    .btn-state-complete:hover { background: rgba(34, 197, 94, 0.25); }
    .btn-state-reopen {
      background: rgba(59, 130, 246, 0.15); color: #60a5fa; border-color: rgba(59, 130, 246, 0.3);
    }
    .btn-state-reopen:hover { background: rgba(59, 130, 246, 0.25); }
    .main-actions { display: flex; gap: 10px; }
    .btn {
      padding: 9px 16px; border-radius: var(--radius-md, 8px); font-weight: 600;
      font-size: 0.9rem; cursor: pointer; transition: all 0.2s; border: none;
    }
    .btn-secondary {
      background: rgba(255, 255, 255, 0.08); color: var(--text-secondary);
    }
    .btn-secondary:hover { background: rgba(244, 63, 94, 0.2); color: #fb7185; }
    .btn-primary { background: var(--primary, #6366f1); color: #fff; }
    .btn-primary:hover { background: #4f46e5; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35); }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  `]
})
export class TareaDetalleModalComponent {
  @Input() visible = false;
  @Input() tarea: Tarea | null = null;
  @Input() espacio: Espacio | null = null;

  @Output() cerrar = new EventEmitter<void>();
  @Output() editar = new EventEmitter<Tarea>();
  @Output() eliminar = new EventEmitter<Tarea>();
  @Output() cambiarEstado = new EventEmitter<{ id: number; nuevoEstado: EstadoTarea }>();

  getPrioridadIcon(prio: string): string {
    switch (prio) {
      case 'Urgente': return '🔴';
      case 'Normal': return '🟡';
      case 'Baja': return '🟢';
      default: return '⚪';
    }
  }

  getEstadoIcon(estado: string): string {
    switch (estado) {
      case 'Pendiente': return '⏳';
      case 'En progreso': return '⚡';
      case 'Completada': return '✅';
      case 'Cancelada': return '❌';
      default: return '📋';
    }
  }

  sanitizeClassName(text: string): string {
    return text.toLowerCase().replace(/\s+/g, '-');
  }

  getFechaLimite(t: Tarea): string | null {
    return t.fechaLimite ?? t.fechaLímite ?? null;
  }

  isVencida(t: Tarea): boolean {
    const fl = this.getFechaLimite(t);
    if (!fl || t.estado === 'Completada' || t.estado === 'Cancelada') {
      return false;
    }
    return new Date(fl).getTime() < Date.now();
  }

  formatFecha(fechaIso?: string | null): string {
    if (!fechaIso) return '';
    try {
      const d = new Date(fechaIso);
      return isNaN(d.getTime()) ? '' : d.toLocaleString();
    } catch {
      return '';
    }
  }

  onCerrar(): void {
    this.cerrar.emit();
  }

  onEditar(): void {
    if (this.tarea) {
      this.editar.emit(this.tarea);
    }
  }

  onEliminar(): void {
    if (this.tarea) {
      this.eliminar.emit(this.tarea);
    }
  }

  onCambiarEstado(nuevoEstado: EstadoTarea): void {
    if (this.tarea && this.tarea.id) {
      this.cambiarEstado.emit({ id: this.tarea.id, nuevoEstado });
    }
  }
}
