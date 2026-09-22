import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TareaService } from '../../services/tarea.service';
import { EspacioService } from '../../services/espacio.service';
import { Tarea, Espacio, EstadoTarea } from '../../models';
import { TareaModalComponent } from './tarea-modal.component';
import { TareaDetalleModalComponent } from './tarea-detalle-modal.component';
import { TareaDeleteModalComponent } from './tarea-delete-modal.component';
import { TareaCreateDto } from '../../repositories/tarea.repository';

@Component({
  selector: 'app-tareas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TareaModalComponent,
    TareaDetalleModalComponent,
    TareaDeleteModalComponent
  ],
  template: `
    <div class="view-container" id="view-tareas">
      <!-- Encabezado con Espacio Activo y Acción Principal -->
      <header class="view-header">
        <div class="header-main">
          <div class="header-badge-row">
            <span class="badge">Acción</span>
            @if (espacioActivo()) {
              <span class="espacio-active-badge">
                <span class="espacio-dot" [style.background-color]="espacioActivo()?.color"></span>
                Espacio: <strong>{{ espacioActivo()?.nombre }}</strong>
              </span>
            }
          </div>
          <h1 class="view-title">Tareas ✅</h1>
          <p class="view-subtitle">
            Acciones pendientes organizadas por prioridad y fecha límite en tu espacio actual.
          </p>
        </div>

        <div class="header-actions">
          <!-- Selector de Espacio Activo -->
          <div class="space-selector-wrapper">
            <label for="select-espacio-activo" class="sr-only">Seleccionar Espacio Activo</label>
            <select
              id="select-espacio-activo"
              class="space-select"
              [ngModel]="tareaService.espacioActivoId()"
              (ngModelChange)="onCambiarEspacio($event)"
            >
              @for (esp of espacios(); track esp.id) {
                <option [ngValue]="esp.id">
                  {{ esp.esSistema ? '🛡️ ' : '📁 ' }}{{ esp.nombre }}
                </option>
              }
            </select>
          </div>

          <button
            type="button"
            class="btn-primary-action"
            id="btn-nueva-tarea"
            (click)="openCreateModal()"
          >
            <span class="btn-icon">➕</span>
            Nueva Tarea
          </button>
        </div>
      </header>

      <!-- Barra de Filtros por Categoría -->
      @if (tareaService.categorias().length > 0) {
        <nav class="category-nav" aria-label="Filtro por categorías">
          <button
            type="button"
            class="cat-chip"
            [class.active]="tareaService.categoriaSeleccionada() === null"
            (click)="onFiltrarCategoria(null)"
          >
            Todas ({{ tareaService.tareas().length }})
          </button>
          @for (cat of tareaService.categorias(); track cat) {
            <button
              type="button"
              class="cat-chip"
              [class.active]="tareaService.categoriaSeleccionada() === cat"
              (click)="onFiltrarCategoria(cat)"
            >
              🏷️ {{ cat }}
            </button>
          }
        </nav>
      }

      <!-- SECCIÓN PRINCIPAL: TAREAS ACTIVAS (Pendiente / En progreso) -->
      <section class="tasks-section" aria-labelledby="section-active-title">
        <div class="section-header">
          <h2 id="section-active-title" class="section-title">
            🎯 Tareas Activas
            <span class="count-badge">{{ tareaService.tareasActivas().length }}</span>
          </h2>
          <span class="section-hint">Ordenadas por prioridad (Urgente primero) y fecha límite</span>
        </div>

        @if (tareaService.tareasActivas().length > 0) {
          <div class="task-list">
            @for (tarea of tareaService.tareasActivas(); track tarea.id) {
              <article
                class="task-card glass"
                [class]="'prio-border-' + tarea.prioridad.toLowerCase()"
                (click)="openDetailModal(tarea)"
                tabindex="0"
                (keydown.enter)="openDetailModal(tarea)"
                (keydown.space)="openDetailModal(tarea)"
                role="button"
                [attr.aria-label]="'Ver detalle de ' + tarea.titulo"
              >
                <!-- Quick Status Control (T-05.4) -->
                <div class="task-quick-status">
                  <label [for]="'quick-estado-' + tarea.id" class="sr-only">Cambiar estado de {{ tarea.titulo }}</label>
                  <select
                    [id]="'quick-estado-' + tarea.id"
                    class="quick-estado-select"
                    [class]="'status-' + sanitizeClassName(tarea.estado)"
                    [ngModel]="tarea.estado"
                    (click)="$event.stopPropagation()"
                    (ngModelChange)="onCambiarEstado(tarea, $event)"
                  >
                    <option value="Pendiente">⏳ Pendiente</option>
                    <option value="En progreso">⚡ En progreso</option>
                    <option value="Completada">✅ Completada</option>
                    <option value="Cancelada">❌ Cancelada</option>
                  </select>
                </div>

                <!-- Info central -->
                <div class="task-info">
                  <div class="task-badges">
                    <span class="badge-priority" [class]="'prio-' + tarea.prioridad.toLowerCase()">
                      {{ getPrioridadIcon(tarea.prioridad) }} {{ tarea.prioridad }}
                    </span>
                    @if (tarea.categoria) {
                      <span class="badge-category">🏷️ {{ tarea.categoria }}</span>
                    }
                    @if (getFechaLimite(tarea)) {
                      <span class="badge-deadline" [class.vencida]="isVencida(tarea)">
                        ⏰ {{ formatFechaCorta(getFechaLimite(tarea)) }}
                        @if (isVencida(tarea)) {
                          <strong>!</strong>
                        }
                      </span>
                    }
                  </div>

                  <h3 class="task-title">{{ tarea.titulo }}</h3>

                  @if (tarea.descripcion) {
                    <p class="task-desc-excerpt">{{ tarea.descripcion }}</p>
                  }
                </div>

                <!-- Acciones de tarjeta -->
                <div class="task-actions">
                  <button
                    type="button"
                    class="btn-icon-action"
                    [id]="'btn-edit-tarea-' + tarea.id"
                    (click)="$event.stopPropagation(); openEditModal(tarea)"
                    title="Editar tarea"
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    class="btn-icon-action btn-delete"
                    [id]="'btn-delete-tarea-' + tarea.id"
                    (click)="$event.stopPropagation(); openDeleteModal(tarea)"
                    title="Eliminar tarea"
                  >
                    🗑️
                  </button>
                </div>
              </article>
            }
          </div>
        } @else {
          <div class="empty-state glass">
            <div class="empty-icon">🎉</div>
            <h3>Sin tareas activas</h3>
            <p>No tienes tareas pendientes o en progreso en este espacio. ¡Todo al día!</p>
            <button
              type="button"
              class="btn-empty-action"
              (click)="openCreateModal()"
            >
              ➕ Crear nueva tarea
            </button>
          </div>
        }
      </section>

      <!-- SECCIÓN SEPARADA: TAREAS FINALIZADAS (Completada / Cancelada) (D-04) -->
      <section class="tasks-section finalized-section" aria-labelledby="section-finalized-title">
        <header class="section-header collapsable-header">
          <button
            type="button"
            class="collapse-toggle-btn"
            (click)="toggleFinalizadas()"
            [attr.aria-expanded]="showFinalizadas()"
          >
            <span class="collapse-icon">{{ showFinalizadas() ? '▼' : '▶' }}</span>
            <h2 id="section-finalized-title" class="section-title">
              🏁 Tareas Finalizadas
              <span class="count-badge muted">{{ tareaService.tareasFinalizadas().length }}</span>
            </h2>
          </button>
          <span class="section-hint">Completadas y canceladas</span>
        </header>

        @if (showFinalizadas()) {
          @if (tareaService.tareasFinalizadas().length > 0) {
            <div class="task-list finalized-list">
              @for (tarea of tareaService.tareasFinalizadas(); track tarea.id) {
                <article
                  class="task-card glass finalized-card"
                  (click)="openDetailModal(tarea)"
                  tabindex="0"
                  (keydown.enter)="openDetailModal(tarea)"
                  (keydown.space)="openDetailModal(tarea)"
                  role="button"
                  [attr.aria-label]="'Ver detalle de ' + tarea.titulo"
                >
                  <!-- Quick Status Control -->
                  <div class="task-quick-status">
                    <label [for]="'quick-estado-fin-' + tarea.id" class="sr-only">Cambiar estado de {{ tarea.titulo }}</label>
                    <select
                      [id]="'quick-estado-fin-' + tarea.id"
                      class="quick-estado-select"
                      [class]="'status-' + sanitizeClassName(tarea.estado)"
                      [ngModel]="tarea.estado"
                      (click)="$event.stopPropagation()"
                      (ngModelChange)="onCambiarEstado(tarea, $event)"
                    >
                      <option value="Pendiente">⏳ Pendiente</option>
                      <option value="En progreso">⚡ En progreso</option>
                      <option value="Completada">✅ Completada</option>
                      <option value="Cancelada">❌ Cancelada</option>
                    </select>
                  </div>

                  <!-- Info central -->
                  <div class="task-info">
                    <div class="task-badges">
                      <span class="badge-status" [class]="'badge-' + sanitizeClassName(tarea.estado)">
                        {{ tarea.estado === 'Completada' ? '✅ Completada' : '❌ Cancelada' }}
                      </span>
                      @if (tarea.categoria) {
                        <span class="badge-category">🏷️ {{ tarea.categoria }}</span>
                      }
                    </div>

                    <h3 class="task-title strike">{{ tarea.titulo }}</h3>
                  </div>

                  <!-- Acciones de tarjeta -->
                  <div class="task-actions">
                    <button
                      type="button"
                      class="btn-icon-action"
                      [id]="'btn-edit-fin-tarea-' + tarea.id"
                      (click)="$event.stopPropagation(); openEditModal(tarea)"
                      title="Editar tarea"
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      class="btn-icon-action btn-delete"
                      [id]="'btn-delete-fin-tarea-' + tarea.id"
                      (click)="$event.stopPropagation(); openDeleteModal(tarea)"
                      title="Eliminar tarea"
                    >
                      🗑️
                    </button>
                  </div>
                </article>
              }
            </div>
          } @else {
            <div class="empty-state-small glass">
              <p>No hay tareas completadas o canceladas en este espacio.</p>
            </div>
          }
        }
      </section>

      <!-- Modales -->
      <app-tarea-modal
        [visible]="isModalOpen"
        [tarea]="selectedTarea"
        [espacioActivoId]="tareaService.espacioActivoId()"
        [espacios]="espacios()"
        (guardar)="onGuardarTarea($event)"
        (cancelar)="closeModal()"
      ></app-tarea-modal>

      <app-tarea-detalle-modal
        [visible]="isDetailOpen"
        [tarea]="selectedTarea"
        [espacio]="getEspacioDeTarea(selectedTarea)"
        (cerrar)="closeDetailModal()"
        (editar)="onEditarDesdeDetalle($event)"
        (eliminar)="onEliminarDesdeDetalle($event)"
        (cambiarEstado)="onCambiarEstadoDesdeDetalle($event)"
      ></app-tarea-detalle-modal>

      <app-tarea-delete-modal
        [visible]="isDeleteOpen"
        [tarea]="selectedTarea"
        (confirmar)="onConfirmarEliminar($event)"
        (cancelar)="closeDeleteModal()"
      ></app-tarea-delete-modal>
    </div>
  `,
  styles: [`
    .view-container { display: flex; flex-direction: column; gap: 24px; animation: fadeIn 0.3s ease; }
    .view-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      flex-wrap: wrap; gap: 16px;
    }
    .header-main { display: flex; flex-direction: column; gap: 6px; }
    .header-badge-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .badge {
      display: inline-block; font-size: 0.75rem; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.05em; padding: 4px 10px; border-radius: var(--radius-full);
      background: rgba(244, 63, 94, 0.15); color: #fb7185;
    }
    .espacio-active-badge {
      display: inline-flex; align-items: center; gap: 6px; font-size: 0.8rem;
      color: var(--text-primary); background: rgba(255, 255, 255, 0.06);
      padding: 4px 12px; border-radius: var(--radius-full); border: 1px solid var(--border-color);
    }
    .espacio-dot { width: 8px; height: 8px; border-radius: 50%; }
    .view-title { font-size: 2rem; font-weight: 700; color: var(--text-primary); margin: 0; }
    .view-subtitle { color: var(--text-secondary); font-size: 0.95rem; margin: 0; }
    .header-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .space-selector-wrapper { display: flex; align-items: center; }
    .space-select {
      background: rgba(15, 23, 42, 0.6); border: 1px solid var(--border-color);
      color: var(--text-primary); padding: 10px 14px; border-radius: var(--radius-md, 8px);
      font-size: 0.9rem; font-family: inherit; cursor: pointer; outline: none; transition: all 0.2s;
    }
    .space-select:focus { border-color: var(--primary, #6366f1); box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25); }
    .btn-primary-action {
      display: inline-flex; align-items: center; gap: 8px; padding: 10px 18px;
      background: var(--primary, #6366f1); color: #fff; border: none;
      border-radius: var(--radius-md, 8px); font-weight: 600; font-size: 0.95rem;
      cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
    }
    .btn-primary-action:hover { background: #4f46e5; transform: translateY(-1px); }
    .category-nav {
      display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px;
    }
    .cat-chip {
      padding: 6px 14px; border-radius: var(--radius-full); font-size: 0.85rem; font-weight: 500;
      background: rgba(255, 255, 255, 0.05); color: var(--text-secondary);
      border: 1px solid var(--border-color); cursor: pointer; transition: all 0.2s; white-space: nowrap;
    }
    .cat-chip:hover { background: rgba(255, 255, 255, 0.1); color: var(--text-primary); }
    .cat-chip.active { background: var(--primary, #6366f1); color: #fff; border-color: var(--primary, #6366f1); }
    .tasks-section { display: flex; flex-direction: column; gap: 16px; margin-top: 8px; }
    .section-header {
      display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 8px;
      border-bottom: 1px solid var(--border-color); padding-bottom: 8px;
    }
    .section-title {
      font-size: 1.25rem; font-weight: 700; color: var(--text-primary); margin: 0;
      display: inline-flex; align-items: center; gap: 8px;
    }
    .count-badge {
      font-size: 0.75rem; font-weight: 700; padding: 2px 8px; border-radius: 999px;
      background: var(--primary, #6366f1); color: #fff;
    }
    .count-badge.muted { background: rgba(255, 255, 255, 0.15); color: var(--text-secondary); }
    .section-hint { font-size: 0.8rem; color: var(--text-muted, #94a3b8); }
    .collapsable-header { border-bottom: none; }
    .collapse-toggle-btn {
      display: inline-flex; align-items: center; gap: 10px; background: transparent;
      border: none; cursor: pointer; padding: 0; font-family: inherit; text-align: left;
    }
    .collapse-icon { font-size: 0.85rem; color: var(--text-muted); }
    .task-list { display: flex; flex-direction: column; gap: 10px; }
    .task-card {
      display: flex; align-items: center; gap: 14px; padding: 14px 18px;
      border-radius: var(--radius-md, 10px); border: 1px solid var(--border-color);
      cursor: pointer; transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
    }
    .task-card:hover {
      transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
      border-color: rgba(99, 102, 241, 0.5);
    }
    .task-card.prio-border-urgente { border-left: 4px solid #f43f5e; }
    .task-card.prio-border-normal { border-left: 4px solid #eab308; }
    .task-card.prio-border-baja { border-left: 4px solid #10b981; }
    .task-quick-status { display: flex; align-items: center; }
    .quick-estado-select {
      padding: 6px 10px; border-radius: 6px; font-size: 0.8rem; font-weight: 600;
      border: 1px solid var(--border-color); background: rgba(15, 23, 42, 0.8);
      color: var(--text-primary); cursor: pointer; outline: none;
    }
    .quick-estado-select.status-pendiente { color: #60a5fa; border-color: rgba(59, 130, 246, 0.3); }
    .quick-estado-select.status-en-progreso { color: #c084fc; border-color: rgba(168, 85, 247, 0.3); }
    .quick-estado-select.status-completada { color: #4ade80; border-color: rgba(34, 197, 94, 0.3); }
    .quick-estado-select.status-cancelada { color: #94a3b8; border-color: rgba(148, 163, 184, 0.3); }
    .task-info { flex: 1; display: flex; flex-direction: column; gap: 4px; min-width: 0; }
    .task-badges { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
    .badge-priority {
      font-size: 0.7rem; font-weight: 700; padding: 2px 6px; border-radius: 4px;
    }
    .badge-priority.prio-urgente { background: rgba(244, 63, 94, 0.2); color: #fb7185; }
    .badge-priority.prio-normal { background: rgba(234, 179, 8, 0.2); color: #facc15; }
    .badge-priority.prio-baja { background: rgba(16, 185, 129, 0.2); color: #34d399; }
    .badge-category {
      font-size: 0.7rem; padding: 2px 6px; border-radius: 4px;
      background: rgba(255, 255, 255, 0.08); color: var(--text-secondary);
    }
    .badge-deadline {
      font-size: 0.7rem; padding: 2px 6px; border-radius: 4px;
      background: rgba(59, 130, 246, 0.15); color: #93c5fd; font-weight: 500;
    }
    .badge-deadline.vencida { background: rgba(244, 63, 94, 0.2); color: #fb7185; font-weight: 700; }
    .badge-status { font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; font-weight: 600; }
    .badge-status.badge-completada { background: rgba(34, 197, 94, 0.15); color: #4ade80; }
    .badge-status.badge-cancelada { background: rgba(148, 163, 184, 0.15); color: #94a3b8; }
    .task-title {
      font-size: 1rem; font-weight: 600; color: var(--text-primary); margin: 0;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .task-title.strike { text-decoration: line-through; opacity: 0.65; }
    .task-desc-excerpt {
      font-size: 0.85rem; color: var(--text-secondary); margin: 0;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .task-actions { display: flex; align-items: center; gap: 6px; }
    .btn-icon-action {
      background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-color);
      border-radius: 6px; padding: 6px 8px; font-size: 0.85rem; cursor: pointer;
      color: var(--text-secondary); transition: all 0.2s;
    }
    .btn-icon-action:hover { background: rgba(255, 255, 255, 0.15); color: var(--text-primary); }
    .btn-delete:hover { background: rgba(244, 63, 94, 0.2); color: #fb7185; }
    .finalized-section { margin-top: 16px; border-top: 1px solid var(--border-color); padding-top: 16px; }
    .finalized-card { opacity: 0.75; border-left: 4px solid #64748b; }
    .finalized-card:hover { opacity: 1; }
    .empty-state {
      padding: 40px 24px; text-align: center; border-radius: var(--radius-lg);
      display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px;
    }
    .empty-icon { font-size: 2.5rem; }
    .empty-state h3 { font-size: 1.15rem; font-weight: 600; margin: 0; }
    .empty-state p { color: var(--text-secondary); max-width: 400px; font-size: 0.9rem; margin: 0; }
    .btn-empty-action {
      margin-top: 6px; padding: 8px 16px; background: rgba(99, 102, 241, 0.15);
      border: 1px solid rgba(99, 102, 241, 0.3); border-radius: var(--radius-md);
      color: #818cf8; font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: all 0.2s;
    }
    .btn-empty-action:hover { background: rgba(99, 102, 241, 0.25); color: #a5b4fc; }
    .empty-state-small {
      padding: 20px; text-align: center; border-radius: var(--radius-md);
      color: var(--text-muted); font-size: 0.85rem;
    }
    .sr-only {
      position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
      overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border-width: 0;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  `]
})
export class TareasComponent implements OnInit {
  readonly tareaService = inject(TareaService);
  readonly espacioService = inject(EspacioService);

  readonly espacios = this.espacioService.espacios;
  readonly showFinalizadas = signal<boolean>(true);

  isModalOpen = false;
  isDetailOpen = false;
  isDeleteOpen = false;
  selectedTarea: Tarea | null = null;

  async ngOnInit(): Promise<void> {
    await this.espacioService.loadAll();
    await this.tareaService.initContext();
  }

  espacioActivo(): Espacio | undefined {
    const actId = this.tareaService.espacioActivoId();
    return this.espacios().find(e => e.id === actId);
  }

  getEspacioDeTarea(t: Tarea | null): Espacio | null {
    if (!t || t.espacioId === null) return null;
    return this.espacios().find(e => e.id === t.espacioId) || null;
  }

  async onCambiarEspacio(espacioId: number | null): Promise<void> {
    await this.tareaService.setEspacioActivo(espacioId);
  }

  async onFiltrarCategoria(cat: string | null): Promise<void> {
    await this.tareaService.setCategoriaFiltro(cat);
  }

  async onCambiarEstado(tarea: Tarea, nuevoEstado: EstadoTarea): Promise<void> {
    if (tarea.id) {
      await this.tareaService.cambiarEstado(tarea.id, nuevoEstado);
    }
  }

  toggleFinalizadas(): void {
    this.showFinalizadas.update(v => !v);
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

  formatFechaCorta(fechaIso?: string | null): string {
    if (!fechaIso) return '';
    try {
      const d = new Date(fechaIso);
      return isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  }

  openCreateModal(): void {
    this.selectedTarea = null;
    this.isModalOpen = true;
  }

  openEditModal(tarea: Tarea): void {
    this.selectedTarea = tarea;
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedTarea = null;
  }

  openDetailModal(tarea: Tarea): void {
    this.selectedTarea = tarea;
    this.isDetailOpen = true;
  }

  closeDetailModal(): void {
    this.isDetailOpen = false;
    this.selectedTarea = null;
  }

  openDeleteModal(tarea: Tarea): void {
    this.selectedTarea = tarea;
    this.isDeleteOpen = true;
  }

  closeDeleteModal(): void {
    this.isDeleteOpen = false;
    this.selectedTarea = null;
  }

  async onGuardarTarea(datos: TareaCreateDto | Partial<Tarea>): Promise<void> {
    if (this.selectedTarea && this.selectedTarea.id) {
      await this.tareaService.update(this.selectedTarea.id, datos as Partial<Tarea>);
    } else {
      await this.tareaService.create(datos as TareaCreateDto);
    }
    this.closeModal();
  }

  onEditarDesdeDetalle(tarea: Tarea): void {
    this.closeDetailModal();
    this.openEditModal(tarea);
  }

  onEliminarDesdeDetalle(tarea: Tarea): void {
    this.closeDetailModal();
    this.openDeleteModal(tarea);
  }

  async onCambiarEstadoDesdeDetalle(evento: { id: number; nuevoEstado: EstadoTarea }): Promise<void> {
    await this.tareaService.cambiarEstado(evento.id, evento.nuevoEstado);
    const updated = await this.tareaService.getById(evento.id);
    if (updated) {
      this.selectedTarea = updated;
    }
  }

  async onConfirmarEliminar(id: number): Promise<void> {
    await this.tareaService.delete(id);
    this.closeDeleteModal();
  }
}
