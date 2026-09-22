import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Evento, Espacio } from '../../models';
import { RecordatoriosSeccionComponent } from '../recordatorios/recordatorios-seccion.component';
import { IcsService } from '../../services/ics.service';

@Component({
  selector: 'app-evento-detalle-modal',
  standalone: true,
  imports: [CommonModule, RecordatoriosSeccionComponent],
  template: `
    @if (visible && evento) {
      <div class="modal-overlay" id="modal-detalle-evento-overlay">
        <button
          type="button"
          class="modal-backdrop-dismiss"
          (click)="onCerrar()"
          aria-label="Cerrar detalle"
        ></button>
        <div
          class="modal-container glass"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-detalle-evento-title"
        >
          <header class="modal-header">
            <div class="header-badges">
              <span class="badge badge-timing" [class]="getTimingClass(evento.fechaInicio, evento.fechaFin)">
                {{ getTimingLabel(evento.fechaInicio, evento.fechaFin) }}
              </span>
              @if (evento.categoria) {
                <span class="badge badge-cat">🏷️ {{ evento.categoria }}</span>
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
            <h2 id="modal-detalle-evento-title" class="evento-title">
              {{ evento.titulo }}
            </h2>

            <!-- Fila de Horario / Fechas -->
            <div class="meta-section">
              <div class="meta-item">
                <span class="meta-label">📅 Horario:</span>
                <span class="meta-value horario-highlight">
                  {{ formatRangoFechas(evento.fechaInicio, evento.fechaFin) }}
                </span>
              </div>

              <!-- Espacio Asignado -->
              <div class="meta-item">
                <span class="meta-label">Espacio:</span>
                @if (espacio) {
                  <span class="espacio-pill">
                    <span class="espacio-color" [style.background-color]="espacio.color"></span>
                    {{ espacio.nombre }}
                  </span>
                } @else {
                  <span class="espacio-pill sin-espacio">
                    🚫 Sin clasificar (Accesible en Búsqueda Global)
                  </span>
                }
              </div>
            </div>

            <!-- Descripción -->
            @if (evento.descripcion && evento.descripcion.trim().length > 0) {
              <div class="descripcion-box">
                <span class="section-label">Detalles / Notas:</span>
                <p class="descripcion-text">{{ evento.descripcion }}</p>
              </div>
            } @else {
              <p class="sin-descripcion">Sin notas ni descripción adicional.</p>
            }

            <!-- Sección de Recordatorios (T-07.5) -->
            <app-recordatorios-seccion
              [eventoId]="evento.id"
              [fechaReferencia]="evento.fechaInicio"
            ></app-recordatorios-seccion>

            <!-- Conforme a T-09.2, el botón de exportación .ics se añade en Sprint 9 -->
          </main>

          <footer class="modal-footer">
            <div class="footer-left">
              <button
                type="button"
                class="btn btn-danger-outline"
                id="btn-detalle-eliminar-evento"
                (click)="onEliminar()"
              >
                🗑️ Eliminar
              </button>
              <button
                type="button"
                class="btn btn-export-ics"
                id="btn-exportar-ics"
                [disabled]="!evento.fechaFin"
                (click)="onExportarIcs()"
                title="Exportar evento al calendario (.ics)"
              >
                📅 Exportar al calendario
              </button>
            </div>

            <div class="footer-right">
              <button
                type="button"
                class="btn btn-secondary"
                id="btn-detalle-cerrar-evento"
                (click)="onCerrar()"
              >
                Cerrar
              </button>
              <button
                type="button"
                class="btn btn-primary"
                id="btn-detalle-editar-evento"
                (click)="onEditar()"
              >
                ✏️ Editar Evento
              </button>
            </div>
          </footer>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-overlay {
      position: fixed; inset: 0; z-index: 1060;
      display: flex; align-items: center; justify-content: center;
      padding: 16px; background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(8px); animation: fadeIn 0.2s ease-out;
    }
    .modal-backdrop-dismiss {
      position: absolute; inset: 0; background: transparent;
      border: none; cursor: default; width: 100%; height: 100%;
    }
    .modal-container {
      position: relative; width: 100%; max-width: 580px;
      border-radius: var(--radius-lg, 16px);
      box-shadow: 0 24px 48px rgba(0, 0, 0, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.12);
      display: flex; flex-direction: column; overflow: hidden;
      animation: scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      z-index: 1;
    }
    .modal-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 18px 22px; border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .header-badges { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .badge {
      font-size: 0.75rem; font-weight: 600; padding: 4px 10px;
      border-radius: var(--radius-full, 9999px); text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .badge-timing.timing-proximo { background: rgba(6, 182, 212, 0.15); color: #22d3ee; border: 1px solid rgba(6, 182, 212, 0.3); }
    .badge-timing.timing-encurso { background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.35); }
    .badge-timing.timing-pasado { background: rgba(148, 163, 184, 0.15); color: #94a3b8; border: 1px solid rgba(148, 163, 184, 0.25); }
    .badge-cat { background: rgba(255, 255, 255, 0.08); color: var(--text-secondary); border: 1px solid rgba(255, 255, 255, 0.12); }
    .btn-close {
      background: transparent; border: none; font-size: 1.2rem;
      color: var(--text-secondary); cursor: pointer; padding: 4px 8px;
      border-radius: 6px; transition: all 0.2s;
    }
    .btn-close:hover { background: rgba(255, 255, 255, 0.1); color: var(--text-primary); }
    .modal-body { padding: 22px; display: flex; flex-direction: column; gap: 18px; }
    .evento-title {
      font-size: 1.45rem; font-weight: 700; color: var(--text-primary);
      margin: 0; line-height: 1.3;
    }
    .meta-section {
      display: flex; flex-direction: column; gap: 10px;
      background: rgba(255, 255, 255, 0.03); padding: 14px 16px;
      border-radius: var(--radius-md, 10px); border: 1px solid rgba(255, 255, 255, 0.06);
    }
    .meta-item { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .meta-label { font-size: 0.82rem; font-weight: 600; color: var(--text-secondary); }
    .meta-value { font-size: 0.92rem; color: var(--text-primary); font-weight: 500; }
    .horario-highlight { color: #38bdf8; font-weight: 600; }
    .espacio-pill {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 3px 10px; border-radius: var(--radius-full, 9999px);
      font-size: 0.8rem; font-weight: 600;
      background: rgba(255, 255, 255, 0.06); color: var(--text-primary);
    }
    .espacio-color { width: 8px; height: 8px; border-radius: 50%; }
    .espacio-pill.sin-espacio { color: var(--text-secondary); font-style: italic; }
    .descripcion-box {
      display: flex; flex-direction: column; gap: 6px;
      background: rgba(0, 0, 0, 0.2); padding: 14px;
      border-radius: var(--radius-md, 8px); border: 1px solid rgba(255, 255, 255, 0.06);
    }
    .section-label { font-size: 0.78rem; font-weight: 600; text-transform: uppercase; color: var(--text-secondary); }
    .descripcion-text {
      margin: 0; font-size: 0.92rem; line-height: 1.5;
      color: var(--text-primary); white-space: pre-wrap; word-break: break-word;
    }
    .sin-descripcion { color: var(--text-secondary); font-size: 0.88rem; font-style: italic; margin: 0; }
    .modal-footer {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 22px; border-top: 1px solid rgba(255, 255, 255, 0.08);
      gap: 12px; flex-wrap: wrap;
    }
    .footer-left { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .footer-right { display: flex; align-items: center; gap: 10px; }
    .btn-export-ics {
      display: inline-flex; align-items: center; gap: 6px;
      background: rgba(6, 182, 212, 0.15); color: #22d3ee;
      border: 1px solid rgba(6, 182, 212, 0.3); border-radius: 8px;
      padding: 8px 14px; font-size: 0.85rem; font-weight: 600;
      cursor: pointer; transition: all 0.2s;
    }
    .btn-export-ics:hover:not(:disabled) {
      background: rgba(6, 182, 212, 0.25); color: #67e8f9;
    }
    .btn-export-ics:disabled {
      opacity: 0.5; cursor: not-allowed;
    }
    .btn {
      padding: 9px 16px; border-radius: var(--radius-md, 8px); font-weight: 600;
      font-size: 0.88rem; cursor: pointer; transition: all 0.2s; border: none;
    }
    .btn-secondary { background: rgba(255, 255, 255, 0.08); color: var(--text-secondary); }
    .btn-secondary:hover { background: rgba(255, 255, 255, 0.15); color: var(--text-primary); }
    .btn-primary { background: #0891b2; color: #fff; }
    .btn-primary:hover { background: #06b6d4; box-shadow: 0 4px 12px rgba(6, 182, 212, 0.35); }
    .btn-danger-outline {
      background: transparent; color: #fb7185;
      border: 1px solid rgba(244, 63, 94, 0.3);
    }
    .btn-danger-outline:hover {
      background: rgba(244, 63, 94, 0.15); color: #fda4af;
      border-color: rgba(244, 63, 94, 0.6);
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  `]
})
export class EventoDetalleModalComponent {
  private readonly icsService = inject(IcsService);

  @Input() visible = false;
  @Input() evento: Evento | null = null;
  @Input() espacio: Espacio | null = null;

  @Output() cerrar = new EventEmitter<void>();
  @Output() editar = new EventEmitter<Evento>();
  @Output() eliminar = new EventEmitter<Evento>();

  getTimingLabel(inicioIso: string, finIso: string): string {
    const ahora = Date.now();
    const tInicio = new Date(inicioIso).getTime();
    const tFin = new Date(finIso).getTime();

    if (ahora < tInicio) {
      return '⏳ Próximo';
    } else if (ahora >= tInicio && ahora <= tFin) {
      return '🟢 En curso';
    } else {
      return '⚪ Pasado';
    }
  }

  getTimingClass(inicioIso: string, finIso: string): string {
    const ahora = Date.now();
    const tInicio = new Date(inicioIso).getTime();
    const tFin = new Date(finIso).getTime();

    if (ahora < tInicio) {
      return 'timing-proximo';
    } else if (ahora >= tInicio && ahora <= tFin) {
      return 'timing-encurso';
    } else {
      return 'timing-pasado';
    }
  }

  formatRangoFechas(inicioIso: string, finIso: string): string {
    try {
      const dInicio = new Date(inicioIso);
      const dFin = new Date(finIso);

      if (isNaN(dInicio.getTime()) || isNaN(dFin.getTime())) {
        return `${inicioIso} - ${finIso}`;
      }

      const opcionesFecha: Intl.DateTimeFormatOptions = {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      };

      const opcionesHora: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit'
      };

      const fechaInicioStr = dInicio.toLocaleDateString('es-ES', opcionesFecha);
      const horaInicioStr = dInicio.toLocaleTimeString('es-ES', opcionesHora);
      const fechaFinStr = dFin.toLocaleDateString('es-ES', opcionesFecha);
      const horaFinStr = dFin.toLocaleTimeString('es-ES', opcionesHora);

      if (fechaInicioStr === fechaFinStr) {
        return `${fechaInicioStr}, ${horaInicioStr} - ${horaFinStr}`;
      }

      return `${fechaInicioStr} ${horaInicioStr} → ${fechaFinStr} ${horaFinStr}`;
    } catch {
      return `${inicioIso} - ${finIso}`;
    }
  }

  onEditar(): void {
    if (this.evento) {
      this.editar.emit(this.evento);
    }
  }

  onEliminar(): void {
    if (this.evento) {
      this.eliminar.emit(this.evento);
    }
  }

  onExportarIcs(): void {
    if (this.evento && this.evento.fechaFin) {
      this.icsService.descargarIcs(this.evento);
    }
  }

  onCerrar(): void {
    this.cerrar.emit();
  }
}
