import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EspacioService } from '../../services/espacio.service';
import { Espacio } from '../../models';
import { EspacioModalComponent } from './espacio-modal.component';
import { EspacioDeleteModalComponent } from './espacio-delete-modal.component';

@Component({
  selector: 'app-espacios',
  standalone: true,
  imports: [CommonModule, RouterLink, EspacioModalComponent, EspacioDeleteModalComponent],
  template: `
    <div class="view-container" id="view-espacios">
      <header class="view-header">
        <div>
          <span class="badge">Organización</span>
          <h1 class="view-title">Espacios 🗂️</h1>
          <p class="view-subtitle">Contenedores de contexto para tus notas, tareas y eventos.</p>
        </div>
        <button
          type="button"
          class="btn-create-espacio"
          id="btn-open-create-espacio"
          (click)="openCreateModal()"
        >
          <span class="btn-icon">+</span> Nuevo Espacio
        </button>
      </header>

      <!-- Mensaje de retroalimentación / notificación -->
      @if (feedbackMessage()) {
        <div class="feedback-banner glass" [class.success]="feedbackType() === 'success'" [class.error]="feedbackType() === 'error'">
          <span>{{ feedbackMessage() }}</span>
          <button type="button" class="btn-dismiss" (click)="feedbackMessage.set(null)">✕</button>
        </div>
      }

      <!-- Grid de Espacios (incluye Útiles con D-05) -->
      <div class="spaces-grid" id="spaces-grid">
        @for (espacio of espacios(); track espacio.id) {
          <div
            class="space-card glass"
            [style.border-left-color]="espacio.color"
            [id]="'space-card-' + espacio.id"
            [class.system-space]="espacio.esSistema"
          >
            <div class="space-header">
              <div class="space-color-dot" [style.background-color]="espacio.color"></div>
              <h3 class="space-name">{{ espacio.nombre }}</h3>
              @if (espacio.esSistema) {
                <span class="system-badge" id="system-badge-utiles" title="Espacio predeterminado del sistema (Indestructible)">
                  🛡️ Sistema
                </span>
              }
            </div>

            <p class="space-desc">{{ espacio.descripcion || 'Sin descripción' }}</p>

            <div class="space-footer">
              <span class="space-date">{{ formatDate(espacio.fechaCreacion) }}</span>

              <div class="space-actions">
                <a
                  [routerLink]="['/espacios', espacio.id]"
                  class="action-btn view-btn"
                  [id]="'btn-view-espacio-' + espacio.id"
                  title="Ver contenido del espacio"
                >
                  📁 Ver
                </a>

                <button
                  type="button"
                  class="action-btn edit-btn"
                  [id]="'btn-edit-espacio-' + espacio.id"
                  (click)="openEditModal(espacio)"
                  title="Editar espacio"
                >
                  ✏️ Editar
                </button>

                <!-- El espacio Útiles NO muestra opción de eliminar (T-02.4) -->
                @if (canDelete(espacio)) {
                  <button
                    type="button"
                    class="action-btn delete-btn"
                    [id]="'btn-delete-espacio-' + espacio.id"
                    (click)="openDeleteModal(espacio)"
                    title="Eliminar espacio"
                  >
                    🗑️ Eliminar
                  </button>
                }
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Estado vacío para espacios de usuario -->
      @if (userSpacesCount() === 0) {
        <div class="empty-user-spaces glass" id="empty-user-spaces-notice">
          <div class="empty-icon">💡</div>
          <div class="empty-content">
            <h4>Crea tus propios espacios personalizados</h4>
            <p>El espacio <strong>Útiles</strong> viene predefinido por el sistema. Comienza a organizar tu segundo cerebro creando espacios para tus proyectos, trabajo o vida personal.</p>
          </div>
          <button type="button" class="btn-create-prompt" (click)="openCreateModal()">
            + Crear mi primer espacio
          </button>
        </div>
      }

      <!-- Modal de Formulario Crear / Editar (T-02.3) -->
      @if (isFormModalOpen()) {
        <app-espacio-modal
          [espacioToEdit]="espacioToEdit()"
          (saved)="onSaveEspacio($event)"
          (cancelled)="closeFormModal()"
        ></app-espacio-modal>
      }

      <!-- Modal de Confirmación de Eliminación con aviso de huérfanos (T-02.4) -->
      @if (isDeleteModalOpen()) {
        <app-espacio-delete-modal
          [espacio]="espacioToDelete()"
          (confirmed)="onConfirmDelete()"
          (cancelled)="closeDeleteModal()"
        ></app-espacio-delete-modal>
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
      background: rgba(16, 185, 129, 0.15); color: #34d399; margin-bottom: 8px;
    }
    .view-title { font-size: 2rem; font-weight: 700; color: var(--text-primary); }
    .view-subtitle { color: var(--text-secondary); margin-top: 6px; font-size: 0.95rem; }
    .btn-create-espacio {
      padding: 10px 18px; border-radius: var(--radius-md); font-size: 0.92rem; font-weight: 600;
      background: var(--primary); color: white; display: inline-flex; align-items: center;
      gap: 8px; box-shadow: 0 4px 14px var(--primary-glow); transition: background var(--transition-fast), transform var(--transition-fast);
    }
    .btn-create-espacio:hover { background: var(--primary-hover); transform: translateY(-2px); }
    .btn-icon { font-size: 1.1rem; }
    .feedback-banner {
      padding: 12px 18px; border-radius: var(--radius-md); display: flex;
      justify-content: space-between; align-items: center; font-size: 0.9rem;
    }
    .feedback-banner.success { background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); color: #34d399; }
    .feedback-banner.error { background: rgba(244, 63, 94, 0.15); border: 1px solid rgba(244, 63, 94, 0.3); color: #fb7185; }
    .btn-dismiss { color: inherit; padding: 2px 6px; font-size: 0.9rem; }
    .spaces-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;
    }
    .space-card {
      padding: 22px; border-radius: var(--radius-lg); border-left: 5px solid var(--primary);
      display: flex; flex-direction: column; gap: 14px;
      transition: transform var(--transition-normal), box-shadow var(--transition-normal), border-color var(--transition-normal);
    }
    .space-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }
    .space-card.system-space {
      background: linear-gradient(145deg, rgba(99, 102, 241, 0.08), rgba(18, 24, 41, 0.85));
    }
    .space-header { display: flex; align-items: center; gap: 10px; }
    .space-color-dot { width: 14px; height: 14px; border-radius: 50%; flex-shrink: 0; box-shadow: 0 0 8px currentColor; }
    .space-name { font-size: 1.2rem; font-weight: 600; color: var(--text-primary); flex: 1; }
    .system-badge {
      font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;
      padding: 3px 8px; border-radius: var(--radius-full); background: rgba(99, 102, 241, 0.2);
      color: #a5b4fc; border: 1px solid rgba(99, 102, 241, 0.4); display: flex; align-items: center; gap: 4px;
    }
    .space-desc {
      font-size: 0.9rem; color: var(--text-secondary); line-height: 1.45;
      flex: 1; word-break: break-word; min-height: 40px;
    }
    .space-footer {
      display: flex; justify-content: space-between; align-items: center;
      padding-top: 14px; border-top: 1px solid var(--border-color); gap: 10px;
    }
    .space-date { font-size: 0.75rem; color: var(--text-muted); }
    .space-actions { display: flex; gap: 8px; }
    .action-btn {
      font-size: 0.82rem; font-weight: 500; padding: 5px 10px; border-radius: var(--radius-sm);
      display: inline-flex; align-items: center; gap: 4px; transition: background var(--transition-fast);
    }
    .view-btn { background: rgba(6, 182, 212, 0.12); color: #22d3ee; text-decoration: none; border: 1px solid rgba(6, 182, 212, 0.25); }
    .view-btn:hover { background: rgba(6, 182, 212, 0.22); color: #67e8f9; }
    .edit-btn { background: rgba(255, 255, 255, 0.06); color: var(--text-secondary); }
    .edit-btn:hover { background: rgba(255, 255, 255, 0.12); color: var(--text-primary); }
    .delete-btn { background: rgba(244, 63, 94, 0.1); color: #fb7185; }
    .delete-btn:hover { background: rgba(244, 63, 94, 0.2); color: #fda4af; }
    .empty-user-spaces {
      padding: 24px; border-radius: var(--radius-lg); display: flex; align-items: center;
      gap: 18px; border: 1px dashed var(--border-color); margin-top: 8px; flex-wrap: wrap;
    }
    .empty-icon { font-size: 2rem; }
    .empty-content { flex: 1; min-width: 240px; }
    .empty-content h4 { font-size: 1.05rem; font-weight: 600; color: var(--text-primary); margin-bottom: 4px; }
    .empty-content p { font-size: 0.88rem; color: var(--text-secondary); line-height: 1.4; }
    .btn-create-prompt {
      padding: 8px 16px; border-radius: var(--radius-md); font-size: 0.88rem; font-weight: 600;
      background: rgba(99, 102, 241, 0.15); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.3);
      transition: background var(--transition-fast);
    }
    .btn-create-prompt:hover { background: rgba(99, 102, 241, 0.25); }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class EspaciosComponent implements OnInit {
  private readonly espacioService = inject(EspacioService);

  readonly espacios = this.espacioService.espacios;
  readonly isFormModalOpen = signal(false);
  readonly isDeleteModalOpen = signal(false);
  readonly espacioToEdit = signal<Espacio | null>(null);
  readonly espacioToDelete = signal<Espacio | null>(null);

  readonly feedbackMessage = signal<string | null>(null);
  readonly feedbackType = signal<'success' | 'error'>('success');

  async ngOnInit(): Promise<void> {
    await this.espacioService.getAll();
  }

  userSpacesCount(): number {
    return this.espacios().filter(e => !e.esSistema).length;
  }

  canDelete(espacio: Espacio): boolean {
    return this.espacioService.canDelete(espacio);
  }

  openCreateModal(): void {
    this.espacioToEdit.set(null);
    this.isFormModalOpen.set(true);
  }

  openEditModal(espacio: Espacio): void {
    this.espacioToEdit.set(espacio);
    this.isFormModalOpen.set(true);
  }

  closeFormModal(): void {
    this.isFormModalOpen.set(false);
    this.espacioToEdit.set(null);
  }

  async onSaveEspacio(payload: Partial<Espacio>): Promise<void> {
    const editItem = this.espacioToEdit();

    try {
      if (editItem && editItem.id) {
        await this.espacioService.update(editItem.id, payload);
        this.showFeedback(`Espacio «${payload.nombre || editItem.nombre}» actualizado correctamente.`, 'success');
      } else {
        const nuevo = await this.espacioService.create(payload as Omit<Espacio, 'id'>);
        this.showFeedback(`Espacio «${nuevo.nombre}» creado con éxito.`, 'success');
      }
      this.closeFormModal();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar espacio';
      this.showFeedback(msg, 'error');
    }
  }

  openDeleteModal(espacio: Espacio): void {
    if (!this.canDelete(espacio)) {
      this.showFeedback('Este espacio está protegido y no puede ser eliminado.', 'error');
      return;
    }
    this.espacioToDelete.set(espacio);
    this.isDeleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.espacioToDelete.set(null);
  }

  async onConfirmDelete(): Promise<void> {
    const toDelete = this.espacioToDelete();
    if (!toDelete || !toDelete.id) return;

    try {
      await this.espacioService.delete(toDelete.id);
      this.showFeedback(`Espacio «${toDelete.nombre}» eliminado. Sus elementos quedaron sin clasificar.`, 'success');
      this.closeDeleteModal();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar espacio';
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
