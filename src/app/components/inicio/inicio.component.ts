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

// Modales de Detalle y Edicion
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
      <!-- Encabezado del Dashboard Ejecutivo -->
      <header class="view-header">
        <div class="header-content">
          <div class="header-status-pill">
            <span class="status-pulse-dot"></span>
            <span class="status-pill-text">Segundo cerebro activo</span>
          </div>
          <h1 class="view-title">Inicio</h1>
          <p class="view-subtitle">Resumen ejecutivo y flujo de trabajo: tareas prioritarias, eventos y capturas pendientes.</p>
        </div>
      </header>

      <!-- SECCION ACCESOS RAPIDOS -->
      <section class="quick-access-section" id="section-accesos-rapidos">
        <h2 class="section-title">Accesos Rapidos</h2>
        <div class="quick-grid">
          <a routerLink="/inbox" class="quick-card glass" id="quicklink-inbox">
            <div class="quick-icon-wrap" style="background: rgba(129, 140, 248, 0.12); color: #818cf8;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>
            </div>
            <div class="quick-text">
              <span class="quick-name">Inbox</span>
              <small>{{ inboxService.totalPendientes() }} pendiente{{ inboxService.totalPendientes() === 1 ? '' : 's' }}</small>
            </div>
            <span class="quick-arrow">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </span>
          </a>

          <a routerLink="/notas" class="quick-card glass" id="quicklink-notas">
            <div class="quick-icon-wrap" style="background: rgba(251, 191, 36, 0.12); color: #fbbf24;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
            </div>
            <div class="quick-text">
              <span class="quick-name">Notas</span>
              <small>{{ notaService.notas().length }} nota{{ notaService.notas().length === 1 ? '' : 's' }}</small>
            </div>
            <span class="quick-arrow">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </span>
          </a>

          <a routerLink="/tareas" class="quick-card glass" id="quicklink-tareas">
            <div class="quick-icon-wrap" style="background: rgba(52, 211, 153, 0.12); color: #34d399;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 12 2 2 4-4"/></svg>
            </div>
            <div class="quick-text">
              <span class="quick-name">Tareas</span>
              <small>{{ tareasPendientes().length }} activa{{ tareasPendientes().length === 1 ? '' : 's' }}</small>
            </div>
            <span class="quick-arrow">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </span>
          </a>

          <a routerLink="/eventos" class="quick-card glass" id="quicklink-eventos">
            <div class="quick-icon-wrap" style="background: rgba(56, 189, 248, 0.12); color: #38bdf8;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <div class="quick-text">
              <span class="quick-name">Eventos</span>
              <small>{{ proximosEventos().length }} proximo{{ proximosEventos().length === 1 ? '' : 's' }}</small>
            </div>
            <span class="quick-arrow">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </span>
          </a>
        </div>
      </section>

      <!-- RESUMEN DE INFORMACION -->
      <div class="dashboard-columns">
        <!-- Columna 1: Tareas Pendientes y En Progreso -->
        <section class="summary-section" id="section-tareas-pendientes">
          <div class="section-header">
            <div class="header-left">
              <span class="section-icon-box">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 12 2 2 4-4"/></svg>
              </span>
              <h2 class="section-title">Tareas Activas</h2>
              <span class="count-pill">{{ tareasPendientes().length }}</span>
            </div>
            <a routerLink="/tareas" class="section-link" id="link-ver-todas-tareas">
              <span>Ver todas</span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </a>
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
                        <span class="prio-dot"></span>
                        {{ tarea.prioridad }}
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
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        Limite: {{ formatFecha(fl) }}
                        @if (isVencida(tarea)) {
                          <span class="vencida-badge">Vencida</span>
                        }
                      </div>
                    }
                  </div>
                  <span class="item-action-hint">
                    <span>Detalles</span>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
                  </span>
                </button>
              }
            </div>
          } @else {
            <div class="empty-section-state glass" id="empty-tareas">
              <div class="empty-icon-wrap">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
                  <path d="m9 12 2 2 4-4"/>
                </svg>
              </div>
              <h3>Todas las tareas al dia</h3>
              <p>No tienes tareas pendientes ni en progreso. Tu backlog de actividades esta completamente despejado.</p>
              <a routerLink="/tareas" class="empty-action-link">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Crear nueva tarea
              </a>
            </div>
          }
        </section>

        <!-- Columna 2: Proximos Eventos y Capturas Recientes -->
        <div class="secondary-columns">
          <!-- Subseccion: Proximos Eventos -->
          <section class="summary-section" id="section-proximos-eventos">
            <div class="section-header">
              <div class="header-left">
                <span class="section-icon-box">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </span>
                <h2 class="section-title">Proximos Eventos</h2>
                <span class="count-pill">{{ proximosEventos().length }}</span>
              </div>
              <a routerLink="/eventos" class="section-link" id="link-ver-todos-eventos">
                <span>Agenda</span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              </a>
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
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          {{ formatFechaHora(evento.fechaInicio) }}
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
                    <span class="item-action-hint">
                      <span>Ver</span>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
                    </span>
                  </button>
                }
              </div>
            } @else {
              <div class="empty-section-state glass" id="empty-eventos">
                <div class="empty-icon-wrap">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </div>
                <h3>Sin eventos programados</h3>
                <p>No hay eventos proximos en tu agenda para hoy ni dias posteriores.</p>
                <a routerLink="/eventos" class="empty-action-link">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Agendar evento
                </a>
              </div>
            }
          </section>

          <!-- Subseccion: Ultimas capturas del Inbox -->
          <section class="summary-section" id="section-inbox-reciente">
            <div class="section-header">
              <div class="header-left">
                <span class="section-icon-box">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>
                </span>
                <h2 class="section-title">Capturas Recientes</h2>
                <span class="count-pill">{{ capturasInboxRecientes().length }} / 5</span>
              </div>
              <a routerLink="/inbox" class="section-link" id="link-ver-todo-inbox">
                <span>Procesar Inbox</span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              </a>
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
                        <span class="time-ago">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          {{ formatFechaRelativa(item.fechaCreacion) }}
                        </span>
                      </div>
                      <h3 class="item-title">{{ item.titulo }}</h3>
                      @if (item.descripcion) {
                        <p class="item-desc">{{ recortarTexto(item.descripcion, 90) }}</p>
                      }
                    </div>
                    <div class="inbox-actions-hint">
                      <span class="btn-convert-hint">
                        <span>Organizar</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
                      </span>
                    </div>
                  </button>
                }
              </div>
            } @else {
              <div class="empty-section-state glass" id="empty-inbox">
                <div class="empty-icon-wrap">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
                    <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
                  </svg>
                </div>
                <h3>Inbox despejado</h3>
                <p>No tienes capturas pendientes de organizar. Todo tu flujo mental esta clasificado.</p>
                <a routerLink="/inbox" class="empty-action-link">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Captura rapida
                </a>
              </div>
            }
          </section>
        </div>
      </div>

      <!-- MODALES DE DETALLE Y GESTION -->
      <app-tarea-detalle-modal
        [visible]="isDetalleTareaModalOpen"
        [tarea]="tareaSeleccionada"
        [espacio]="getEspacio(tareaSeleccionada?.espacioId)"
        (cerrar)="cerrarDetalleTarea()"
        (editar)="abrirEditarTarea($event)"
        (eliminar)="eliminarTarea($event)"
        (cambiarEstado)="cambiarEstadoTarea($event)"
      />

      <app-tarea-modal
        [visible]="isEditarTareaModalOpen"
        [tarea]="tareaParaEditar"
        [espacios]="espacios()"
        (guardar)="guardarTareaEditada($event)"
        (cancelar)="cerrarEditarTarea()"
      />

      <app-evento-detalle-modal
        [visible]="isDetalleEventoModalOpen"
        [evento]="eventoSeleccionado"
        [espacio]="getEspacio(eventoSeleccionado?.espacioId)"
        (cerrar)="cerrarDetalleEvento()"
        (editar)="abrirEditarEvento($event)"
        (eliminar)="eliminarEvento($event)"
      />

      <app-evento-modal
        [visible]="isEditarEventoModalOpen"
        [evento]="eventoParaEditar"
        [espacios]="espacios()"
        (guardar)="guardarEventoEditado($event)"
        (cancelar)="cerrarEditarEvento()"
      />

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
    .view-container {
      display: flex;
      flex-direction: column;
      gap: 28px;
      animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .view-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 6px;
    }

    .header-status-pill {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 4px 12px;
      border-radius: var(--radius-full, 9999px);
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      box-shadow: var(--shadow-sm);
      margin-bottom: 12px;
    }

    .status-pulse-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
    }

    .status-pill-text {
      font-size: 0.74rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--text-secondary, #a1a1aa);
    }

    .view-title {
      font-size: 2rem;
      font-weight: 700;
      color: var(--text-primary, #f4f4f5);
      letter-spacing: -0.025em;
      line-height: 1.15;
      margin: 0;
    }

    .view-subtitle {
      color: var(--text-secondary, #a1a1aa);
      margin-top: 6px;
      font-size: 0.92rem;
      max-width: 620px;
      line-height: 1.5;
    }

    /* Accesos Rapidos */
    .quick-access-section {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .section-title {
      font-size: 1.05rem;
      font-weight: 600;
      color: var(--text-primary, #f4f4f5);
      letter-spacing: -0.01em;
      margin: 0;
    }

    .quick-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr));
      gap: 12px;
    }

    .quick-card {
      padding: 14px 16px;
      border-radius: var(--radius-md, 14px);
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      box-shadow: var(--shadow-sm);
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
      transition: all var(--transition-fast, 0.15s ease);
      min-width: 0;
    }

    .quick-card:hover {
      transform: translateY(-2px);
      background: var(--bg-surface-hover);
      border-color: var(--border-focus);
      box-shadow: var(--shadow-md);
    }

    .quick-icon-wrap {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-sm, 8px);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .quick-text {
      display: flex;
      flex-direction: column;
      flex: 1;
      gap: 2px;
    }

    .quick-name {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--text-primary, #f4f4f5);
    }

    .quick-text small {
      font-size: 0.78rem;
      color: var(--text-muted, #71717a);
    }

    .quick-arrow {
      color: var(--text-muted, #71717a);
      display: flex;
      align-items: center;
      transition: transform 0.2s, color 0.2s;
    }

    .quick-card:hover .quick-arrow {
      transform: translateX(3px);
      color: var(--text-primary, #f4f4f5);
    }

    /* Columnas de Resumen */
    .dashboard-columns {
      display: grid;
      grid-template-columns: 1.18fr 0.82fr;
      gap: 24px;
      align-items: start;
    }

    @media (max-width: 1024px) {
      .dashboard-columns {
        grid-template-columns: 1fr;
        gap: 20px;
      }
    }

    .secondary-columns {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .summary-section {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 9px;
    }

    .section-icon-box {
      width: 28px;
      height: 28px;
      border-radius: var(--radius-xs, 6px);
      background: var(--primary-subtle);
      border: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-primary);
    }

    .count-pill {
      font-size: 0.72rem;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: var(--radius-full, 9999px);
      background: var(--primary-subtle);
      color: var(--text-secondary);
      border: 1px solid var(--border-color);
    }

    .section-link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.82rem;
      font-weight: 500;
      color: var(--text-secondary, #a1a1aa);
      text-decoration: none;
      transition: color 0.2s;
    }

    .section-link:hover {
      color: var(--text-primary, #f4f4f5);
    }

    /* Lista de Items */
    .items-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .item-card {
      width: 100%;
      text-align: left;
      font-family: inherit;
      color: inherit;
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      box-shadow: var(--shadow-sm);
      padding: 14px 16px;
      border-radius: var(--radius-md, 12px);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 14px;
      transition: all 0.15s ease;
    }

    .item-card.clickable { cursor: pointer; }
    .item-card.clickable:hover {
      transform: translateY(-1px);
      border-color: var(--border-focus);
      background: var(--bg-surface-hover);
      box-shadow: var(--shadow-md);
    }

    .item-main {
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex: 1;
      min-width: 0;
    }

    .item-header {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .item-title {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--text-primary, #f4f4f5);
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .item-desc {
      font-size: 0.82rem;
      color: var(--text-secondary, #a1a1aa);
      margin: 0;
      line-height: 1.4;
    }

    .item-date {
      font-size: 0.76rem;
      color: var(--text-muted, #71717a);
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }

    .item-date.vencida {
      color: #f43f5e;
      font-weight: 600;
    }

    .vencida-badge {
      background: rgba(244, 63, 94, 0.15);
      color: #fb7185;
      padding: 1px 6px;
      border-radius: 4px;
      font-size: 0.7rem;
    }

    .item-action-hint {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.78rem;
      font-weight: 500;
      color: var(--text-muted, #71717a);
      white-space: nowrap;
      transition: color 0.2s;
    }

    .item-card:hover .item-action-hint {
      color: var(--text-primary, #f4f4f5);
    }

    /* Badges & Tags */
    .prio-tag {
      font-size: 0.72rem;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }

    .prio-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
    }

    .prio-urgente {
      background: rgba(244, 63, 94, 0.12);
      color: #fb7185;
      border: 1px solid rgba(244, 63, 94, 0.25);
    }
    .prio-urgente .prio-dot { background: #fb7185; }

    .prio-normal {
      background: rgba(245, 158, 11, 0.12);
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.25);
    }
    .prio-normal .prio-dot { background: #fbbf24; }

    .prio-baja {
      background: rgba(16, 185, 129, 0.12);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.25);
    }
    .prio-baja .prio-dot { background: #34d399; }

    .state-tag {
      font-size: 0.72rem;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-secondary, #a1a1aa);
      border: 1px solid rgba(255, 255, 255, 0.06);
    }

    .state-pendiente { color: #fbbf24; }
    .state-en-progreso { color: #38bdf8; }

    .space-tag {
      font-size: 0.75rem;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }

    .space-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }

    .event-time-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 0.76rem;
      font-weight: 500;
      color: #38bdf8;
      background: rgba(56, 189, 248, 0.1);
      border: 1px solid rgba(56, 189, 248, 0.2);
      padding: 2px 8px;
      border-radius: 6px;
    }

    .time-ago {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 0.74rem;
      color: var(--text-muted, #71717a);
    }

    .inbox-actions-hint { display: flex; align-items: center; }
    .btn-convert-hint {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.76rem;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 6px;
      background: var(--primary-subtle);
      color: var(--text-primary);
      border: 1px solid var(--border-color);
      white-space: nowrap;
      transition: all 0.15s;
    }

    .inbox-item-card:hover .btn-convert-hint {
      background: rgba(255, 255, 255, 0.12);
      color: #fff;
    }

    /* Estados Vacios Ejecutivos */
    .empty-section-state {
      padding: 24px 20px;
      text-align: center;
      border-radius: var(--radius-md, 12px);
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      box-shadow: var(--shadow-sm);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .empty-icon-wrap {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: var(--primary-subtle);
      border: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-primary);
      margin-bottom: 2px;
    }

    .empty-section-state h3 {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--text-primary, #f4f4f5);
      letter-spacing: -0.01em;
      margin: 0;
    }

    .empty-section-state p {
      font-size: 0.82rem;
      color: var(--text-secondary, #a1a1aa);
      margin: 0;
      max-width: 320px;
      line-height: 1.4;
    }

    .empty-action-link {
      margin-top: 4px;
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--text-primary);
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: var(--radius-full, 9999px);
      background: var(--primary-subtle);
      border: 1px solid var(--border-color);
      text-decoration: none;
      transition: all 0.15s;
    }

    .empty-action-link:hover {
      background: var(--bg-surface-hover);
      border-color: var(--border-focus);
      transform: translateY(-1px);
    }
`]
})
export class InicioComponent implements OnInit {
  readonly inboxService = inject(InboxService);
  readonly tareaService = inject(TareaService);
  readonly eventoService = inject(EventoService);
  readonly espacioService = inject(EspacioService);
  readonly notaService = inject(NotaService);
  readonly router = inject(Router);

  readonly espacios = this.espacioService.espacios;

  isDetalleTareaModalOpen = false;
  isEditarTareaModalOpen = false;
  tareaSeleccionada: Tarea | null = null;
  tareaParaEditar: Tarea | null = null;

  isDetalleEventoModalOpen = false;
  isEditarEventoModalOpen = false;
  eventoSeleccionado: Evento | null = null;
  eventoParaEditar: Evento | null = null;

  inboxItemSeleccionado: InboxItem | null = null;
  isConvertInboxModalOpen = false;

  // Criterio 1: Ultimas 5 capturas del Inbox pendientes de organizar
  readonly capturasInboxRecientes = computed(() => {
    const pendientes = this.inboxService.pendientes();
    return [...pendientes]
      .sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime())
      .slice(0, 5);
  });

  readonly todasLasTareas = signal<Tarea[]>([]);

  // Criterio 2: Tareas Pendiente o En progreso ordenadas por prioridad y fecha limite
  readonly tareasPendientes = computed(() => {
    const todas = this.todasLasTareas().length > 0 ? this.todasLasTareas() : this.tareaService.tareas();
    const activas = todas.filter(t => t.estado === 'Pendiente' || t.estado === 'En progreso');

    const prioridadPeso: Record<string, number> = {
      'Urgente': 1,
      'Normal': 2,
      'Baja': 3
    };

    return [...activas].sort((a, b) => {
      const pesoA = prioridadPeso[a.prioridad] ?? 4;
      const pesoB = prioridadPeso[b.prioridad] ?? 4;
      if (pesoA !== pesoB) {
        return pesoA - pesoB;
      }

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

  // Criterio 3: Proximos eventos (fechaInicio >= hoy), ordenados cronologicamente
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
    return t.fechaLimite ?? (t as any).fechaLímite ?? null;
  }

  isVencida(t: Tarea): boolean {
    const fl = this.getFechaLimite(t);
    if (!fl || t.estado === 'Completada' || t.estado === 'Cancelada') return false;
    return new Date(fl).getTime() < Date.now();
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

  // Navegacion / Detalle de Elementos
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
