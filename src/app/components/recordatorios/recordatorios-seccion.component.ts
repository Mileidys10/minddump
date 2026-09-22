import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RecordatorioService } from '../../services/recordatorio.service';
import { NotificacionService } from '../../services/notificacion.service';
import { Recordatorio } from '../../models';

@Component({
  selector: 'app-recordatorios-seccion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="recordatorios-seccion" id="seccion-recordatorios">
      <header class="seccion-header">
        <div class="header-left">
          <span class="header-icon">🔔</span>
          <h3 class="seccion-title">Recordatorios</h3>
          <span class="count-badge">{{ recordatorios().length }}</span>
        </div>

        @if (!isFormOpen && !isEditing) {
          <button
            type="button"
            class="btn-add-reminder"
            id="btn-abrir-crear-recordatorio"
            (click)="abrirFormularioNuevo()"
          >
            + Agregar recordatorio
          </button>
        }
      </header>

      <!-- Aviso de regla R-08 sobre notificaciones locales -->
      <div class="r08-notice">
        <span class="notice-icon">ℹ️</span>
        <span class="notice-text">
          Las notificaciones se emiten mientras la app esté abierta o en segundo plano activo (Regla R-08).
        </span>
      </div>

      <!-- Alerta si las notificaciones están denegadas en el navegador -->
      @if (notifService.permiso() === 'denied') {
        <div class="permiso-denegado-warning">
          ⚠️ Las notificaciones están desactivadas en tu navegador. Los recordatorios se guardarán localmente pero no emitirán avisos nativos.
        </div>
      }

      <!-- Formulario para Agregar o Editar Recordatorio -->
      @if (isFormOpen || isEditing) {
        <div class="form-recordatorio glass" id="form-recordatorio-box">
          <div class="form-title">
            {{ isEditing ? '✏️ Editar Recordatorio' : '➕ Nuevo Recordatorio' }}
          </div>

          <!-- Sugerencias de fecha rápida si hay fecha de referencia -->
          @if (fechaReferencia && !isEditing) {
            <div class="presets-row">
              <span class="presets-label">Sugerencias:</span>
              <button
                type="button"
                class="btn-preset"
                (click)="aplicarPreset('exacto')"
              >
                A la hora del elemento
              </button>
              <button
                type="button"
                class="btn-preset"
                (click)="aplicarPreset('15m')"
              >
                15 min antes
              </button>
              <button
                type="button"
                class="btn-preset"
                (click)="aplicarPreset('1h')"
              >
                1 hora antes
              </button>
              <button
                type="button"
                class="btn-preset"
                (click)="aplicarPreset('1d')"
              >
                1 día antes
              </button>
            </div>
          }

          <div class="form-row">
            <div class="form-field">
              <label for="input-rec-fecha">Fecha y Hora:</label>
              <input
                type="datetime-local"
                id="input-rec-fecha"
                class="input-datetime"
                [(ngModel)]="fechaHoraInput"
                name="fechaHoraInput"
              />
            </div>

            <div class="form-field">
              <label for="input-rec-titulo">Nota opcional:</label>
              <input
                type="text"
                id="input-rec-titulo"
                class="input-text"
                placeholder="Ej. Salir 10 min antes, revisar docs..."
                [(ngModel)]="tituloInput"
                name="tituloInput"
              />
            </div>
          </div>

          @if (errorFormulario) {
            <div class="error-msg">{{ errorFormulario }}</div>
          }

          <div class="form-actions">
            <button
              type="button"
              class="btn-cancel"
              (click)="cancelarFormulario()"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="btn-save"
              id="btn-guardar-recordatorio"
              (click)="guardarRecordatorio()"
            >
              {{ isEditing ? 'Actualizar' : 'Guardar recordatorio' }}
            </button>
          </div>
        </div>
      }

      <!-- Lista de Recordatorios -->
      @if (recordatorios().length > 0) {
        <div class="recordatorios-list">
          @for (rec of recordatorios(); track rec.id) {
            <div class="recordatorio-card glass" [class.notificado]="rec.notificado">
              <div class="card-main">
                <div class="time-and-badge">
                  <span class="rec-time">⏰ {{ formatFecha(rec.fechaHora) }}</span>
                  <span class="status-badge" [class]="getEstadoClass(rec)">
                    {{ getEstadoLabel(rec) }}
                  </span>
                </div>

                @if (rec.titulo) {
                  <div class="rec-note">📝 {{ rec.titulo }}</div>
                }
              </div>

              <!-- Acciones de Recordatorio -->
              <div class="card-actions">
                @if (confirmandoEliminarId === rec.id) {
                  <div class="confirm-box">
                    <span>¿Eliminar?</span>
                    <button
                      type="button"
                      class="btn-confirm-yes"
                      (click)="confirmarEliminar(rec.id!)"
                    >
                      Sí
                    </button>
                    <button
                      type="button"
                      class="btn-confirm-no"
                      (click)="cancelarEliminar()"
                    >
                      No
                    </button>
                  </div>
                } @else {
                  <button
                    type="button"
                    class="btn-action btn-edit"
                    [attr.aria-label]="'Editar recordatorio ' + rec.id"
                    (click)="iniciarEdicion(rec)"
                    title="Editar fecha/hora"
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    class="btn-action btn-delete"
                    [attr.aria-label]="'Eliminar recordatorio ' + rec.id"
                    (click)="pedirConfirmacionEliminar(rec.id!)"
                    title="Eliminar recordatorio"
                  >
                    🗑️
                  </button>
                }
              </div>
            </div>
          }
        </div>
      } @else if (!isFormOpen && !isEditing) {
        <!-- Estado Vacío -->
        <div class="empty-recordatorios glass">
          <div class="empty-icon">🔕</div>
          <div class="empty-text">
            <strong>Sin recordatorios programados</strong>
            <p>Agrega un recordatorio para recibir una alerta oportuna antes del vencimiento.</p>
          </div>
          <button
            type="button"
            class="btn-empty-add"
            (click)="abrirFormularioNuevo()"
          >
            + Programar recordatorio
          </button>
        </div>
      }
    </section>
  `,
  styles: [`
    .recordatorios-seccion {
      display: flex; flex-direction: column; gap: 12px;
      margin-top: 14px; padding-top: 16px; border-top: 1px solid var(--border-color);
    }
    .seccion-header {
      display: flex; justify-content: space-between; align-items: center; gap: 12px;
    }
    .header-left { display: flex; align-items: center; gap: 8px; }
    .header-icon { font-size: 1.25rem; }
    .seccion-title {
      font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin: 0;
    }
    .count-badge {
      font-size: 0.75rem; font-weight: 700; padding: 2px 7px; border-radius: 999px;
      background: rgba(99, 102, 241, 0.2); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.3);
    }
    .btn-add-reminder {
      padding: 6px 12px; border-radius: 6px; font-size: 0.82rem; font-weight: 600;
      background: rgba(99, 102, 241, 0.15); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.3);
      cursor: pointer; transition: all 0.2s;
    }
    .btn-add-reminder:hover { background: rgba(99, 102, 241, 0.25); color: #a5b4fc; }
    .r08-notice {
      display: flex; align-items: center; gap: 8px; font-size: 0.78rem; color: #94a3b8;
      background: rgba(15, 23, 42, 0.3); padding: 6px 10px; border-radius: 6px;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }
    .notice-icon { font-size: 0.9rem; }
    .permiso-denegado-warning {
      font-size: 0.8rem; color: #fca5a5; background: rgba(239, 68, 68, 0.1);
      padding: 8px 12px; border-radius: 6px; border: 1px solid rgba(239, 68, 68, 0.25);
    }
    .form-recordatorio {
      display: flex; flex-direction: column; gap: 12px; padding: 14px;
      border-radius: 10px; border: 1px solid rgba(99, 102, 241, 0.3);
      background: rgba(15, 23, 42, 0.6); animation: fadeIn 0.2s ease;
    }
    .form-title { font-size: 0.9rem; font-weight: 600; color: var(--text-primary); }
    .presets-row { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
    .presets-label { font-size: 0.75rem; color: var(--text-muted); }
    .btn-preset {
      font-size: 0.75rem; padding: 3px 8px; border-radius: 4px; border: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(255, 255, 255, 0.05); color: var(--text-secondary); cursor: pointer;
    }
    .btn-preset:hover { background: rgba(99, 102, 241, 0.2); color: #818cf8; border-color: rgba(99, 102, 241, 0.4); }
    .form-row { display: flex; flex-wrap: wrap; gap: 10px; }
    .form-field { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 180px; }
    .form-field label { font-size: 0.78rem; font-weight: 600; color: var(--text-secondary); }
    .input-datetime, .input-text {
      padding: 8px 10px; border-radius: 6px; font-size: 0.85rem; color: var(--text-primary);
      background: rgba(0, 0, 0, 0.3); border: 1px solid var(--border-color); outline: none;
    }
    .input-datetime:focus, .input-text:focus { border-color: var(--primary, #6366f1); }
    .error-msg { font-size: 0.8rem; color: #fb7185; }
    .form-actions { display: flex; justify-content: flex-end; gap: 8px; }
    .btn-cancel {
      padding: 6px 12px; border-radius: 6px; font-size: 0.82rem; font-weight: 600;
      background: transparent; color: var(--text-secondary); border: 1px solid rgba(255, 255, 255, 0.1);
      cursor: pointer;
    }
    .btn-save {
      padding: 6px 14px; border-radius: 6px; font-size: 0.82rem; font-weight: 600;
      background: var(--primary, #6366f1); color: #fff; border: none; cursor: pointer;
    }
    .btn-save:hover { background: #4f46e5; }
    .recordatorios-list { display: flex; flex-direction: column; gap: 8px; }
    .recordatorio-card {
      display: flex; justify-content: space-between; align-items: center; gap: 12px;
      padding: 10px 14px; border-radius: 8px; border: 1px solid var(--border-color);
      background: rgba(15, 23, 42, 0.4); transition: all 0.2s;
    }
    .recordatorio-card.notificado { opacity: 0.7; }
    .card-main { display: flex; flex-direction: column; gap: 4px; }
    .time-and-badge { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .rec-time { font-size: 0.88rem; font-weight: 600; color: var(--text-primary); }
    .status-badge {
      font-size: 0.72rem; font-weight: 600; padding: 2px 7px; border-radius: 999px;
    }
    .status-badge.pendiente { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }
    .status-badge.debido { background: rgba(234, 179, 8, 0.2); color: #facc15; }
    .status-badge.notificado { background: rgba(34, 197, 94, 0.2); color: #4ade80; }
    .rec-note { font-size: 0.8rem; color: var(--text-muted); }
    .card-actions { display: flex; align-items: center; gap: 6px; }
    .btn-action {
      background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px; font-size: 0.85rem; padding: 4px 8px; cursor: pointer;
      color: var(--text-secondary); transition: all 0.2s;
    }
    .btn-action:hover { background: rgba(255, 255, 255, 0.15); color: var(--text-primary); }
    .confirm-box {
      display: flex; align-items: center; gap: 6px; font-size: 0.78rem; color: #fb7185;
      background: rgba(244, 63, 94, 0.1); padding: 4px 8px; border-radius: 6px;
      border: 1px solid rgba(244, 63, 94, 0.25);
    }
    .btn-confirm-yes {
      background: #f43f5e; color: #fff; border: none; border-radius: 4px;
      padding: 2px 6px; font-size: 0.75rem; font-weight: 600; cursor: pointer;
    }
    .btn-confirm-no {
      background: transparent; color: var(--text-secondary); border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 4px; padding: 2px 6px; font-size: 0.75rem; cursor: pointer;
    }
    .empty-recordatorios {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      text-align: center; gap: 8px; padding: 18px 14px; border-radius: 10px;
      border: 1px dashed var(--border-color); background: rgba(15, 23, 42, 0.2);
    }
    .empty-icon { font-size: 1.8rem; }
    .empty-text strong { font-size: 0.9rem; color: var(--text-primary); display: block; }
    .empty-text p { font-size: 0.8rem; color: var(--text-muted); margin: 2px 0 0 0; }
    .btn-empty-add {
      margin-top: 6px; padding: 6px 14px; border-radius: 6px; font-size: 0.82rem; font-weight: 600;
      background: rgba(99, 102, 241, 0.15); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.3);
      cursor: pointer; transition: all 0.2s;
    }
    .btn-empty-add:hover { background: rgba(99, 102, 241, 0.25); }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  `]
})
export class RecordatoriosSeccionComponent implements OnInit, OnChanges {
  @Input() tareaId?: number | null = null;
  @Input() eventoId?: number | null = null;
  @Input() fechaReferencia?: string | null = null;

  private readonly recordatorioService = inject(RecordatorioService);
  readonly notifService = inject(NotificacionService);

  readonly recordatorios = signal<Recordatorio[]>([]);

  isFormOpen = false;
  isEditing = false;
  editingId: number | null = null;

  fechaHoraInput = '';
  tituloInput = '';
  errorFormulario = '';

  confirmandoEliminarId: number | null = null;

  async ngOnInit(): Promise<void> {
    await this.cargarRecordatorios();
  }

  async ngOnChanges(changes: SimpleChanges): Promise<void> {
    if (changes['tareaId'] || changes['eventoId']) {
      await this.cargarRecordatorios();
    }
  }

  async cargarRecordatorios(): Promise<void> {
    if (this.tareaId) {
      const items = await this.recordatorioService.getByTarea(this.tareaId);
      this.recordatorios.set(items);
    } else if (this.eventoId) {
      const items = await this.recordatorioService.getByEvento(this.eventoId);
      this.recordatorios.set(items);
    } else {
      this.recordatorios.set([]);
    }
  }

  abrirFormularioNuevo(): void {
    this.isEditing = false;
    this.editingId = null;
    this.errorFormulario = '';
    this.tituloInput = '';

    // Si hay fechaReferencia válida, pre-rellenar con esa fecha
    if (this.fechaReferencia) {
      this.fechaHoraInput = this.isoToDatetimeLocal(this.fechaReferencia);
    } else {
      // Por defecto sugerir ahora + 1 hora
      const d = new Date(Date.now() + 60 * 60 * 1000);
      this.fechaHoraInput = this.isoToDatetimeLocal(d.toISOString());
    }

    this.isFormOpen = true;
  }

  iniciarEdicion(rec: Recordatorio): void {
    this.isFormOpen = false;
    this.isEditing = true;
    this.editingId = rec.id ?? null;
    this.errorFormulario = '';
    this.tituloInput = rec.titulo || '';
    this.fechaHoraInput = this.isoToDatetimeLocal(rec.fechaHora);
  }

  cancelarFormulario(): void {
    this.isFormOpen = false;
    this.isEditing = false;
    this.editingId = null;
    this.errorFormulario = '';
  }

  aplicarPreset(preset: 'exacto' | '15m' | '1h' | '1d'): void {
    if (!this.fechaReferencia) return;
    const baseTime = new Date(this.fechaReferencia).getTime();
    if (isNaN(baseTime)) return;

    let targetTime = baseTime;
    switch (preset) {
      case '15m':
        targetTime = baseTime - 15 * 60 * 1000;
        break;
      case '1h':
        targetTime = baseTime - 60 * 60 * 1000;
        break;
      case '1d':
        targetTime = baseTime - 24 * 60 * 60 * 1000;
        break;
      case 'exacto':
      default:
        targetTime = baseTime;
        break;
    }

    this.fechaHoraInput = this.isoToDatetimeLocal(new Date(targetTime).toISOString());
  }

  async guardarRecordatorio(): Promise<void> {
    if (!this.fechaHoraInput) {
      this.errorFormulario = 'Selecciona una fecha y hora válida.';
      return;
    }

    const isoDate = new Date(this.fechaHoraInput).toISOString();
    if (isNaN(new Date(isoDate).getTime())) {
      this.errorFormulario = 'Fecha y hora no reconocidas.';
      return;
    }

    // T-07.2: Solicitar permiso con explicación si está en 'default'
    if (this.notifService.permiso() === 'default') {
      await this.notifService.solicitarPermisoConExplicacion();
    }

    try {
      if (this.isEditing && this.editingId) {
        await this.recordatorioService.update(this.editingId, {
          fechaHora: isoDate,
          titulo: this.tituloInput.trim() || undefined
        });
      } else {
        await this.recordatorioService.create({
          fechaHora: isoDate,
          titulo: this.tituloInput.trim() || undefined,
          tareaId: this.tareaId ?? null,
          eventoId: this.eventoId ?? null,
          notificado: false
        });
      }

      this.cancelarFormulario();
      await this.cargarRecordatorios();
    } catch (err: unknown) {
      this.errorFormulario = err instanceof Error ? err.message : 'Error al guardar recordatorio';
    }
  }

  pedirConfirmacionEliminar(id: number): void {
    this.confirmandoEliminarId = id;
  }

  cancelarEliminar(): void {
    this.confirmandoEliminarId = null;
  }

  async confirmarEliminar(id: number): Promise<void> {
    await this.recordatorioService.delete(id);
    this.confirmandoEliminarId = null;
    await this.cargarRecordatorios();
  }

  formatFecha(fechaIso: string): string {
    try {
      const d = new Date(fechaIso);
      return isNaN(d.getTime()) ? fechaIso : d.toLocaleString();
    } catch {
      return fechaIso;
    }
  }

  getEstadoClass(rec: Recordatorio): string {
    if (rec.notificado) return 'notificado';
    const t = new Date(rec.fechaHora).getTime();
    return t <= Date.now() ? 'debido' : 'pendiente';
  }

  getEstadoLabel(rec: Recordatorio): string {
    if (rec.notificado) return '✔️ Notificado';
    const t = new Date(rec.fechaHora).getTime();
    return t <= Date.now() ? '⏰ Debido' : '⏳ Pendiente';
  }

  private isoToDatetimeLocal(iso: string): string {
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return '';
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return '';
    }
  }
}
