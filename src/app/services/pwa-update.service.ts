import { Injectable, inject, signal } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PwaUpdateService {
  private readonly swUpdate = inject(SwUpdate, { optional: true });

  readonly nuevaVersionDisponible = signal<boolean>(false);
  readonly pospuesto = signal<boolean>(false);
  readonly comprobando = signal<boolean>(false);

  constructor() {
    this.iniciarEscucha();
  }

  private iniciarEscucha(): void {
    if (!this.swUpdate || !this.swUpdate.isEnabled) {
      return;
    }

    this.swUpdate.versionUpdates
      .pipe(filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'))
      .subscribe(() => {
        this.nuevaVersionDisponible.set(true);
        this.pospuesto.set(false);
      });
  }

  async comprobarActualizacion(): Promise<boolean> {
    if (!this.swUpdate || !this.swUpdate.isEnabled) {
      return false;
    }

    try {
      this.comprobando.set(true);
      return await this.swUpdate.checkForUpdate();
    } catch {
      return false;
    } finally {
      this.comprobando.set(false);
    }
  }

  async actualizar(): Promise<void> {
    if (this.swUpdate && this.swUpdate.isEnabled) {
      try {
        await this.swUpdate.activateUpdate();
      } catch {
        // Continuar con la recarga incluso si falla activateUpdate
      }
    }
    this.recargarPagina();
  }

  recargarPagina(): void {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }

  posponer(): void {
    this.pospuesto.set(true);
  }
}
