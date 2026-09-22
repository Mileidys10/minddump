import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InboxService } from '../../services/inbox.service';
import { NotaService } from '../../services/nota.service';
import { TareaService } from '../../services/tarea.service';
import { EspacioService } from '../../services/espacio.service';
import { InboxItem, Nota } from '../../models';
import { CapturaModalComponent } from './captura-modal.component';
import { InboxDeleteModalComponent } from './inbox-delete-modal.component';
import { InboxConvertModalComponent } from './inbox-convert-modal.component';
import { TareaCreateDto } from '../../repositories/tarea.repository';

@Component({
  selector: 'app-inbox',
  standalone: true,
  imports: [
    CommonModule,
    CapturaModalComponent,
    InboxDeleteModalComponent,
    InboxConvertModalComponent
  ],
  template: `
    <div class="view-container" id="view-inbox">
      <!-- Encabezado de Inbox -->
      <header class="view-header">
        <div>
          <div class="badge-row">
            <span class="badge">Captura Rápida</span>
            <span class="count-badge">
              {{ inboxService.totalPendientes() }} pendiente{{ inboxService.totalPendientes() === 1 ? '' : 's' }}
            </span>
          </div>
          <h1 class="view-title">Inbox 📥</h1>
          <p class="view-subtitle">
            Tus pensamientos e ideas sin procesar. Captura primero, organiza después.
          </p>
        </div>

        <button
          type="button"
          class="btn-primary-action"
          id="btn-nueva-captura-inbox"
          (click)="openCreateModal()"
        >
          <span class="btn-icon">➕</span>
          Nueva Captura
        </button>
      </header>

      <!-- Lista de Capturas Pendientes -->
      @if (inboxService.pendientes().length > 0) {
        <div class="inbox-list" id="inbox-items-container">
          @for (item of inboxService.pendientes(); track item.id) {
            <article class="inbox-card glass" [id]="'inbox-item-' + item.id">
              <div class="card-body">
                <div class="card-main-info">
                  <h3 class="card-title">{{ item.titulo }}</h3>
                  @if (item.descripcion) {
                    <p class="card-desc">{{ item.descripcion }}</p>
                  }
                </div>

                <div class="card-meta">
                  <span class="item-date" title="Fecha de captura">
                    📅 {{ formatFecha(item.fechaCreacion) }}
                  </span>
                </div>
              </div>

              <footer class="card-actions">
                <button
                  type="button"
                  class="action-btn convert-btn"
                  [id]="'btn-convertir-inbox-' + item.id"
                  (click)="openConvertModal(item)"
                  title="Convertir en Nota o Tarea"
                >
                  🔄 Convertir
                </button>
                <button
                  type="button"
                  class="action-btn edit-btn"
                  [id]="'btn-editar-inbox-' + item.id"
                  (click)="openEditModal(item)"
                  title="Editar captura"
                >
                  ✏️
                </button>
                <button
                  type="button"
                  class="action-btn delete-btn"
                  [id]="'btn-eliminar-inbox-' + item.id"
                  (click)="openDeleteModal(item)"
                  title="Eliminar captura"
                >
                  🗑️
                </button>
              </footer>
            </article>
          }
        </div>
      } @else {
        <!-- Estado Vacío -->
        <div class="empty-state glass" id="inbox-empty-state">
          <div class="empty-icon">📭</div>
          <h3>Inbox limpio y al día</h3>
          <p>
            No tienes pensamientos pendientes de organizar. Usa el botón de abajo o el botón global
            <strong>+</strong> para capturar ideas rápidamente.
          </p>
          <button
            type="button"
            class="btn-empty-action"
            id="btn-empty-capturar"
            (click)="openCreateModal()"
          >
            ➕ Capturar una idea
          </button>
        </div>
      }

      <!-- Modales -->
      <app-captura-modal
        [visible]="isModalOpen"
        [item]="selectedItem"
        (guardar)="onGuardarCaptura($event)"
        (cancelar)="closeModal()"
      ></app-captura-modal>

      <app-inbox-convert-modal
        [visible]="isConvertOpen"
        [item]="selectedItem"
        [espacios]="espacios()"
        [espacioActivoId]="notaService.espacioActivoId()"
        (convertirNota)="onConfirmarConvertirNota($event)"
        (convertirTarea)="onConfirmarConvertirTarea($event)"
        (cancelar)="closeConvertModal()"
      ></app-inbox-convert-modal>

      <app-inbox-delete-modal
        [visible]="isDeleteOpen"
        [item]="selectedItem"
        (confirmar)="onConfirmarEliminar($event)"
        (cancelar)="closeDeleteModal()"
      ></app-inbox-delete-modal>
    </div>
  `,
  styles: [`
    .view-container { display: flex; flex-direction: column; gap: 24px; animation: fadeIn 0.3s ease; }
    .view-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      flex-wrap: wrap; gap: 16px;
    }
    .badge-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
    .badge {
      display: inline-block; font-size: 0.75rem; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.05em; padding: 4px 10px; border-radius: var(--radius-full);
      background: rgba(99, 102, 241, 0.15); color: #818cf8;
    }
    .count-badge {
      font-size: 0.8rem; font-weight: 600; color: var(--text-secondary);
      background: rgba(255, 255, 255, 0.06); padding: 3px 10px; border-radius: 999px;
      border: 1px solid var(--border-color);
    }
    .view-title { font-size: 2rem; font-weight: 700; color: var(--text-primary); margin: 0; }
    .view-subtitle { color: var(--text-secondary); margin-top: 6px; font-size: 0.95rem; }
    .btn-primary-action {
      display: inline-flex; align-items: center; gap: 8px; padding: 10px 18px;
      background: var(--primary, #6366f1); color: #fff; border: none;
      border-radius: var(--radius-md, 8px); font-weight: 600; font-size: 0.95rem;
      cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
    }
    .btn-primary-action:hover { background: #4f46e5; transform: translateY(-1px); }
    .inbox-list { display: flex; flex-direction: column; gap: 12px; }
    .inbox-card {
      display: flex; justify-content: space-between; align-items: center;
      padding: 16px 20px; border-radius: var(--radius-md, 12px);
      border: 1px solid var(--border-color); gap: 16px; flex-wrap: wrap;
      transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
    }
    .inbox-card:hover {
      transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
      border-color: rgba(99, 102, 241, 0.4);
    }
    .card-body { flex: 1; min-width: 260px; display: flex; flex-direction: column; gap: 6px; }
    .card-main-info { display: flex; flex-direction: column; gap: 4px; }
    .card-title { font-size: 1.05rem; font-weight: 600; color: var(--text-primary); margin: 0; }
    .card-desc {
      font-size: 0.9rem; color: var(--text-secondary); margin: 0; line-height: 1.4;
      white-space: pre-wrap; word-break: break-word;
    }
    .card-meta { display: flex; align-items: center; gap: 12px; font-size: 0.8rem; color: var(--text-muted, #94a3b8); margin-top: 2px; }
    .card-actions { display: flex; align-items: center; gap: 8px; }
    .action-btn {
      padding: 7px 12px; border-radius: 8px; font-size: 0.85rem; font-weight: 600;
      cursor: pointer; transition: all 0.2s; border: 1px solid var(--border-color);
    }
    .convert-btn {
      background: rgba(99, 102, 241, 0.15); color: #818cf8; border-color: rgba(99, 102, 241, 0.3);
    }
    .convert-btn:hover {
      background: var(--primary, #6366f1); color: #fff;
    }
    .edit-btn { background: rgba(255, 255, 255, 0.05); color: var(--text-secondary); }
    .edit-btn:hover { background: rgba(255, 255, 255, 0.15); color: var(--text-primary); }
    .delete-btn { background: rgba(255, 255, 255, 0.05); color: var(--text-secondary); }
    .delete-btn:hover { background: rgba(244, 63, 94, 0.2); color: #fb7185; border-color: rgba(244, 63, 94, 0.3); }
    .empty-state {
      padding: 60px 24px; text-align: center; border-radius: var(--radius-lg);
      display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px;
    }
    .empty-icon { font-size: 3rem; margin-bottom: 4px; }
    .empty-state h3 { font-size: 1.25rem; font-weight: 600; margin: 0; }
    .empty-state p { color: var(--text-secondary); max-width: 440px; font-size: 0.95rem; margin: 0; }
    .btn-empty-action {
      margin-top: 8px; padding: 10px 20px; background: rgba(99, 102, 241, 0.15);
      border: 1px solid rgba(99, 102, 241, 0.3); border-radius: var(--radius-md);
      color: #818cf8; font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: all 0.2s;
    }
    .btn-empty-action:hover { background: rgba(99, 102, 241, 0.25); color: #a5b4fc; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class InboxComponent implements OnInit {
  readonly inboxService = inject(InboxService);
  readonly notaService = inject(NotaService);
  readonly tareaService = inject(TareaService);
  readonly espacioService = inject(EspacioService);

  readonly espacios = this.espacioService.espacios;

  isModalOpen = false;
  isConvertOpen = false;
  isDeleteOpen = false;
  selectedItem: InboxItem | null = null;

  async ngOnInit(): Promise<void> {
    await this.espacioService.loadAll();
    await this.inboxService.refresh();
  }

  formatFecha(fechaIso?: string): string {
    if (!fechaIso) return '';
    try {
      const d = new Date(fechaIso);
      return isNaN(d.getTime()) ? '' : d.toLocaleString();
    } catch {
      return '';
    }
  }

  openCreateModal(): void {
    this.selectedItem = null;
    this.isModalOpen = true;
  }

  openEditModal(item: InboxItem): void {
    this.selectedItem = item;
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedItem = null;
  }

  openConvertModal(item: InboxItem): void {
    this.selectedItem = item;
    this.isConvertOpen = true;
  }

  closeConvertModal(): void {
    this.isConvertOpen = false;
    this.selectedItem = null;
  }

  openDeleteModal(item: InboxItem): void {
    this.selectedItem = item;
    this.isDeleteOpen = true;
  }

  closeDeleteModal(): void {
    this.isDeleteOpen = false;
    this.selectedItem = null;
  }

  async onGuardarCaptura(datos: { titulo: string; descripcion?: string }): Promise<void> {
    if (this.selectedItem && this.selectedItem.id) {
      await this.inboxService.update(this.selectedItem.id, datos);
    } else {
      await this.inboxService.create(datos);
    }
    this.closeModal();
  }

  async onConfirmarEliminar(id: number): Promise<void> {
    await this.inboxService.delete(id);
    this.closeDeleteModal();
  }

  async onConfirmarConvertirNota(evento: {
    itemId: number;
    nota: Omit<Nota, 'id' | 'fechaCreacion' | 'fechaActualizacion'>;
  }): Promise<void> {
    await this.notaService.create(evento.nota);
    await this.inboxService.marcarOrganizado(evento.itemId);
    this.closeConvertModal();
  }

  async onConfirmarConvertirTarea(evento: {
    itemId: number;
    tarea: TareaCreateDto;
  }): Promise<void> {
    await this.tareaService.create(evento.tarea);
    await this.inboxService.marcarOrganizado(evento.itemId);
    this.closeConvertModal();
  }
}
