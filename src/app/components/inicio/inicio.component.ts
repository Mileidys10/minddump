import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { InboxService } from '../../services/inbox.service';
import { TareaService } from '../../services/tarea.service';
import { EventoService } from '../../services/evento.service';
import { EspacioService } from '../../services/espacio.service';
import { NotaService } from '../../services/nota.service';
import { InboxItem, Tarea, Evento, Espacio, EstadoTarea, Nota } from '../../models';
import { TareaCreateDto } from '../../repositories/tarea.repository';
import { EventoCreateDto } from '../../repositories/evento.repository';

// Modales de Detalle y Edición (T-10.1)
import { TareaDetalleModalComponent } from '../tareas/tarea-detalle-modal.component';
import { TareaModalComponent } from '../tareas/tarea-modal.component';
import { EventoDetalleModalComponent } from '../eventos/evento-detalle-modal.component';
import { EventoModalComponent } from '../eventos/evento-modal.component';
import { InboxConvertModalComponent } from '../inbox/inbox-convert-modal.component';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TareaDetalleModalComponent,
    TareaModalComponent,
    EventoDetalleModalComponent,
    EventoModalComponent,
    InboxConvertModalComponent
  ],
  template: `
    <div class="view-container" id="view-inicio">
      <!-- Encabezado del Dashboard -->
      <header class="view-header">
        <div>
          <span class="badge">Panel General (P-01)</span>
          <h1 class="view-title">Inicio 🧠</h1>
          <p class="view-subtitle">Resumen ejecutivo de tu segundo cerebro: tareas prioritarias, eventos y capturas pendientes.</p>
        </div>
      </header>

      <!-- SECCIÓN ACCESOS RÁPIDOS (T-10.2) -->
      <section class="quick-access-section" id="section-accesos-rapidos">
        <h2 class="section-title">Accesos Rápidos</h2>
        <div class="quick-grid">
          <a routerLink="/inbox" class="quick-card glass" id="quicklink-inbox">
            <div class="quick-icon" style="background: rgba(99, 102, 241, 0.15); color: #818cf8;">📥</div>
            <div class="quick-text">
              <span class="quick-name">Inbox</span>
              <small>{{ inboxService.totalPendientes() }} pendiente{{ inboxService.totalPendientes() === 1 ? '' : 's' }}</small>
            </div>
            <span class="quick-arrow">→</span>
          </a>

          <a routerLink="/notas" class="quick-card glass" id="quicklink-notas">
            <div class="quick-icon" style="background: rgba(245, 158, 11, 0.15); color: #fbbf24;">📝</div>
            <div class="quick-text">
              <span class="quick-name">Notas</span>
              <small>{{ notaService.notas().length }} nota{{ notaService.notas().length === 1 ? '' : 's' }}</small>
            </div>
            <span class="quick-arrow">→</span>
          </a>

          <a routerLink="/tareas" class="quick-card glass" id="quicklink-tareas">
            <div class="quick-icon" style="background: rgba(244, 63, 94, 0.15); color: #fb7185;">✅</div>
            <div class="quick-text">
              <span class="quick-name">Tareas</span>
              <small>{{ tareasPendientes().length }} activa{{ tareasPendientes().length === 1 ? '' : 's' }}</small>
            </div>
            <span class="quick-arrow">→</span>
          </a>

          <a routerLink="/eventos" class="quick-card glass" id="quicklink-eventos">
            <div class="quick-icon" style="background: rgba(6, 182, 212, 0.15); color: #22d3ee;">📅</div>
            <div class="quick-text">
              <span class="quick-name">Eventos</span>
              <small>{{ proximosEventos().length }} próximo{{ proximosEventos().length === 1 ? '' : 's' }}</small>
            </div>
            <span class="quick-arrow">→</span>
          </a>
        </div>
      </section>

      <!-- RESUMEN DE INFORMACIÓN (T-10.1) -->
      <div class="dashboard-columns">
        <!-- Columna 1: Tareas Pendientes y En Progreso (T-10.1) -->
        <section class="summary-section" id="section-tareas-pendientes">
          <div class="section-header">
            <div class="header-left">
              <span class="section-icon">✅</span>
              <h2 class="section-title">Tareas Activas</h2>
              <span class="count-pill">{{ tareasPendientes().length }}</span>
            </div>
            <a routerLink="/tareas" class="section-link" id="link-ver-todas-tareas">Ver todas →</a>
          </div>

          @if (tareasPendientes().length > 0) {
            <div class="items-list" id="dashboard-tareas-list">
              @for (tarea of tareasPendientes(); track tarea.id) {
                <button
                  type="button"
                  class="item-card glass clickable"
                  [id]="'dashboard-tarea-item-' + tarea.id"
                  (click)="onVerDetalleTarea(tarea)"
                >
                  <div class="item-main">
                    <div class="item-header">
                      <span class="prio-tag" [class]="'prio-' + tarea.prioridad.toLowerCase()">
                        {{ getPrioridadIcon(tarea.prioridad) }} {{ tarea.prioridad }}
                      </span>
                      <span class="state-tag" [class]="'state-' + sanitizeClassName(tarea.estado)">
                        {{ tarea.estado }}
                      </span>
                      @if (getEspacio(tarea.espacioId); as esp) {
                        <span class="space-tag" [style.color]="esp.color">
                          <span class="space-dot" [style.background-color]="esp.color"></span>
                          {{ esp.nombre }}
                        </span>
                      }
                    </div>
                    <h3 class="item-title">{{ tarea.titulo }}</h3>
                    @if (getFechaLimite(tarea); as fl) {
                      <div class="item-date" [class.vencida]="isVencida(tarea)">
                        📅 Límite: {{ formatFecha(fl) }}
                        @if (isVencida(tarea)) {
                          <span class="vencida-badge">Vencida</span>
                        }
                      </div>
                    }
                  </div>
                  <span class="item-action-hint">Ver detalle ↗</span>
                </button>
              }
            </div>
          } @else {
            <div class="empty-section-state glass" id="empty-tareas">
              <span class="empty-icon">🎉</span>
              <h3>¡Todo al día!</h3>
              <p>No tienes tareas pendientes ni en progreso. Puedes descansar o planificar nuevas metas.</p>
              <a routerLink="/tareas" class="empty-action-link">+ Crear nueva tarea</a>
            </div>
          }
        </section>

        <!-- Columna 2: Próximos Eventos y Capturas Recientes -->
        <div class="secondary-columns">
          <!-- Subsección: Próximos Eventos (T-10.1) -->
          <section class="summary-section" id="section-proximos-eventos">
            <div class="section-header">
              <div class="header-left">
                <span class="section-icon">📅</span>
                <h2 class="section-title">Próximos Eventos</h2>
                <span class="count-pill">{{ proximosEventos().length }}</span>
              </div>
              <a routerLink="/eventos" class="section-link" id="link-ver-todos-eventos">Agenda →</a>
            </div>

            @if (proximosEventos().length > 0) {
              <div class="items-list" id="dashboard-eventos-list">
                @for (evento of proximosEventos(); track evento.id) {
                  <button
                    type="button"
                    class="item-card glass clickable"
                    [id]="'dashboard-evento-item-' + evento.id"
                    (click)="onVerDetalleEvento(evento)"
                  >
                    <div class="item-main">
                      <div class="item-header">
                        <span class="event-time-badge">
                          ⏰ {{ formatFechaHora(evento.fechaInicio) }}
                        </span>
                        @if (getEspacio(evento.espacioId); as esp) {
                          <span class="space-tag" [style.color]="esp.color">
                            <span class="space-dot" [style.background-color]="esp.color"></span>
                            {{ esp.nombre }}
                          </span>
                        }
                      </div>
                      <h3 class="item-title">{{ evento.titulo }}</h3>
                      @if (evento.descripcion) {
                        <p class="item-desc">{{ recortarTexto(evento.descripcion, 80) }}</p>
                      }
                    </div>
                    <span class="item-action-hint">Ver evento ↗</span>
                  </button>
                }
              </div>
            } @else {
              <div class="empty-section-state glass" id="empty-eventos">
                <span class="empty-icon">🗓️</span>
                <h3>Sin eventos programados</h3>
                <p>No hay eventos próximos en tu agenda para hoy o días posteriores.</p>
                <a routerLink="/eventos" class="empty-action-link">+ Agendar evento</a>
              </div>
            }
          </section>

          <!-- Subsección: Últimas 5 capturas del Inbox (T-10.1 / R-18) -->
          <section class="summary-section" id="section-inbox-reciente">
            <div class="section-header">
              <div class="header-left">
                <span class="section-icon">📥</span>
                <h2 class="section-title">Inbox Reciente (R-18)</h2>
                <span class="count-pill">{{ capturasInboxRecientes().length }} / 5</span>
              </div>
              <a routerLink="/inbox" class="section-link" id="link-ver-todo-inbox">Procesar Inbox →</a>
            </div>

            @if (capturasInboxRecientes().length > 0) {
              <div class="items-list" id="dashboard-inbox-list">
                @for (item of capturasInboxRecientes(); track item.id) {
                  <button
                    type="button"
                    class="item-card glass clickable inbox-item-card"
                    [id]="'dashboard-inbox-item-' + item.id"
                    (click)="onOrganizarCaptura(item)"
                  >
                    <div class="item-main">
                      <div class="item-header">
                        <span class="time-ago">🕒 {{ formatFechaRelativa(item.fechaCreacion) }}</span>
                      </div>
                      <h3 class="item-title">{{ item.titulo }}</h3>
                      @if (item.descripcion) {
                        <p class="item-desc">{{ recortarTexto(item.descripcion, 90) }}</p>
                      }
                    </div>
                    <div class="inbox-actions-hint">
                      <span class="btn-convert-hint">🔄 Organizar</span>
                    </div>
                  </button>
                }
              </div>
            } @else {
              <div class="empty-section-state glass" id="empty-inbox">
                <span class="empty-icon">✨</span>
                <h3>¡Inbox despejado!</h3>
                <p>No tienes capturas pendientes de organizar. Todo tu flujo mental está ordenado.</p>
                <a routerLink="/inbox" class="empty-action-link">+ Captura rápida</a>
              </div>
            }
          </section>
        </div>
      </div>

      <!-- MODALES DE DETALLE Y GESTIÓN (T-10.1) -->
      <!-- Modal Detalle Tarea -->
      <app-tarea-detalle-modal
        [visible]="isDetalleTareaModalOpen"
        [tarea]="tareaSeleccionada"
        [espacio]="getEspacio(tareaSeleccionada?.espacioId)"
        (cerrar)="cerrarDetalleTarea()"
        (editar)="abrirEditarTarea($event)"
        (eliminar)="eliminarTarea($event)"
        (cambiarEstado)="cambiarEstadoTarea($event)"
      />

      <!-- Modal Editar Tarea -->
      <app-tarea-modal
        [visible]="isEditarTareaModalOpen"
        [tarea]="tareaParaEditar"
        [espacios]="espacios()"
        (guardar)="guardarTareaEditada($event)"
        (cancelar)="cerrarEditarTarea()"
      />

      <!-- Modal Detalle Evento -->
      <app-evento-detalle-modal
        [visible]="isDetalleEventoModalOpen"
        [evento]="eventoSeleccionado"
        [espacio]="getEspacio(eventoSeleccionado?.espacioId)"
        (cerrar)="cerrarDetalleEvento()"
        (editar)="abrirEditarEvento($event)"
        (eliminar)="eliminarEvento($event)"
      />

      <!-- Modal Editar Evento -->
      <app-evento-modal
        [visible]="isEditarEventoModalOpen"
        [evento]="eventoParaEditar"
        [espacios]="espacios()"
        (guardar)="guardarEventoEditado($event)"
        (cancelar)="cerrarEditarEvento()"
      />

      <!-- Modal Convertir Captura Inbox -->
      <app-inbox-convert-modal
        [visible]="isConvertInboxModalOpen"
        [item]="inboxItemSeleccionado"
        [espacios]="espacios()"
        (convertirNota)="convertirCapturaANota($event)"
        (convertirTarea)="convertirCapturaATarea($event)"
        (cancelar)="cerrarConvertInbox()"
      />
    </div>
  `,
  styles: [`
    .view-container { display: flex; flex-direction: column; gap: 24px; animation: fadeIn 0.3s ease; }
    .view-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .badge {
      display: inline-block; font-size: 0.75rem; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.05em; padding: 4px 10px; border-radius: var(--radius-full);
      background: rgba(99, 102, 241, 0.15); color: #818cf8; margin-bottom: 8px;
    }
    .view-title { font-size: 2rem; font-weight: 700; color: var(--text-primary); line-height: 1.2; }
    .view-subtitle { color: var(--text-secondary); margin-top: 6px; font-size: 0.95rem; }

    /* Accesos Rápidos (T-10.2) */
    .quick-access-section { display: flex; flex-direction: column; gap: 12px; }
    .section-title { font-size: 1.2rem; font-weight: 700; color: var(--text-primary); margin: 0; }
    .quick-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px;
    }
    .quick-card {
      padding: 14px 18px; border-radius: var(--radius-md, 12px); display: flex;
      align-items: center; gap: 14px; text-decoration: none;
      transition: transform var(--transition-fast), border-color var(--transition-fast), box-shadow var(--transition-fast);
    }
    .quick-card:hover {
      transform: translateY(-3px); border-color: var(--border-focus); box-shadow: var(--shadow-md);
    }
    .quick-icon {
      width: 42px; height: 42px; border-radius: 10px; display: flex;
      align-items: center; justify-content: center; font-size: 1.35rem; flex-shrink: 0;
    }
    .quick-text { display: flex; flex-direction: column; flex: 1; }
    .quick-name { font-size: 1rem; font-weight: 600; color: var(--text-primary); }
    .quick-text small { font-size: 0.78rem; color: var(--text-muted); }
    .quick-arrow { font-size: 1.1rem; color: var(--text-muted); transition: transform 0.2s, color 0.2s; }
    .quick-card:hover .quick-arrow { transform: translateX(4px); color: var(--primary); }

    /* Columnas de Resumen */
    .dashboard-columns {
      display: grid; grid-template-columns: 1fr 1fr; gap: 24px;
    }
    @media (max-width: 960px) {
      .dashboard-columns { grid-template-columns: 1fr; }
    }
    .secondary-columns { display: flex; flex-direction: column; gap: 24px; }

    .summary-section {
      display: flex; flex-direction: column; gap: 14px;
    }
    .section-header {
      display: flex; justify-content: space-between; align-items: center;
    }
    .header-left { display: flex; align-items: center; gap: 10px; }
    .section-icon { font-size: 1.25rem; }
    .count-pill {
      font-size: 0.75rem; font-weight: 700; padding: 2px 8px; border-radius: 999px;
      background: rgba(255, 255, 255, 0.08); color: var(--text-secondary);
    }
    .section-link {
      font-size: 0.85rem; font-weight: 600; color: var(--primary, #6366f1);
      transition: color 0.2s;
    }
    .section-link:hover { color: #818cf8; text-decoration: underline; }

    /* Lista de Items y Tarjetas */
    .items-list { display: flex; flex-direction: column; gap: 10px; }
    .item-card {
      width: 100%; text-align: left; font-family: inherit; color: inherit;
      border: 1px solid var(--border-color);
      padding: 14px 18px; border-radius: var(--radius-md, 12px); display: flex;
      justify-content: space-between; align-items: center; gap: 14px;
      transition: transform 0.15s, border-color 0.15s, background 0.15s;
    }
    .item-card.clickable { cursor: pointer; }
    .item-card.clickable:hover {
      transform: translateY(-2px); border-color: rgba(99, 102, 241, 0.4);
      background: rgba(255, 255, 255, 0.03);
    }
    .item-main { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 0; }
    .item-header { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .item-title {
      font-size: 0.98rem; font-weight: 600; color: var(--text-primary); margin: 0;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .item-desc {
      font-size: 0.84rem; color: var(--text-secondary); margin: 0; line-height: 1.4;
    }
    .item-date {
      font-size: 0.78rem; color: var(--text-muted); display: flex; align-items: center; gap: 6px;
    }
    .item-date.vencida { color: #f43f5e; font-weight: 600; }
    .vencida-badge {
      background: rgba(244, 63, 94, 0.15); color: #fb7185; padding: 2px 6px;
      border-radius: 4px; font-size: 0.72rem;
    }
    .item-action-hint {
      font-size: 0.8rem; font-weight: 600; color: var(--text-muted); opacity: 0.8;
      white-space: nowrap; transition: color 0.2s, opacity 0.2s;
    }
    .item-card:hover .item-action-hint { color: var(--primary, #6366f1); opacity: 1; }

    /* Badges & Tags */
    .prio-tag {
      font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 6px;
    }
    .prio-urgente { background: rgba(244, 63, 94, 0.15); color: #fb7185; border: 1px solid rgba(244, 63, 94, 0.3); }
    .prio-normal { background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }
    .prio-baja { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }

    .state-tag {
      font-size: 0.72rem; font-weight: 600; padding: 2px 8px; border-radius: 6px;
      background: rgba(255, 255, 255, 0.06); color: var(--text-secondary);
    }
    .state-pendiente { color: #fbbf24; }
    .state-en-progreso { color: #60a5fa; }

    .space-tag {
      font-size: 0.75rem; font-weight: 600; display: inline-flex; align-items: center; gap: 5px;
    }
    .space-dot { width: 7px; height: 7px; border-radius: 50%; }

    .event-time-badge {
      font-size: 0.76rem; font-weight: 600; color: #38bdf8; background: rgba(56, 189, 248, 0.1);
      padding: 2px 8px; border-radius: 6px;
    }
    .time-ago { font-size: 0.75rem; color: var(--text-muted); }

    .inbox-actions-hint { display: flex; align-items: center; }
    .btn-convert-hint {
      font-size: 0.78rem; font-weight: 600; padding: 4px 10px; border-radius: 6px;
      background: rgba(99, 102, 241, 0.12); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.3);
      white-space: nowrap;
    }
    .inbox-item-card:hover .btn-convert-hint { background: rgba(99, 102, 241, 0.25); color: #fff; }

    /* Estados Vacíos */
    .empty-section-state {
      padding: 36px 20px; text-align: center; border-radius: var(--radius-md, 12px);
      display: flex; flex-direction: column; align-items: center; gap: 8px;
    }
    .empty-icon { font-size: 2.2rem; margin-bottom: 4px; }
    .empty-section-state h3 { font-size: 1.05rem; font-weight: 600; color: var(--text-primary); margin: 0; }
    .empty-section-state p { font-size: 0.85rem; color: var(--text-secondary); margin: 0; max-width: 320px; }
    .empty-action-link {
      margin-top: 6px; font-size: 0.82rem; font-weight: 600; color: var(--primary, #6366f1);
      padding: 6px 12px; border-radius: 6px; background: rgba(99, 102, 241, 0.1);
      transition: background 0.2s;
    }
    .empty-action-link:hover { background: rgba(99, 102, 241, 0.2); }

    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class InicioComponent implements OnInit {
  readonly inboxService = inject(InboxService);
  readonly tareaService = inject(TareaService);
  readonly eventoService = inject(EventoService);
  readonly espacioService = inject(EspacioService);
  readonly notaService = inject(NotaService);
  private readonly router = inject(Router);

  readonly espacios = this.espacioService.espacios;

  // Estado para Modales (T-10.1)
  tareaSeleccionada: Tarea | null = null;
  tareaParaEditar: Tarea | null = null;
  isDetalleTareaModalOpen = false;
  isEditarTareaModalOpen = false;

  eventoSeleccionado: Evento | null = null;
  eventoParaEditar: Evento | null = null;
  isDetalleEventoModalOpen = false;
  isEditarEventoModalOpen = false;

  inboxItemSeleccionado: InboxItem | null = null;
  isConvertInboxModalOpen = false;

  // Criterio 1 (R-18): Últimas 5 capturas del Inbox pendientes de organizar
  readonly capturasInboxRecientes = computed(() => {
    const pendientes = this.inboxService.pendientes();
    return [...pendientes]
      .sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime())
      .slice(0, 5);
  });

  readonly todasLasTareas = signal<Tarea[]>([]);

  // Criterio 2: Tareas Pendiente o En progreso ordenadas por prioridad y fecha límite
  readonly tareasPendientes = computed(() => {
    const todas = this.todasLasTareas().length > 0 ? this.todasLasTareas() : this.tareaService.tareas();
    const activas = todas.filter(t => t.estado === 'Pendiente' || t.estado === 'En progreso');

    const prioridadPeso: Record<string, number> = {
      'Urgente': 1,
      'Normal': 2,
      'Baja': 3
    };

    return [...activas].sort((a, b) => {
      // 1. Prioridad
      const pesoA = prioridadPeso[a.prioridad] ?? 4;
      const pesoB = prioridadPeso[b.prioridad] ?? 4;
      if (pesoA !== pesoB) {
        return pesoA - pesoB;
      }

      // 2. Fecha límite (las más próximas primero; sin fecha al final)
      const fechaA = this.getFechaLimite(a);
      const fechaB = this.getFechaLimite(b);

      if (fechaA && fechaB) {
        return new Date(fechaA).getTime() - new Date(fechaB).getTime();
      }
      if (fechaA && !fechaB) return -1;
      if (!fechaA && fechaB) return 1;
      return 0;
    });
  });

  // Criterio 3: Próximos eventos (fechaInicio >= hoy), ordenados cronológicamente
  readonly proximosEventos = computed(() => {
    const todos = this.eventoService.eventos();
    const hoyInicio = new Date();
    hoyInicio.setHours(0, 0, 0, 0);
    const hoyMs = hoyInicio.getTime();

    return [...todos]
      .filter(e => {
        try {
          return new Date(e.fechaInicio).getTime() >= hoyMs;
        } catch {
          return false;
        }
      })
      .sort((a, b) => new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime());
  });

  async cargarTareas(): Promise<void> {
    try {
      const list = await this.tareaService.getAll();
      this.todasLasTareas.set(list);
    } catch {
      this.todasLasTareas.set([]);
    }
  }

  async ngOnInit(): Promise<void> {
    await Promise.all([
      this.inboxService.refresh(),
      this.cargarTareas(),
      this.eventoService.cargarEventos(),
      this.espacioService.loadAll()
    ]);
  }

  getEspacio(id?: number | null): Espacio | null {
    if (!id) return null;
    return this.espacios().find(e => e.id === id) || null;
  }

  getFechaLimite(t: Tarea): string | null {
    return t.fechaLimite ?? t.fechaLímite ?? null;
  }

  isVencida(t: Tarea): boolean {
    const fl = this.getFechaLimite(t);
    if (!fl || t.estado === 'Completada' || t.estado === 'Cancelada') return false;
    return new Date(fl).getTime() < Date.now();
  }

  getPrioridadIcon(prio: string): string {
    switch (prio) {
      case 'Urgente': return '🔴';
      case 'Normal': return '🟡';
      case 'Baja': return '🟢';
      default: return '⚪';
    }
  }

  sanitizeClassName(text: string): string {
    return text.toLowerCase().replace(/\s+/g, '-');
  }

  recortarTexto(texto: string, maxLen: number): string {
    if (!texto) return '';
    return texto.length > maxLen ? `${texto.slice(0, maxLen)}...` : texto;
  }

  formatFecha(fechaIso: string): string {
    try {
      const d = new Date(fechaIso);
      return isNaN(d.getTime()) ? '' : d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
    } catch {
      return '';
    }
  }

  formatFechaHora(fechaIso: string): string {
    try {
      const d = new Date(fechaIso);
      return isNaN(d.getTime()) ? '' : d.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  }

  formatFechaRelativa(fechaIso: string): string {
    try {
      const d = new Date(fechaIso);
      const diffMs = Date.now() - d.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return 'Hace un momento';
      if (diffMin < 60) return `Hace ${diffMin} min`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `Hace ${diffHours} h`;
      const diffDays = Math.floor(diffHours / 24);
      return `Hace ${diffDays} d`;
    } catch {
      return '';
    }
  }

  // ==========================================
  // Navegación / Detalle de Elementos (T-10.1)
  // ==========================================

  onVerDetalleTarea(tarea: Tarea): void {
    this.tareaSeleccionada = tarea;
    this.isDetalleTareaModalOpen = true;
  }

  cerrarDetalleTarea(): void {
    this.isDetalleTareaModalOpen = false;
    this.tareaSeleccionada = null;
  }

  abrirEditarTarea(tarea: Tarea): void {
    this.cerrarDetalleTarea();
    this.tareaParaEditar = tarea;
    this.isEditarTareaModalOpen = true;
  }

  cerrarEditarTarea(): void {
    this.isEditarTareaModalOpen = false;
    this.tareaParaEditar = null;
  }

  async guardarTareaEditada(datos: TareaCreateDto | Partial<Tarea>): Promise<void> {
    if (this.tareaParaEditar?.id) {
      await this.tareaService.update(this.tareaParaEditar.id, datos);
      this.cerrarEditarTarea();
      await this.cargarTareas();
    }
  }

  async eliminarTarea(tarea: Tarea): Promise<void> {
    if (tarea.id) {
      await this.tareaService.delete(tarea.id);
      this.cerrarDetalleTarea();
      await this.cargarTareas();
    }
  }

  async cambiarEstadoTarea(evt: { id: number; nuevoEstado: EstadoTarea }): Promise<void> {
    await this.tareaService.cambiarEstado(evt.id, evt.nuevoEstado);
    if (this.tareaSeleccionada && this.tareaSeleccionada.id === evt.id) {
      this.tareaSeleccionada = { ...this.tareaSeleccionada, estado: evt.nuevoEstado };
    }
    await this.cargarTareas();
  }

  onVerDetalleEvento(evento: Evento): void {
    this.eventoSeleccionado = evento;
    this.isDetalleEventoModalOpen = true;
  }

  cerrarDetalleEvento(): void {
    this.isDetalleEventoModalOpen = false;
    this.eventoSeleccionado = null;
  }

  abrirEditarEvento(evento: Evento): void {
    this.cerrarDetalleEvento();
    this.eventoParaEditar = evento;
    this.isEditarEventoModalOpen = true;
  }

  cerrarEditarEvento(): void {
    this.isEditarEventoModalOpen = false;
    this.eventoParaEditar = null;
  }

  async guardarEventoEditado(datos: EventoCreateDto | Partial<Evento>): Promise<void> {
    if (this.eventoParaEditar?.id) {
      await this.eventoService.update(this.eventoParaEditar.id, datos);
      this.cerrarEditarEvento();
      await this.eventoService.cargarEventos();
    }
  }

  async eliminarEvento(evento: Evento): Promise<void> {
    if (evento.id) {
      await this.eventoService.delete(evento.id);
      this.cerrarDetalleEvento();
      await this.eventoService.cargarEventos();
    }
  }

  onOrganizarCaptura(item: InboxItem): void {
    this.inboxItemSeleccionado = item;
    this.isConvertInboxModalOpen = true;
  }

  cerrarConvertInbox(): void {
    this.isConvertInboxModalOpen = false;
    this.inboxItemSeleccionado = null;
  }

  async convertirCapturaANota(event: { itemId: number; nota: Omit<Nota, 'id' | 'fechaCreacion' | 'fechaActualizacion'> }): Promise<void> {
    await this.notaService.create(event.nota);
    await this.inboxService.marcarOrganizado(event.itemId);
    this.cerrarConvertInbox();
    await this.inboxService.refresh();
  }

  async convertirCapturaATarea(event: { itemId: number; tarea: TareaCreateDto }): Promise<void> {
    await this.tareaService.create(event.tarea);
    await this.inboxService.marcarOrganizado(event.itemId);
    this.cerrarConvertInbox();
    await this.inboxService.refresh();
    await this.cargarTareas();
  }
}
