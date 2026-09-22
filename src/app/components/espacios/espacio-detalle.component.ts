import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EspacioService } from '../../services/espacio.service';
import { NotaRepository } from '../../repositories/nota.repository';
import { TareaRepository, TareaCreateDto } from '../../repositories/tarea.repository';
import { EventoRepository, EventoCreateDto } from '../../repositories/evento.repository';
import { Espacio, Nota, Tarea, Evento, EstadoTarea } from '../../models';
import { EspacioModalComponent } from './espacio-modal.component';
import { NotaModalComponent } from '../notas/nota-modal.component';
import { NotaDetalleModalComponent } from '../notas/nota-detalle-modal.component';
import { TareaModalComponent } from '../tareas/tarea-modal.component';
import { TareaDetalleModalComponent } from '../tareas/tarea-detalle-modal.component';
import { EventoModalComponent } from '../eventos/evento-modal.component';
import { EventoDetalleModalComponent } from '../eventos/evento-detalle-modal.component';

export type TabTipo = 'todo' | 'notas' | 'tareas' | 'eventos';

@Component({
  selector: 'app-espacio-detalle',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    EspacioModalComponent,
    NotaModalComponent,
    NotaDetalleModalComponent,
    TareaModalComponent,
    TareaDetalleModalComponent,
    EventoModalComponent,
    EventoDetalleModalComponent
  ],
  template: `
    <div class="view-container" id="view-espacio-detalle">
      <!-- Encabezado del Espacio (T-02.5) -->
      @if (espacio()) {
        <header class="espacio-header glass" [style.border-left-color]="espacio()?.color">
          <div class="header-nav-row">
            <a routerLink="/espacios" class="btn-back" id="btn-back-to-espacios">
              ← Volver a Espacios
            </a>
          </div>

          <div class="header-main-row">
            <div class="header-title-block">
              <div class="title-with-color">
                <span class="color-badge" [style.background-color]="espacio()?.color"></span>
                <h1 class="espacio-title" id="espacio-detalle-nombre">{{ espacio()?.nombre }}</h1>
                @if (espacio()?.esSistema) {
                  <span class="system-badge" title="Espacio predeterminado del sistema">🛡️ Sistema</span>
                }
              </div>
              <p class="espacio-desc" id="espacio-detalle-desc">
                {{ espacio()?.descripcion || 'Sin descripción asignada para este espacio.' }}
              </p>
            </div>

            <div class="header-actions">
              <button
                type="button"
                class="btn btn-secondary"
                id="btn-edit-espacio-header"
                (click)="abrirModalEditarEspacio()"
              >
                ✏️ Editar Espacio
              </button>
            </div>
          </div>
        </header>

        <!-- Barra de Pestañas y Filtros (T-02.5) -->
        <section class="controls-bar glass" id="espacio-controls">
          <!-- Pestañas de Tipo -->
          <div class="tabs-container" id="espacio-tabs">
            <button
              type="button"
              class="tab-btn"
              [class.active]="tabActiva() === 'todo'"
              (click)="tabActiva.set('todo')"
              id="tab-todo"
            >
              🌐 Todo <span class="tab-count">({{ totalElementos() }})</span>
            </button>
            <button
              type="button"
              class="tab-btn"
              [class.active]="tabActiva() === 'notas'"
              (click)="tabActiva.set('notas')"
              id="tab-notas"
            >
              📝 Notas <span class="tab-count">({{ notasFiltradas().length }})</span>
            </button>
            <button
              type="button"
              class="tab-btn"
              [class.active]="tabActiva() === 'tareas'"
              (click)="tabActiva.set('tareas')"
              id="tab-tareas"
            >
              ✅ Tareas <span class="tab-count">({{ tareasFiltradas().length }})</span>
            </button>
            <button
              type="button"
              class="tab-btn"
              [class.active]="tabActiva() === 'eventos'"
              (click)="tabActiva.set('eventos')"
              id="tab-eventos"
            >
              📅 Eventos <span class="tab-count">({{ eventosFiltradas().length }})</span>
            </button>
          </div>

          <!-- Filtro por Categoría -->
          <div class="categories-bar" id="espacio-category-filters">
            <span class="filter-label">Categoría:</span>
            <div class="chips-list">
              <button
                type="button"
                class="chip-btn"
                [class.active]="categoriaFiltro() === null"
                (click)="categoriaFiltro.set(null)"
                id="chip-cat-todas"
              >
                Todas
              </button>

              @if (tieneElementosSinCategoria()) {
                <button
                  type="button"
                  class="chip-btn"
                  [class.active]="categoriaFiltro() === '__sin_cat__'"
                  (click)="categoriaFiltro.set('__sin_cat__')"
                  id="chip-cat-sin-categoria"
                >
                  ⚪ Sin categoría
                </button>
              }

              @for (cat of categoriasDisponibles(); track cat) {
                <button
                  type="button"
                  class="chip-btn"
                  [class.active]="categoriaFiltro()?.toLowerCase() === cat.toLowerCase()"
                  (click)="categoriaFiltro.set(cat)"
                  [id]="'chip-cat-' + cat"
                >
                  🏷️ {{ cat }}
                </button>
              }
            </div>
          </div>
        </section>

        <!-- Contenido del Espacio -->
        <main class="content-section">
          <!-- Si el espacio está totalmente vacío (T-02.5) -->
          @if (totalElementos() === 0 && categoriaFiltro() === null) {
            <div class="empty-state glass" id="espacio-empty-state">
              <div class="empty-icon">📂</div>
              <h3>Este espacio aún no tiene contenido</h3>
              <p>Comienza a organizar tus ideas, pendientes y compromisos vinculándolos directamente a este espacio.</p>
              <div class="empty-actions">
                <button
                  type="button"
                  class="btn btn-primary"
                  id="btn-empty-crear-nota"
                  (click)="abrirCrearNota()"
                >
                  + Nueva Nota
                </button>
                <button
                  type="button"
                  class="btn btn-primary"
                  id="btn-empty-crear-tarea"
                  (click)="abrirCrearTarea()"
                >
                  + Nueva Tarea
                </button>
                <button
                  type="button"
                  class="btn btn-primary"
                  id="btn-empty-crear-evento"
                  (click)="abrirCrearEvento()"
                >
                  + Nuevo Evento
                </button>
              </div>
            </div>
          } @else if (totalElementosFiltrados() === 0) {
            <!-- Vacío por filtro de categoría -->
            <div class="empty-state glass" id="espacio-filter-empty-state">
              <div class="empty-icon">🔍</div>
              <h3>Sin coincidencias en esta categoría</h3>
              <p>No se encontraron notas, tareas o eventos con el filtro seleccionado.</p>
              <button
                type="button"
                class="btn btn-secondary"
                (click)="categoriaFiltro.set(null)"
              >
                Limpiar filtro de categoría
              </button>
            </div>
          } @else {
            <!-- Secciones de Contenido -->
            <div class="elements-wrapper">
              <!-- SECCIÓN NOTAS -->
              @if ((tabActiva() === 'todo' || tabActiva() === 'notas') && notasFiltradas().length > 0) {
                <section class="type-section" id="section-notas">
                  <div class="section-header">
                    <h2 class="section-title">📝 Notas ({{ notasFiltradas().length }})</h2>
                    <button type="button" class="btn-add-inline" (click)="abrirCrearNota()">+ Nota</button>
                  </div>

                  <div class="cards-grid">
                    @for (nota of notasFiltradas(); track nota.id) {
                      <article
                        class="item-card glass"
                        [id]="'nota-card-' + nota.id"
                        (click)="abrirDetalleNota(nota)"
                        tabindex="0"
                        (keydown.enter)="abrirDetalleNota(nota)"
                      >
                        <div class="card-top">
                          <h4 class="card-title">{{ nota.titulo }}</h4>
                          @if (nota.categoria) {
                            <span class="badge-cat">🏷️ {{ nota.categoria }}</span>
                          }
                        </div>
                        <p class="card-desc">{{ nota.contenido }}</p>
                        <div class="card-meta">
                          <small>🕒 {{ formatFecha(nota.fechaActualizacion || nota.fechaCreacion) }}</small>
                        </div>
                      </article>
                    }
                  </div>
                </section>
              }

              <!-- SECCIÓN TAREAS -->
              @if ((tabActiva() === 'todo' || tabActiva() === 'tareas') && tareasFiltradas().length > 0) {
                <section class="type-section" id="section-tareas">
                  <div class="section-header">
                    <h2 class="section-title">✅ Tareas ({{ tareasFiltradas().length }})</h2>
                    <button type="button" class="btn-add-inline" (click)="abrirCrearTarea()">+ Tarea</button>
                  </div>

                  <div class="cards-grid">
                    @for (tarea of tareasFiltradas(); track tarea.id) {
                      <article
                        class="item-card glass"
                        [id]="'tarea-card-' + tarea.id"
                        (click)="abrirDetalleTarea(tarea)"
                        tabindex="0"
                        (keydown.enter)="abrirDetalleTarea(tarea)"
                      >
                        <div class="card-top">
                          <div class="badges-row">
                            <span class="badge-prioridad" [class]="'prio-' + tarea.prioridad.toLowerCase()">
                              {{ tarea.prioridad }}
                            </span>
                            <span class="badge-estado" [class]="'estado-' + sanitizeEstado(tarea.estado)">
                              {{ tarea.estado }}
                            </span>
                            @if (tarea.categoria) {
                              <span class="badge-cat">🏷️ {{ tarea.categoria }}</span>
                            }
                          </div>
                        </div>

                        <h4 class="card-title" [class.completed]="tarea.estado === 'Completada'">
                          {{ tarea.titulo }}
                        </h4>

                        @if (tarea.descripcion) {
                          <p class="card-desc">{{ tarea.descripcion }}</p>
                        }

                        <div class="card-meta">
                          @if (tarea.fechaLimite; as fl) {
                            <small class="meta-deadline">⏰ Límite: {{ formatFecha(fl) }}</small>
                          }
                        </div>
                      </article>
                    }
                  </div>
                </section>
              }

              <!-- SECCIÓN EVENTOS -->
              @if ((tabActiva() === 'todo' || tabActiva() === 'eventos') && eventosFiltradas().length > 0) {
                <section class="type-section" id="section-eventos">
                  <div class="section-header">
                    <h2 class="section-title">📅 Eventos ({{ eventosFiltradas().length }})</h2>
                    <button type="button" class="btn-add-inline" (click)="abrirCrearEvento()">+ Evento</button>
                  </div>

                  <div class="cards-grid">
                    @for (evento of eventosFiltradas(); track evento.id) {
                      <article
                        class="item-card glass"
                        [id]="'evento-card-' + evento.id"
                        (click)="abrirDetalleEvento(evento)"
                        tabindex="0"
                        (keydown.enter)="abrirDetalleEvento(evento)"
                      >
                        <div class="card-top">
                          <span class="badge-timing">
                            {{ getTimingLabel(evento.fechaInicio, evento.fechaFin) }}
                          </span>
                          @if (evento.categoria) {
                            <span class="badge-cat">🏷️ {{ evento.categoria }}</span>
                          }
                        </div>

                        <h4 class="card-title">{{ evento.titulo }}</h4>

                        @if (evento.descripcion) {
                          <p class="card-desc">{{ evento.descripcion }}</p>
                        }

                        <div class="card-meta">
                          <small class="meta-schedule">🕒 {{ formatHorario(evento.fechaInicio, evento.fechaFin) }}</small>
                        </div>
                      </article>
                    }
                  </div>
                </section>
              }
            </div>
          }
        </main>
      } @else if (cargando()) {
        <div class="loading-state glass">
          <p>Cargando información del espacio...</p>
        </div>
      } @else {
        <div class="empty-state glass">
          <div class="empty-icon">⚠️</div>
          <h3>Espacio no encontrado</h3>
          <p>El espacio solicitado no existe o fue eliminado.</p>
          <a routerLink="/espacios" class="btn btn-primary">Volver a la lista de Espacios</a>
        </div>
      }

      <!-- Modales Integrados -->
      @if (isEditEspacioModalOpen && espacio()) {
        <app-espacio-modal
          [espacioToEdit]="espacio()"
          (saved)="onEspacioGuardado($event)"
          (cancelled)="isEditEspacioModalOpen = false"
        ></app-espacio-modal>
      }

      <!-- Notas -->
      @if (isNotaModalOpen) {
        <app-nota-modal
          [notaToEdit]="notaSeleccionada"
          [defaultEspacioId]="espacioId()"
          [espacios]="espaciosList()"
          (saved)="onNotaGuardada($event)"
          (cancelled)="isNotaModalOpen = false"
        ></app-nota-modal>
      }

      @if (isNotaDetalleOpen && notaDetalle) {
        <app-nota-detalle-modal
          [nota]="notaDetalle"
          [espacio]="espacio()"
          (edit)="onEditarNotaDesdeDetalle(notaDetalle)"
          (delete)="onEliminarNotaDesdeDetalle(notaDetalle)"
          (closed)="isNotaDetalleOpen = false"
        ></app-nota-detalle-modal>
      }

      <!-- Tareas -->
      <app-tarea-modal
        [visible]="isTareaModalOpen"
        [tarea]="tareaSeleccionada"
        [espacioActivoId]="espacioId()"
        [espacios]="espaciosList()"
        (guardar)="onTareaGuardada($event)"
        (cancelar)="isTareaModalOpen = false"
      ></app-tarea-modal>

      <app-tarea-detalle-modal
        [visible]="isTareaDetalleOpen"
        [tarea]="tareaDetalle"
        [espacio]="espacio()"
        (cambiarEstado)="onCambiarEstadoTarea($event)"
        (editar)="onEditarTareaDesdeDetalle($event)"
        (eliminar)="onEliminarTareaDesdeDetalle($event)"
        (cerrar)="isTareaDetalleOpen = false"
      ></app-tarea-detalle-modal>

      <!-- Eventos -->
      <app-evento-modal
        [visible]="isEventoModalOpen"
        [evento]="eventoSeleccionado"
        [espacios]="espaciosList()"
        [defaultEspacioId]="espacioId()"
        (guardar)="onEventoGuardado($event)"
        (cancelar)="isEventoModalOpen = false"
      ></app-evento-modal>

      <app-evento-detalle-modal
        [visible]="isEventoDetalleOpen"
        [evento]="eventoDetalle"
        [espacio]="espacio()"
        (editar)="onEditarEventoDesdeDetalle($event)"
        (eliminar)="onEliminarEventoDesdeDetalle($event)"
        (cerrar)="isEventoDetalleOpen = false"
      ></app-evento-detalle-modal>
    </div>
  `,
  styles: [`
    .view-container { display: flex; flex-direction: column; gap: 20px; animation: fadeIn 0.3s ease; }
    .espacio-header {
      padding: 24px; border-radius: var(--radius-lg, 16px);
      border-left-width: 6px; border-left-style: solid;
      display: flex; flex-direction: column; gap: 14px;
    }
    .header-nav-row { display: flex; align-items: center; }
    .btn-back {
      font-size: 0.85rem; font-weight: 600; color: var(--text-secondary);
      text-decoration: none; transition: all 0.2s;
    }
    .btn-back:hover { color: #22d3ee; }
    .header-main-row {
      display: flex; align-items: flex-start; justify-content: space-between;
      gap: 18px; flex-wrap: wrap;
    }
    .header-title-block { display: flex; flex-direction: column; gap: 6px; }
    .title-with-color { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .color-badge { width: 14px; height: 14px; border-radius: 50%; }
    .espacio-title { font-size: 2rem; font-weight: 800; color: var(--text-primary); margin: 0; }
    .system-badge {
      font-size: 0.72rem; font-weight: 700; text-transform: uppercase;
      padding: 3px 8px; border-radius: var(--radius-full, 9999px);
      background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3);
    }
    .espacio-desc { font-size: 0.95rem; color: var(--text-secondary); margin: 0; max-width: 650px; }
    .controls-bar {
      padding: 14px 18px; border-radius: var(--radius-lg, 12px);
      display: flex; flex-direction: column; gap: 14px;
    }
    .tabs-container { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .tab-btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 8px 16px; border-radius: var(--radius-md, 8px);
      background: rgba(255, 255, 255, 0.05); color: var(--text-secondary);
      border: 1px solid rgba(255, 255, 255, 0.08); font-size: 0.88rem;
      font-weight: 600; cursor: pointer; transition: all 0.2s;
    }
    .tab-btn:hover { background: rgba(255, 255, 255, 0.1); color: var(--text-primary); }
    .tab-btn.active {
      background: var(--primary, #6366f1); color: #fff;
      border-color: var(--primary, #6366f1); box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    }
    .tab-count { font-size: 0.75rem; opacity: 0.85; }
    .categories-bar {
      display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
      padding-top: 10px; border-top: 1px solid rgba(255, 255, 255, 0.06);
    }
    .filter-label { font-size: 0.8rem; font-weight: 600; text-transform: uppercase; color: var(--text-secondary); }
    .chips-list { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .chip-btn {
      padding: 5px 12px; border-radius: var(--radius-full, 9999px);
      background: rgba(255, 255, 255, 0.04); color: var(--text-secondary);
      border: 1px solid rgba(255, 255, 255, 0.08); font-size: 0.8rem;
      font-weight: 500; cursor: pointer; transition: all 0.2s;
    }
    .chip-btn:hover { background: rgba(255, 255, 255, 0.1); color: var(--text-primary); }
    .chip-btn.active {
      background: rgba(6, 182, 212, 0.2); color: #38bdf8;
      border-color: rgba(6, 182, 212, 0.4); font-weight: 600;
    }
    .elements-wrapper { display: flex; flex-direction: column; gap: 28px; }
    .type-section { display: flex; flex-direction: column; gap: 12px; }
    .section-header { display: flex; align-items: center; justify-content: space-between; }
    .section-title { font-size: 1.25rem; font-weight: 700; color: var(--text-primary); margin: 0; }
    .btn-add-inline {
      background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: var(--radius-md, 6px); padding: 5px 10px; font-size: 0.8rem;
      font-weight: 600; color: var(--text-secondary); cursor: pointer; transition: all 0.2s;
    }
    .btn-add-inline:hover { background: rgba(255, 255, 255, 0.12); color: var(--text-primary); }
    .cards-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 14px;
    }
    .item-card {
      padding: 16px; border-radius: var(--radius-md, 12px);
      display: flex; flex-direction: column; gap: 8px;
      cursor: pointer; transition: all 0.2s ease; outline: none;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    .item-card:hover {
      transform: translateY(-2px); border-color: rgba(255, 255, 255, 0.2);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
    }
    .card-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
    .badges-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .badge-cat { font-size: 0.72rem; color: var(--text-secondary); background: rgba(255, 255, 255, 0.06); padding: 2px 7px; border-radius: 4px; }
    .badge-prioridad {
      font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
      padding: 2px 7px; border-radius: var(--radius-full, 9999px);
    }
    .prio-urgente { background: rgba(244, 63, 94, 0.2); color: #fb7185; }
    .prio-normal { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }
    .prio-baja { background: rgba(100, 116, 139, 0.2); color: #94a3b8; }
    .badge-estado {
      font-size: 0.7rem; font-weight: 600; padding: 2px 7px;
      border-radius: var(--radius-full, 9999px); background: rgba(255, 255, 255, 0.08); color: var(--text-secondary);
    }
    .estado-completada { background: rgba(16, 185, 129, 0.2); color: #34d399; }
    .estado-en-progreso { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
    .badge-timing {
      font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
      padding: 2px 7px; border-radius: var(--radius-full, 9999px);
      background: rgba(6, 182, 212, 0.15); color: #22d3ee;
    }
    .card-title {
      font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin: 0;
      line-height: 1.3;
    }
    .card-title.completed { text-decoration: line-through; opacity: 0.65; }
    .card-desc {
      font-size: 0.88rem; color: var(--text-secondary); margin: 0;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
      overflow: hidden; line-height: 1.4;
    }
    .card-meta { font-size: 0.78rem; color: var(--text-secondary); margin-top: auto; }
    .meta-deadline { color: #f59e0b; font-weight: 600; }
    .meta-schedule { color: #38bdf8; font-weight: 600; }
    .empty-state {
      padding: 50px 24px; text-align: center; border-radius: var(--radius-lg, 16px);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 12px; border: 1px dashed rgba(255, 255, 255, 0.12);
    }
    .empty-icon { font-size: 3rem; }
    .empty-state h3 { font-size: 1.3rem; font-weight: 700; margin: 0; color: var(--text-primary); }
    .empty-state p { color: var(--text-secondary); max-width: 440px; font-size: 0.95rem; margin: 0; }
    .empty-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-top: 6px; }
    .btn {
      padding: 9px 16px; border-radius: var(--radius-md, 8px); font-weight: 600;
      font-size: 0.88rem; cursor: pointer; transition: all 0.2s; border: none;
      text-decoration: none; display: inline-flex; align-items: center; gap: 6px;
    }
    .btn-primary { background: #0891b2; color: #fff; }
    .btn-primary:hover { background: #06b6d4; box-shadow: 0 4px 12px rgba(6, 182, 212, 0.35); }
    .btn-secondary { background: rgba(255, 255, 255, 0.08); color: var(--text-primary); }
    .btn-secondary:hover { background: rgba(255, 255, 255, 0.15); }
    .loading-state { padding: 40px; text-align: center; border-radius: var(--radius-md, 12px); }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class EspacioDetalleComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly espacioService = inject(EspacioService);
  private readonly notaRepo = inject(NotaRepository);
  private readonly tareaRepo = inject(TareaRepository);
  private readonly eventoRepo = inject(EventoRepository);

  readonly espacioId = signal<number | null>(null);
  readonly espacio = signal<Espacio | null>(null);
  readonly cargando = signal(true);

  readonly notas = signal<Nota[]>([]);
  readonly tareas = signal<Tarea[]>([]);
  readonly eventos = signal<Evento[]>([]);

  readonly tabActiva = signal<TabTipo>('todo');
  readonly categoriaFiltro = signal<string | null>(null);

  readonly espaciosList = this.espacioService.espacios;

  // Modales
  isEditEspacioModalOpen = false;

  isNotaModalOpen = false;
  notaSeleccionada: Nota | null = null;
  isNotaDetalleOpen = false;
  notaDetalle: Nota | null = null;

  isTareaModalOpen = false;
  tareaSeleccionada: Tarea | null = null;
  isTareaDetalleOpen = false;
  tareaDetalle: Tarea | null = null;

  isEventoModalOpen = false;
  eventoSeleccionado: Evento | null = null;
  isEventoDetalleOpen = false;
  eventoDetalle: Evento | null = null;

  readonly categoriasDisponibles = computed(() => {
    const cats = new Set<string>();
    for (const n of this.notas()) {
      if (n.categoria && n.categoria.trim().length > 0) cats.add(n.categoria.trim());
    }
    for (const t of this.tareas()) {
      if (t.categoria && t.categoria.trim().length > 0) cats.add(t.categoria.trim());
    }
    for (const e of this.eventos()) {
      if (e.categoria && e.categoria.trim().length > 0) cats.add(e.categoria.trim());
    }
    return Array.from(cats).sort();
  });

  readonly tieneElementosSinCategoria = computed(() => {
    return (
      this.notas().some(n => !n.categoria || n.categoria.trim().length === 0) ||
      this.tareas().some(t => !t.categoria || t.categoria.trim().length === 0) ||
      this.eventos().some(e => !e.categoria || e.categoria.trim().length === 0)
    );
  });

  readonly notasFiltradas = computed(() => {
    const filtro = this.categoriaFiltro();
    if (!filtro) return this.notas();
    if (filtro === '__sin_cat__') {
      return this.notas().filter(n => !n.categoria || n.categoria.trim().length === 0);
    }
    return this.notas().filter(n => n.categoria?.trim().toLowerCase() === filtro.toLowerCase());
  });

  readonly tareasFiltradas = computed(() => {
    const filtro = this.categoriaFiltro();
    if (!filtro) return this.tareas();
    if (filtro === '__sin_cat__') {
      return this.tareas().filter(t => !t.categoria || t.categoria.trim().length === 0);
    }
    return this.tareas().filter(t => t.categoria?.trim().toLowerCase() === filtro.toLowerCase());
  });

  readonly eventosFiltradas = computed(() => {
    const filtro = this.categoriaFiltro();
    if (!filtro) return this.eventos();
    if (filtro === '__sin_cat__') {
      return this.eventos().filter(e => !e.categoria || e.categoria.trim().length === 0);
    }
    return this.eventos().filter(e => e.categoria?.trim().toLowerCase() === filtro.toLowerCase());
  });

  readonly totalElementos = computed(() => {
    return this.notas().length + this.tareas().length + this.eventos().length;
  });

  readonly totalElementosFiltrados = computed(() => {
    return this.notasFiltradas().length + this.tareasFiltradas().length + this.eventosFiltradas().length;
  });

  async ngOnInit(): Promise<void> {
    await this.espacioService.loadAll();

    this.route.paramMap.subscribe(async params => {
      const idStr = params.get('id');
      if (idStr) {
        const id = parseInt(idStr, 10);
        if (!isNaN(id)) {
          this.espacioId.set(id);
          await this.cargarDatos(id);
        } else {
          this.cargando.set(false);
        }
      } else {
        this.cargando.set(false);
      }
    });
  }

  async cargarDatos(id: number): Promise<void> {
    this.cargando.set(true);
    const esp = await this.espacioService.getById(id);
    if (esp) {
      this.espacio.set(esp);
      const [nList, tList, eList] = await Promise.all([
        this.notaRepo.getByEspacio(id),
        this.tareaRepo.getByEspacio(id),
        this.eventoRepo.getByEspacio(id)
      ]);
      this.notas.set(nList);
      this.tareas.set(tList);
      this.eventos.set(eList);
    } else {
      this.espacio.set(null);
    }
    this.cargando.set(false);
  }

  async recargarElementos(): Promise<void> {
    const id = this.espacioId();
    if (id !== null) {
      const [nList, tList, eList] = await Promise.all([
        this.notaRepo.getByEspacio(id),
        this.tareaRepo.getByEspacio(id),
        this.eventoRepo.getByEspacio(id)
      ]);
      this.notas.set(nList);
      this.tareas.set(tList);
      this.eventos.set(eList);
    }
  }

  // Edición del espacio (T-02.5)
  abrirModalEditarEspacio(): void {
    this.isEditEspacioModalOpen = true;
  }

  async onEspacioGuardado(datos: Partial<Espacio>): Promise<void> {
    const id = this.espacioId();
    if (id !== null) {
      await this.espacioService.update(id, datos);
      const updated = await this.espacioService.getById(id);
      this.espacio.set(updated ?? null);
    }
    this.isEditEspacioModalOpen = false;
  }

  // Acciones de Notas
  abrirCrearNota(): void {
    this.notaSeleccionada = null;
    this.isNotaModalOpen = true;
  }

  abrirDetalleNota(nota: Nota): void {
    this.notaDetalle = nota;
    this.isNotaDetalleOpen = true;
  }

  onEditarNotaDesdeDetalle(nota: Nota): void {
    this.isNotaDetalleOpen = false;
    this.notaSeleccionada = nota;
    this.isNotaModalOpen = true;
  }

  async onEliminarNotaDesdeDetalle(nota: Nota): Promise<void> {
    if (nota.id) {
      await this.notaRepo.delete(nota.id);
      this.isNotaDetalleOpen = false;
      await this.recargarElementos();
    }
  }

  async onNotaGuardada(datos: Omit<Nota, 'id' | 'fechaCreacion' | 'fechaActualizacion'> | Partial<Nota>): Promise<void> {
    if (this.notaSeleccionada?.id) {
      await this.notaRepo.update(this.notaSeleccionada.id, datos as Partial<Nota>);
    } else {
      await this.notaRepo.create({
        ...datos as Omit<Nota, 'id' | 'fechaCreacion' | 'fechaActualizacion'>,
        espacioId: this.espacioId()
      });
    }
    this.isNotaModalOpen = false;
    await this.recargarElementos();
  }

  // Acciones de Tareas
  abrirCrearTarea(): void {
    this.tareaSeleccionada = null;
    this.isTareaModalOpen = true;
  }

  abrirDetalleTarea(tarea: Tarea): void {
    this.tareaDetalle = tarea;
    this.isTareaDetalleOpen = true;
  }

  onEditarTareaDesdeDetalle(tarea: Tarea): void {
    this.isTareaDetalleOpen = false;
    this.tareaSeleccionada = tarea;
    this.isTareaModalOpen = true;
  }

  async onEliminarTareaDesdeDetalle(tarea: Tarea): Promise<void> {
    if (tarea.id) {
      await this.tareaRepo.delete(tarea.id);
      this.isTareaDetalleOpen = false;
      await this.recargarElementos();
    }
  }

  async onCambiarEstadoTarea(evento: { id: number; nuevoEstado: EstadoTarea }): Promise<void> {
    if (evento.id) {
      await this.tareaRepo.cambiarEstado(evento.id, evento.nuevoEstado);
      await this.recargarElementos();
      if (this.tareaDetalle?.id === evento.id) {
        this.tareaDetalle = { ...this.tareaDetalle, estado: evento.nuevoEstado };
      }
    }
  }

  async onTareaGuardada(datos: TareaCreateDto | Partial<Tarea>): Promise<void> {
    if (this.tareaSeleccionada?.id) {
      await this.tareaRepo.update(this.tareaSeleccionada.id, datos as Partial<Tarea>);
    } else {
      await this.tareaRepo.create({
        ...datos as TareaCreateDto,
        espacioId: this.espacioId()
      });
    }
    this.isTareaModalOpen = false;
    await this.recargarElementos();
  }

  // Acciones de Eventos
  abrirCrearEvento(): void {
    this.eventoSeleccionado = null;
    this.isEventoModalOpen = true;
  }

  abrirDetalleEvento(evento: Evento): void {
    this.eventoDetalle = evento;
    this.isEventoDetalleOpen = true;
  }

  onEditarEventoDesdeDetalle(evento: Evento): void {
    this.isEventoDetalleOpen = false;
    this.eventoSeleccionado = evento;
    this.isEventoModalOpen = true;
  }

  async onEliminarEventoDesdeDetalle(evento: Evento): Promise<void> {
    if (evento.id) {
      await this.eventoRepo.delete(evento.id);
      this.isEventoDetalleOpen = false;
      await this.recargarElementos();
    }
  }

  async onEventoGuardado(datos: EventoCreateDto | Partial<Evento>): Promise<void> {
    if (this.eventoSeleccionado?.id) {
      await this.eventoRepo.update(this.eventoSeleccionado.id, datos as Partial<Evento>);
    } else {
      await this.eventoRepo.create({
        ...datos as EventoCreateDto,
        espacioId: this.espacioId()
      });
    }
    this.isEventoModalOpen = false;
    await this.recargarElementos();
  }

  // Formateadores
  formatFecha(iso: string): string {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return iso;
    }
  }

  formatHorario(inicioIso: string, finIso: string): string {
    try {
      const dInicio = new Date(inicioIso);
      const dFin = new Date(finIso);
      const horaIni = dInicio.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      const horaFin = dFin.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      return `${dInicio.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}, ${horaIni} - ${horaFin}`;
    } catch {
      return `${inicioIso} - ${finIso}`;
    }
  }

  getTimingLabel(inicioIso: string, finIso: string): string {
    const ahora = Date.now();
    const tInicio = new Date(inicioIso).getTime();
    const tFin = new Date(finIso).getTime();
    if (ahora < tInicio) return '⏳ Próximo';
    if (ahora >= tInicio && ahora <= tFin) return '🟢 En curso';
    return '⚪ Pasado';
  }

  sanitizeEstado(estado: string): string {
    return estado.toLowerCase().replace(/\s+/g, '-');
  }
}
