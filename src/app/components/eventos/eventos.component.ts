import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventoService, FiltroEspacioTipo } from '../../services/evento.service';
import { EspacioService } from '../../services/espacio.service';
import { Evento, Espacio } from '../../models';
import { EventoCreateDto } from '../../repositories/evento.repository';
import { EventoModalComponent } from './evento-modal.component';
import { EventoDeleteModalComponent } from './evento-delete-modal.component';
import { EventoDetalleModalComponent } from './evento-detalle-modal.component';

@Component({
  selector: 'app-eventos',
  standalone: true,
  imports: [
    CommonModule,
    EventoModalComponent,
    EventoDeleteModalComponent,
    EventoDetalleModalComponent
  ],
  template: `
    <div class="view-container" id="view-eventos">
      <!-- Encabezado de la Pantalla P-07 -->
      <header class="view-header">
        <div class="header-left">
          <span class="badge-tag">Agenda & Cronología</span>
          <h1 class="view-title">Eventos 📅</h1>
          <p class="view-subtitle">Gestiona tus citas, compromisos temporales y reuniones.</p>
        </div>

        <div class="header-actions">
          <button
            type="button"
            class="btn btn-primary"
            id="btn-nuevo-evento"
            (click)="abrirModalCrear()"
          >
            <span class="btn-icon">+</span> Nuevo Evento
          </button>
        </div>
      </header>

      <!-- Barra de Filtros: Espacios y Categorías (T-06.2) -->
      <section class="filters-bar glass" id="eventos-filters">
        <!-- Filtro por Espacio -->
        <div class="filter-group">
          <span class="filter-label">Espacio:</span>
          <div class="chips-container" id="filter-espacios">
            <button
              type="button"
              class="chip-btn"
              [class.active]="filtroEspacio() === 'all'"
              (click)="onFiltrarEspacio('all')"
              id="chip-espacio-todos"
            >
              🌐 Todos
            </button>
            <button
              type="button"
              class="chip-btn"
              [class.active]="filtroEspacio() === null"
              (click)="onFiltrarEspacio(null)"
              id="chip-espacio-sin-asignar"
            >
              🚫 Sin clasificar
            </button>
            @for (esp of espacios(); track esp.id) {
              <button
                type="button"
                class="chip-btn"
                [class.active]="filtroEspacio() === esp.id"
                (click)="onFiltrarEspacio(esp.id ?? null)"
                [id]="'chip-espacio-' + esp.id"
              >
                <span class="chip-color" [style.background-color]="esp.color"></span>
                {{ esp.nombre }}
              </button>
            }
          </div>
        </div>

        <!-- Filtro por Categoría -->
        @if (categorias().length > 0) {
          <div class="filter-group">
            <span class="filter-label">Categoría:</span>
            <div class="chips-container" id="filter-categorias">
              <button
                type="button"
                class="chip-btn"
                [class.active]="filtroCategoria() === null"
                (click)="onFiltrarCategoria(null)"
                id="chip-cat-todas"
              >
                Todas
              </button>
              @for (cat of categorias(); track cat) {
                <button
                  type="button"
                  class="chip-btn"
                  [class.active]="filtroCategoria()?.toLowerCase() === cat.toLowerCase()"
                  (click)="onFiltrarCategoria(cat)"
                  [id]="'chip-cat-' + cat"
                >
                  🏷️ {{ cat }}
                </button>
              }
            </div>
          </div>
        }
      </section>

      <!-- Listado de Eventos (P-07) -->
      <main class="eventos-content">
        @if (eventos().length > 0) {
          <div class="eventos-grid" id="eventos-list">
            @for (evento of eventos(); track evento.id) {
              <article
                class="evento-card glass"
                [id]="'evento-card-' + evento.id"
                (click)="abrirModalDetalle(evento)"
                tabindex="0"
                (keydown.enter)="abrirModalDetalle(evento)"
              >
                <!-- Columna de Calendario Visual -->
                <div class="calendar-pill">
                  <span class="cal-month">{{ getMesAbrev(evento.fechaInicio) }}</span>
                  <span class="cal-day">{{ getDia(evento.fechaInicio) }}</span>
                  <span class="cal-time">{{ getHora(evento.fechaInicio) }}</span>
                </div>

                <!-- Contenido Principal del Evento -->
                <div class="evento-info">
                  <div class="evento-meta-top">
                    <span
                      class="badge-timing-small"
                      [class]="getTimingClass(evento.fechaInicio, evento.fechaFin)"
                    >
                      {{ getTimingLabel(evento.fechaInicio, evento.fechaFin) }}
                    </span>

                    @if (evento.categoria) {
                      <span class="badge-cat-small">🏷️ {{ evento.categoria }}</span>
                    }

                    @if (getEspacio(evento.espacioId); as esp) {
                      <span class="espacio-pill-small">
                        <span class="espacio-dot" [style.background-color]="esp.color"></span>
                        {{ esp.nombre }}
                      </span>
                    } @else {
                      <span class="espacio-pill-small sin-espacio">
                        🚫 Sin clasificar
                      </span>
                    }
                  </div>

                  <h3 class="evento-card-title">{{ evento.titulo }}</h3>

                  @if (evento.descripcion) {
                    <p class="evento-card-desc">{{ evento.descripcion }}</p>
                  }

                  <div class="evento-horario-row">
                    <span class="horario-icon">🕒</span>
                    <span class="horario-text">
                      {{ formatHorario(evento.fechaInicio, evento.fechaFin) }}
                    </span>
                  </div>
                </div>

                <!-- Acciones de Tarjeta -->
                <div class="evento-card-actions">
                  <button
                    type="button"
                    class="action-btn"
                    title="Editar evento"
                    (click)="$event.stopPropagation(); abrirModalEditar(evento)"
                    [id]="'btn-editar-evento-' + evento.id"
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    class="action-btn btn-action-delete"
                    title="Eliminar evento"
                    (click)="$event.stopPropagation(); abrirModalEliminar(evento)"
                    [id]="'btn-eliminar-evento-' + evento.id"
                  >
                    🗑️
                  </button>
                </div>
              </article>
            }
          </div>
        } @else {
          <!-- Estado Vacío Informativo (T-06.2) -->
          <div class="empty-state glass" id="eventos-empty-state">
            <div class="empty-icon">📆</div>
            <h3>Sin eventos programados</h3>
            <p>
              @if (filtroEspacio() !== 'all' || filtroCategoria() !== null) {
                No se encontraron eventos con los filtros seleccionados. Prueba a cambiar de espacio o categoría.
              } @else {
                Tu agenda está libre. Registra tus compromisos, reuniones o fechas clave con el botón <strong>Nuevo Evento</strong>.
              }
            </p>
            <button
              type="button"
              class="btn btn-primary"
              (click)="abrirModalCrear()"
            >
              + Añadir mi primer evento
            </button>
          </div>
        }
      </main>

      <!-- Modales de Operación (T-06.3, T-06.4, T-06.5) -->
      <app-evento-modal
        [visible]="isModalFormOpen"
        [evento]="eventoSeleccionado"
        [espacios]="espacios()"
        [defaultEspacioId]="defaultEspacioId"
        (guardar)="onGuardarEvento($event)"
        (cancelar)="cerrarModalForm()"
      ></app-evento-modal>

      <app-evento-delete-modal
        [visible]="isModalDeleteOpen"
        [evento]="eventoAEliminar"
        (confirmar)="onConfirmarEliminar($event)"
        (cancelar)="cerrarModalDelete()"
      ></app-evento-delete-modal>

      <app-evento-detalle-modal
        [visible]="isModalDetalleOpen"
        [evento]="eventoDetalle"
        [espacio]="getEspacio(eventoDetalle?.espacioId ?? null)"
        (editar)="onEditarDesdeDetalle($event)"
        (eliminar)="onEliminarDesdeDetalle($event)"
        (cerrar)="cerrarModalDetalle()"
      ></app-evento-detalle-modal>
    </div>
  `,
  styles: [`
    .view-container { display: flex; flex-direction: column; gap: 22px; animation: fadeIn 0.3s ease; }
    .view-header {
      display: flex; align-items: center; justify-content: space-between;
      gap: 16px; flex-wrap: wrap;
    }
    .badge-tag {
      display: inline-block; font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.05em; padding: 4px 10px; border-radius: var(--radius-full, 9999px);
      background: rgba(6, 182, 212, 0.15); color: #22d3ee; margin-bottom: 6px;
    }
    .view-title { font-size: 2rem; font-weight: 700; color: var(--text-primary); margin: 0; }
    .view-subtitle { color: var(--text-secondary); margin-top: 4px; font-size: 0.95rem; }
    .btn {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 10px 18px; border-radius: var(--radius-md, 8px); font-weight: 600;
      font-size: 0.92rem; cursor: pointer; transition: all 0.2s; border: none;
    }
    .btn-primary { background: #0891b2; color: #fff; }
    .btn-primary:hover { background: #06b6d4; box-shadow: 0 4px 12px rgba(6, 182, 212, 0.35); }
    .filters-bar {
      padding: 14px 18px; border-radius: var(--radius-lg, 12px);
      display: flex; flex-direction: column; gap: 12px;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    .filter-group { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .filter-label { font-size: 0.82rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; }
    .chips-container { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .chip-btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 6px 12px; border-radius: var(--radius-full, 9999px);
      background: rgba(255, 255, 255, 0.05); color: var(--text-secondary);
      border: 1px solid rgba(255, 255, 255, 0.08); font-size: 0.82rem;
      font-weight: 500; cursor: pointer; transition: all 0.2s;
    }
    .chip-btn:hover { background: rgba(255, 255, 255, 0.12); color: var(--text-primary); }
    .chip-btn.active {
      background: rgba(6, 182, 212, 0.2); color: #38bdf8;
      border-color: rgba(6, 182, 212, 0.4); font-weight: 600;
    }
    .chip-color { width: 8px; height: 8px; border-radius: 50%; }
    .eventos-grid { display: flex; flex-direction: column; gap: 12px; }
    .evento-card {
      display: flex; align-items: center; gap: 18px; padding: 16px 20px;
      border-radius: var(--radius-lg, 14px); cursor: pointer;
      border: 1px solid rgba(255, 255, 255, 0.08); transition: all 0.2s ease;
      position: relative; overflow: hidden;
    }
    .evento-card:hover {
      transform: translateY(-2px); border-color: rgba(6, 182, 212, 0.35);
      background: rgba(255, 255, 255, 0.06); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
    }
    .calendar-pill {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      min-width: 68px; padding: 8px 10px; border-radius: var(--radius-md, 10px);
      background: rgba(6, 182, 212, 0.12); border: 1px solid rgba(6, 182, 212, 0.25);
      text-align: center; flex-shrink: 0;
    }
    .cal-month { font-size: 0.72rem; font-weight: 700; color: #22d3ee; text-transform: uppercase; }
    .cal-day { font-size: 1.5rem; font-weight: 800; color: var(--text-primary); line-height: 1.1; }
    .cal-time { font-size: 0.72rem; color: var(--text-secondary); margin-top: 2px; }
    .evento-info { flex: 1; display: flex; flex-direction: column; gap: 6px; min-width: 0; }
    .evento-meta-top { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .badge-timing-small {
      font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
      padding: 2px 8px; border-radius: var(--radius-full, 9999px);
    }
    .timing-proximo { background: rgba(6, 182, 212, 0.15); color: #22d3ee; }
    .timing-encurso { background: rgba(16, 185, 129, 0.2); color: #34d399; }
    .timing-pasado { background: rgba(148, 163, 184, 0.15); color: #94a3b8; }
    .badge-cat-small { font-size: 0.72rem; color: var(--text-secondary); background: rgba(255, 255, 255, 0.06); padding: 2px 8px; border-radius: 6px; }
    .espacio-pill-small {
      display: inline-flex; align-items: center; gap: 5px;
      font-size: 0.75rem; font-weight: 600; color: var(--text-secondary);
      background: rgba(255, 255, 255, 0.05); padding: 2px 8px; border-radius: var(--radius-full, 9999px);
    }
    .espacio-dot { width: 7px; height: 7px; border-radius: 50%; }
    .espacio-pill-small.sin-espacio { font-style: italic; }
    .evento-card-title {
      margin: 0; font-size: 1.12rem; font-weight: 700; color: var(--text-primary);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .evento-card-desc {
      margin: 0; font-size: 0.88rem; color: var(--text-secondary);
      display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .evento-horario-row {
      display: flex; align-items: center; gap: 6px; font-size: 0.82rem;
      color: #38bdf8; font-weight: 500;
    }
    .horario-icon { font-size: 0.85rem; }
    .evento-card-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
    .action-btn {
      background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: var(--radius-md, 8px); padding: 8px 10px; font-size: 0.95rem;
      cursor: pointer; color: var(--text-secondary); transition: all 0.2s;
    }
    .action-btn:hover { background: rgba(255, 255, 255, 0.15); color: var(--text-primary); }
    .btn-action-delete:hover {
      background: rgba(244, 63, 94, 0.2); border-color: rgba(244, 63, 94, 0.4);
    }
    .empty-state {
      padding: 60px 24px; text-align: center; border-radius: var(--radius-lg, 16px);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 14px; border: 1px dashed rgba(255, 255, 255, 0.12);
    }
    .empty-icon { font-size: 3.2rem; }
    .empty-state h3 { font-size: 1.3rem; font-weight: 700; margin: 0; color: var(--text-primary); }
    .empty-state p { color: var(--text-secondary); max-width: 440px; font-size: 0.95rem; margin: 0; line-height: 1.5; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class EventosComponent implements OnInit {
  private readonly eventoService = inject(EventoService);
  private readonly espacioService = inject(EspacioService);

  readonly eventos = this.eventoService.eventosOrdenados;
  readonly categorias = this.eventoService.categorias;
  readonly filtroEspacio = this.eventoService.filtroEspacioId;
  readonly filtroCategoria = this.eventoService.filtroCategoria;
  readonly espacios = this.espacioService.espacios;

  // Estados de modales
  isModalFormOpen = false;
  isModalDeleteOpen = false;
  isModalDetalleOpen = false;

  eventoSeleccionado: Evento | null = null;
  eventoAEliminar: Evento | null = null;
  eventoDetalle: Evento | null = null;

  async ngOnInit(): Promise<void> {
    await this.espacioService.loadAll();
    await this.eventoService.cargarEventos();
  }

  onFiltrarEspacio(espacioId: FiltroEspacioTipo): void {
    this.eventoService.setFiltroEspacio(espacioId);
  }

  onFiltrarCategoria(categoria: string | null): void {
    this.eventoService.setFiltroCategoria(categoria);
  }

  get defaultEspacioId(): number | null {
    const f = this.filtroEspacio();
    return typeof f === 'number' ? f : null;
  }

  getEspacio(espacioId: number | null | undefined): Espacio | null {
    if (!espacioId) {
      return null;
    }
    return this.espacios().find(e => e.id === espacioId) ?? null;
  }

  getMesAbrev(iso: string): string {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('es-ES', { month: 'short' });
    } catch {
      return '';
    }
  }

  getDia(iso: string): string {
    try {
      const d = new Date(iso);
      return d.getDate().toString();
    } catch {
      return '';
    }
  }

  getHora(iso: string): string {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }

  formatHorario(inicioIso: string, finIso: string): string {
    try {
      const dInicio = new Date(inicioIso);
      const dFin = new Date(finIso);

      const horaIni = dInicio.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      const horaFin = dFin.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

      if (dInicio.toDateString() === dFin.toDateString()) {
        return `${horaIni} - ${horaFin}`;
      }

      return `${dInicio.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} ${horaIni} → ${dFin.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} ${horaFin}`;
    } catch {
      return `${inicioIso} - ${finIso}`;
    }
  }

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

  // Modales
  abrirModalCrear(): void {
    this.eventoSeleccionado = null;
    this.isModalFormOpen = true;
  }

  abrirModalEditar(evento: Evento): void {
    this.eventoSeleccionado = evento;
    this.isModalFormOpen = true;
  }

  cerrarModalForm(): void {
    this.isModalFormOpen = false;
    this.eventoSeleccionado = null;
  }

  async onGuardarEvento(datos: EventoCreateDto | Partial<Evento>): Promise<void> {
    if (this.eventoSeleccionado && this.eventoSeleccionado.id) {
      await this.eventoService.update(this.eventoSeleccionado.id, datos as Partial<Evento>);
    } else {
      await this.eventoService.create(datos as EventoCreateDto);
    }
    this.cerrarModalForm();
    if (this.eventoDetalle && this.eventoSeleccionado) {
      // Si el detalle estaba abierto, refrescarlo con la versión actualizada
      const ref = await this.eventoService.getById(this.eventoSeleccionado.id!);
      this.eventoDetalle = ref ?? null;
    }
  }

  abrirModalEliminar(evento: Evento): void {
    this.eventoAEliminar = evento;
    this.isModalDeleteOpen = true;
  }

  cerrarModalDelete(): void {
    this.isModalDeleteOpen = false;
    this.eventoAEliminar = null;
  }

  async onConfirmarEliminar(id: number): Promise<void> {
    await this.eventoService.delete(id);
    this.cerrarModalDelete();
    if (this.eventoDetalle && this.eventoDetalle.id === id) {
      this.cerrarModalDetalle();
    }
  }

  abrirModalDetalle(evento: Evento): void {
    this.eventoDetalle = evento;
    this.isModalDetalleOpen = true;
  }

  cerrarModalDetalle(): void {
    this.isModalDetalleOpen = false;
    this.eventoDetalle = null;
  }

  onEditarDesdeDetalle(evento: Evento): void {
    this.abrirModalEditar(evento);
  }

  onEliminarDesdeDetalle(evento: Evento): void {
    this.abrirModalEliminar(evento);
  }
}
