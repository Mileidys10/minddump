import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotaService } from '../../services/nota.service';
import { EspacioService } from '../../services/espacio.service';
import { Nota, Espacio } from '../../models';
import { NotaModalComponent } from './nota-modal.component';
import { NotaDetalleModalComponent } from './nota-detalle-modal.component';
import { NotaDeleteModalComponent } from './nota-delete-modal.component';

@Component({
  selector: 'app-notas',
  standalone: true,
  imports: [
    CommonModule,
    NotaModalComponent,
    NotaDetalleModalComponent,
    NotaDeleteModalComponent
  ],
  template: `
    <div class="view-container" id="view-notas">
      <!-- Encabezado con Contexto de Espacio Activo (D-01, T-04.2) -->
      <header class="view-header">
        <div>
          <span class="badge">Conocimiento</span>
          <h1 class="view-title">Notas 📝</h1>
          <p class="view-subtitle">Ideas, referencias y reflexiones organizadas por espacio.</p>
        </div>

        <div class="header-actions">
          <!-- Selector de Espacio Activo -->
          <div class="space-selector-wrapper">
            <span class="selector-label">Espacio Activo:</span>
            <div class="active-space-pill glass" [style.border-color]="espacioActivo()?.color">
              <span class="space-dot" [style.background-color]="espacioActivo()?.color || '#6366f1'"></span>
              <select
                class="space-dropdown"
                id="select-espacio-activo"
                [value]="espacioActivoId()"
                (change)="onChangeEspacioActivo($event)"
              >
                @for (espacio of espacios(); track espacio.id) {
                  <option [value]="espacio.id">
                    {{ espacio.nombre }} {{ espacio.esSistema ? '(Sistema)' : '' }}
                  </option>
                }
              </select>
            </div>
          </div>

          <button
            type="button"
            class="btn-create-nota"
            id="btn-open-create-nota"
            (click)="openCreateModal()"
          >
            <span class="btn-icon">+</span> Nueva Nota
          </button>
        </div>
      </header>

      <!-- Mensaje de retroalimentación -->
      @if (feedbackMessage()) {
        <div class="feedback-banner glass" [class.success]="feedbackType() === 'success'" [class.error]="feedbackType() === 'error'">
          <span>{{ feedbackMessage() }}</span>
          <button type="button" class="btn-dismiss" (click)="feedbackMessage.set(null)">✕</button>
        </div>
      }

      <!-- Barra de Filtros por Categoría dentro del Espacio Activo (T-04.2) -->
      @if (categorias().length > 0) {
        <div class="categories-bar" id="categories-filter-bar">
          <span class="filter-label">Filtrar:</span>
          <button
            type="button"
            class="category-chip"
            [class.is-active]="categoriaSeleccionada() === null"
            (click)="onSelectCategoria(null)"
            id="filter-cat-todas"
          >
            Todas ({{ todasNotasCount() }})
          </button>

          @for (cat of categorias(); track cat) {
            <button
              type="button"
              class="category-chip"
              [class.is-active]="categoriaSeleccionada() === cat"
              (click)="onSelectCategoria(cat)"
              [id]="'filter-cat-' + cat"
            >
              🏷️ {{ cat }}
            </button>
          }
        </div>
      }

      <!-- Grid de Notas del Espacio Activo -->
      @if (notas().length > 0) {
        <div class="notas-grid" id="notas-grid">
          @for (nota of notas(); track nota.id) {
            <div
              class="nota-card glass"
              [id]="'nota-card-' + nota.id"
              (click)="openDetalleModal(nota)"
              tabindex="0"
              role="button"
              (keydown.enter)="openDetalleModal(nota)"
              [attr.aria-label]="'Ver detalle de ' + nota.titulo"
            >
              <div class="nota-card-header">
                <h3 class="nota-card-title">{{ nota.titulo }}</h3>
                @if (nota.categoria) {
                  <span class="nota-card-category">🏷️ {{ nota.categoria }}</span>
                }
              </div>

              <p class="nota-card-excerpt">
                {{ nota.contenido || 'Sin contenido adicional.' }}
              </p>

              <div class="nota-card-footer">
                <span class="nota-date" title="Última actualización">
                  🔄 {{ formatDate(nota.fechaActualizacion) }}
                </span>

                <div class="card-actions">
                  <button
                    type="button"
                    class="action-btn edit-btn"
                    [id]="'btn-edit-nota-' + nota.id"
                    (click)="$event.stopPropagation(); openEditModal(nota)"
                    title="Editar nota"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    type="button"
                    class="action-btn delete-btn"
                    [id]="'btn-delete-nota-' + nota.id"
                    (click)="$event.stopPropagation(); openDeleteModal(nota)"
                    title="Eliminar nota"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      } @else {
        <!-- Estado Vacío Informativo para el Espacio Activo -->
        <div class="empty-state glass" id="empty-notas-notice">
          <div class="empty-icon">📄</div>
          <h3>Sin notas en «{{ espacioActivo()?.nombre || 'este espacio' }}»</h3>
          <p>
            @if (categoriaSeleccionada()) {
              No hay notas con la categoría <strong>«{{ categoriaSeleccionada() }}»</strong> en este espacio.
            } @else {
              Aún no has creado notas en este espacio. Las notas creadas sin espacio asignado no se muestran aquí y son accesibles solo vía <strong>Búsqueda Global</strong> (R-07).
            }
          </p>
          <button type="button" class="btn-create-prompt" (click)="openCreateModal()">
            + Crear nota en este espacio
          </button>
        </div>
      }

      <!-- Modal de Formulario Crear / Editar Nota (T-04.3) -->
      @if (isFormModalOpen()) {
        <app-nota-modal
          [notaToEdit]="notaToEdit()"
          [defaultEspacioId]="espacioActivoId()"
          [espacios]="espacios()"
          (saved)="onSaveNota($event)"
          (cancelled)="closeFormModal()"
        ></app-nota-modal>
      }

      <!-- Modal de Vista Detalle en Modo Lectura (T-04.5) -->
      @if (isDetalleModalOpen()) {
        <app-nota-detalle-modal
          [nota]="notaInDetalle()"
          [espacio]="getEspacioById(notaInDetalle()?.espacioId)"
          (edit)="openEditFromDetalle()"
          (delete)="openDeleteFromDetalle()"
          (closed)="closeDetalleModal()"
        ></app-nota-detalle-modal>
      }

      <!-- Modal de Confirmación de Eliminación (T-04.4) -->
      @if (isDeleteModalOpen()) {
        <app-nota-delete-modal
          [nota]="notaToDelete()"
          (confirmed)="onConfirmDelete()"
          (cancelled)="closeDeleteModal()"
        ></app-nota-delete-modal>
      }
    </div>
  `,
  styles: [`
    .view-container { display: flex; flex-direction: column; gap: 24px; animation: fadeIn 0.3s ease; }
    .view-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      gap: 16px; flex-wrap: wrap;
    }
    .badge {
      display: inline-block; font-size: 0.75rem; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.05em; padding: 4px 10px; border-radius: var(--radius-full);
      background: rgba(245, 158, 11, 0.15); color: #fbbf24; margin-bottom: 8px;
    }
    .view-title { font-size: 2rem; font-weight: 700; color: var(--text-primary); }
    .view-subtitle { color: var(--text-secondary); margin-top: 6px; font-size: 0.95rem; }
    .header-actions { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
    .space-selector-wrapper { display: flex; align-items: center; gap: 8px; }
    .selector-label { font-size: 0.85rem; color: var(--text-muted); font-weight: 500; }
    .active-space-pill {
      display: flex; align-items: center; gap: 8px; padding: 6px 12px;
      border-radius: var(--radius-md); border: 1px solid var(--border-color);
      background: var(--bg-surface-elevated);
    }
    .space-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .space-dropdown {
      border: none; background: transparent; color: var(--text-primary);
      font-size: 0.9rem; font-weight: 600; outline: none; cursor: pointer;
    }
    .space-dropdown option { background: var(--bg-surface); color: var(--text-primary); }
    .btn-create-nota {
      padding: 10px 18px; border-radius: var(--radius-md); font-size: 0.92rem; font-weight: 600;
      background: var(--primary); color: white; display: inline-flex; align-items: center;
      gap: 8px; box-shadow: 0 4px 14px var(--primary-glow);
      transition: background var(--transition-fast), transform var(--transition-fast);
    }
    .btn-create-nota:hover { background: var(--primary-hover); transform: translateY(-2px); }
    .btn-icon { font-size: 1.1rem; }
    .feedback-banner {
      padding: 12px 18px; border-radius: var(--radius-md); display: flex;
      justify-content: space-between; align-items: center; font-size: 0.9rem;
    }
    .feedback-banner.success { background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); color: #34d399; }
    .feedback-banner.error { background: rgba(244, 63, 94, 0.15); border: 1px solid rgba(244, 63, 94, 0.3); color: #fb7185; }
    .btn-dismiss { color: inherit; padding: 2px 6px; font-size: 0.9rem; }
    .categories-bar {
      display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
      padding: 12px 16px; border-radius: var(--radius-md); background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--border-color);
    }
    .filter-label { font-size: 0.85rem; color: var(--text-muted); font-weight: 500; }
    .category-chip {
      padding: 4px 12px; border-radius: var(--radius-full); font-size: 0.82rem; font-weight: 500;
      background: rgba(255, 255, 255, 0.05); color: var(--text-secondary);
      border: 1px solid var(--border-color); transition: background var(--transition-fast), color var(--transition-fast);
    }
    .category-chip:hover { background: rgba(255, 255, 255, 0.1); color: var(--text-primary); }
    .category-chip.is-active {
      background: rgba(99, 102, 241, 0.2); color: #818cf8; border-color: rgba(99, 102, 241, 0.4);
      font-weight: 600;
    }
    .notas-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px;
    }
    .nota-card {
      padding: 22px; border-radius: var(--radius-lg); display: flex;
      flex-direction: column; gap: 12px; cursor: pointer; outline: none;
      transition: transform var(--transition-normal), box-shadow var(--transition-normal), border-color var(--transition-normal);
    }
    .nota-card:hover, .nota-card:focus-visible {
      transform: translateY(-3px); border-color: var(--border-focus); box-shadow: var(--shadow-md);
    }
    .nota-card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
    .nota-card-title { font-size: 1.15rem; font-weight: 600; color: var(--text-primary); line-height: 1.35; flex: 1; }
    .nota-card-category {
      font-size: 0.72rem; font-weight: 600; padding: 2px 8px; border-radius: var(--radius-full);
      background: rgba(245, 158, 11, 0.15); color: #fbbf24; flex-shrink: 0;
    }
    .nota-card-excerpt {
      font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5;
      display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;
      overflow: hidden; text-overflow: ellipsis; min-height: 42px;
    }
    .nota-card-footer {
      display: flex; justify-content: space-between; align-items: center;
      padding-top: 12px; border-top: 1px solid var(--border-color); gap: 10px;
    }
    .nota-date { font-size: 0.75rem; color: var(--text-muted); }
    .card-actions { display: flex; gap: 8px; }
    .action-btn {
      font-size: 0.8rem; font-weight: 500; padding: 4px 8px; border-radius: var(--radius-sm);
      display: inline-flex; align-items: center; gap: 4px; transition: background var(--transition-fast);
    }
    .edit-btn { background: rgba(255, 255, 255, 0.06); color: var(--text-secondary); }
    .edit-btn:hover { background: rgba(255, 255, 255, 0.12); color: var(--text-primary); }
    .delete-btn { background: rgba(244, 63, 94, 0.1); color: #fb7185; }
    .delete-btn:hover { background: rgba(244, 63, 94, 0.2); color: #fda4af; }
    .empty-state {
      padding: 60px 24px; text-align: center; border-radius: var(--radius-lg);
      display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px;
    }
    .empty-icon { font-size: 3rem; margin-bottom: 8px; }
    .empty-state h3 { font-size: 1.25rem; font-weight: 600; }
    .empty-state p { color: var(--text-secondary); max-width: 460px; font-size: 0.95rem; line-height: 1.5; }
    .btn-create-prompt {
      margin-top: 6px; padding: 8px 16px; border-radius: var(--radius-md); font-size: 0.88rem; font-weight: 600;
      background: rgba(99, 102, 241, 0.15); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.3);
      transition: background var(--transition-fast);
    }
    .btn-create-prompt:hover { background: rgba(99, 102, 241, 0.25); }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class NotasComponent implements OnInit {
  private readonly notaService = inject(NotaService);
  private readonly espacioService = inject(EspacioService);

  readonly notas = this.notaService.notas;
  readonly categorias = this.notaService.categorias;
  readonly espacioActivoId = this.notaService.espacioActivoId;
  readonly categoriaSeleccionada = this.notaService.categoriaSeleccionada;
  readonly espacios = this.espacioService.espacios;

  readonly espacioActivo = computed(() => {
    const id = this.espacioActivoId();
    if (id === null) return null;
    return this.espacios().find(e => e.id === id) || null;
  });

  readonly isFormModalOpen = signal(false);
  readonly isDetalleModalOpen = signal(false);
  readonly isDeleteModalOpen = signal(false);

  readonly notaToEdit = signal<Nota | null>(null);
  readonly notaInDetalle = signal<Nota | null>(null);
  readonly notaToDelete = signal<Nota | null>(null);

  readonly feedbackMessage = signal<string | null>(null);
  readonly feedbackType = signal<'success' | 'error'>('success');

  async ngOnInit(): Promise<void> {
    await this.espacioService.getAll();
    await this.notaService.initContext();
  }

  async onChangeEspacioActivo(event: Event): Promise<void> {
    const target = event.target as HTMLSelectElement;
    const value = target.value ? Number(target.value) : null;
    await this.notaService.setEspacioActivo(value);
  }

  async onSelectCategoria(categoria: string | null): Promise<void> {
    await this.notaService.setCategoriaFiltro(categoria);
  }

  todasNotasCount(): number {
    return this.notas().length;
  }

  getEspacioById(id?: number | null): Espacio | null {
    if (!id) return null;
    return this.espacios().find(e => e.id === id) || null;
  }

  openCreateModal(): void {
    this.notaToEdit.set(null);
    this.isFormModalOpen.set(true);
  }

  openEditModal(nota: Nota): void {
    this.notaToEdit.set(nota);
    this.isFormModalOpen.set(true);
  }

  closeFormModal(): void {
    this.isFormModalOpen.set(false);
    this.notaToEdit.set(null);
  }

  async onSaveNota(payload: Partial<Nota>): Promise<void> {
    const editing = this.notaToEdit();

    try {
      if (editing && editing.id) {
        await this.notaService.update(editing.id, payload);
        this.showFeedback(`Nota «${payload.titulo || editing.titulo}» actualizada.`, 'success');
        if (this.notaInDetalle()?.id === editing.id) {
          const refreshed = await this.notaService.getById(editing.id);
          this.notaInDetalle.set(refreshed || null);
        }
      } else {
        const nueva = await this.notaService.create(payload as Omit<Nota, 'id' | 'fechaCreacion' | 'fechaActualizacion'>);
        this.showFeedback(`Nota «${nueva.titulo}» creada con éxito.`, 'success');
      }
      this.closeFormModal();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar la nota';
      this.showFeedback(msg, 'error');
    }
  }

  openDetalleModal(nota: Nota): void {
    this.notaInDetalle.set(nota);
    this.isDetalleModalOpen.set(true);
  }

  closeDetalleModal(): void {
    this.isDetalleModalOpen.set(false);
    this.notaInDetalle.set(null);
  }

  openEditFromDetalle(): void {
    const nota = this.notaInDetalle();
    if (!nota) return;
    this.closeDetalleModal();
    this.openEditModal(nota);
  }

  openDeleteFromDetalle(): void {
    const nota = this.notaInDetalle();
    if (!nota) return;
    this.closeDetalleModal();
    this.openDeleteModal(nota);
  }

  openDeleteModal(nota: Nota): void {
    this.notaToDelete.set(nota);
    this.isDeleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.notaToDelete.set(null);
  }

  async onConfirmDelete(): Promise<void> {
    const toDelete = this.notaToDelete();
    if (!toDelete || !toDelete.id) return;

    try {
      await this.notaService.delete(toDelete.id);
      this.showFeedback(`Nota «${toDelete.titulo}» eliminada.`, 'success');
      this.closeDeleteModal();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar la nota';
      this.showFeedback(msg, 'error');
    }
  }

  formatDate(isoString?: string): string {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  }

  private showFeedback(message: string, type: 'success' | 'error'): void {
    this.feedbackMessage.set(message);
    this.feedbackType.set(type);
    setTimeout(() => {
      if (this.feedbackMessage() === message) {
        this.feedbackMessage.set(null);
      }
    }, 4500);
  }
}
