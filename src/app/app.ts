import { Component, OnInit, signal, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { InboxService } from './services/inbox.service';
import { NotaService } from './services/nota.service';
import { TareaService } from './services/tarea.service';
import { EspacioService } from './services/espacio.service';
import { CapturaModalComponent } from './components/inbox/captura-modal.component';
import { NotaModalComponent } from './components/notas/nota-modal.component';
import { TareaModalComponent } from './components/tareas/tarea-modal.component';
import { EventoModalComponent } from './components/eventos/evento-modal.component';
import { PermisoNotificacionModalComponent } from './components/configuracion/permiso-notificacion-modal.component';
import { PwaUpdateBannerComponent } from './components/configuracion/pwa-update-banner.component';
import { EventoService } from './services/evento.service';
import { NotificacionService } from './services/notificacion.service';
import { TemaService } from './services/tema.service';
import { AuthService } from './services/auth.service';
import { FirestoreSyncService } from './services/firestore-sync.service';
import { Nota, Tarea, Evento } from './models';
import { TareaCreateDto } from './repositories/tarea.repository';
import { EventoCreateDto } from './repositories/evento.repository';

export type QuickActionType = 'inbox' | 'nota' | 'tarea' | 'evento';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    CapturaModalComponent,
    NotaModalComponent,
    TareaModalComponent,
    EventoModalComponent,
    PermisoNotificacionModalComponent,
    PwaUpdateBannerComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  readonly router = inject(Router);
  readonly inboxService = inject(InboxService);
  readonly notaService = inject(NotaService);
  readonly tareaService = inject(TareaService);
  readonly eventoService = inject(EventoService);
  readonly espacioService = inject(EspacioService);
  readonly notificacionService = inject(NotificacionService);
  readonly temaService = inject(TemaService);
  readonly authService = inject(AuthService);
  readonly syncService = inject(FirestoreSyncService);

  readonly espacios = this.espacioService.espacios;

  readonly isQuickMenuOpen = signal(false);
  isCapturaModalOpen = false;
  isNotaModalOpen = false;
  isTareaModalOpen = false;
  isEventoModalOpen = false;

  async ngOnInit(): Promise<void> {
    await this.espacioService.loadAll();
    this.notificacionService.iniciarMonitoreo();

    // Si el usuario está autenticado, intentar sincronización inicial en background
    if (this.authService.isAuthenticated() && this.syncService.isOnline()) {
      setTimeout(() => {
        this.syncService.syncAll().catch(() => {});
      }, 1500);
    }
  }

  isLoginRoute(): boolean {
    return this.router.url.includes('/login');
  }

  getSyncIcon(): string {
    if (!this.syncService.isOnline()) return '📡';
    switch (this.syncService.syncStatus()) {
      case 'syncing': return '🔄';
      case 'error': return '⚠️';
      case 'synced': return '☁️';
      default: return '☁️';
    }
  }

  getSyncLabel(): string {
    if (!this.syncService.isOnline()) return 'Offline';
    switch (this.syncService.syncStatus()) {
      case 'syncing': return 'Sincronizando...';
      case 'error': return 'Sync requerido';
      case 'synced': return 'Nube al día';
      default: return 'Sincronizar';
    }
  }

  getSyncTooltip(): string {
    if (!this.syncService.isOnline()) {
      return 'Sin conexión a internet. Los cambios se guardan localmente en tu dispositivo.';
    }
    const err = this.syncService.errorMessage();
    if (this.syncService.syncStatus() === 'error' && err) {
      return `${err} (Clic para reintentar)`;
    }
    const pending = this.syncService.pendingCount();
    if (pending > 0) {
      return `${pending} cambio(s) pendiente(s). Clic para sincronizar con la nube.`;
    }
    return 'Tus datos están sincronizados con la nube. Clic para forzar sincronización.';
  }

  async onTriggerSync(): Promise<void> {
    await this.syncService.syncAll();
  }

  async onLogout(): Promise<void> {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }

  toggleQuickMenu(): void {
    this.isQuickMenuOpen.update(open => !open);
  }

  closeQuickMenu(): void {
    this.isQuickMenuOpen.set(false);
  }

  onQuickAction(action: QuickActionType): void {
    this.closeQuickMenu();
    switch (action) {
      case 'inbox':
        this.isCapturaModalOpen = true;
        break;
      case 'nota':
        this.isNotaModalOpen = true;
        break;
      case 'tarea':
        this.isTareaModalOpen = true;
        break;
      case 'evento':
        this.isEventoModalOpen = true;
        break;
    }
  }

  closeCapturaModal(): void {
    this.isCapturaModalOpen = false;
  }

  async onGuardarCaptura(datos: { titulo: string; descripcion?: string }): Promise<void> {
    await this.inboxService.create(datos);
    this.closeCapturaModal();
  }

  closeNotaModal(): void {
    this.isNotaModalOpen = false;
  }

  async onGuardarNota(datos: Omit<Nota, 'id' | 'fechaCreacion' | 'fechaActualizacion'> | Partial<Nota>): Promise<void> {
    await this.notaService.create(datos as Omit<Nota, 'id' | 'fechaCreacion' | 'fechaActualizacion'>);
    this.closeNotaModal();
  }

  closeTareaModal(): void {
    this.isTareaModalOpen = false;
  }

  async onGuardarTarea(datos: TareaCreateDto | Partial<Tarea>): Promise<void> {
    await this.tareaService.create(datos as TareaCreateDto);
    this.closeTareaModal();
  }

  closeEventoModal(): void {
    this.isEventoModalOpen = false;
  }

  async onGuardarEvento(datos: EventoCreateDto | Partial<Evento>): Promise<void> {
    await this.eventoService.create(datos as EventoCreateDto);
    this.closeEventoModal();
  }
}
