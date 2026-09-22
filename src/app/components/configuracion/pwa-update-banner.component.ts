import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PwaUpdateService } from '../../services/pwa-update.service';

@Component({
  selector: 'app-pwa-update-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (pwaUpdateService.nuevaVersionDisponible() && !pwaUpdateService.pospuesto()) {
      <div class="update-banner glass" id="pwa-update-banner" role="alert">
        <div class="banner-content">
          <span class="banner-icon">🚀</span>
          <div class="banner-text">
            <strong>Nueva versión disponible de MindDump</strong>
            <span>Hay una actualización lista para instalar. Puedes aplicarla ahora o seguir trabajando.</span>
          </div>
        </div>

        <div class="banner-actions">
          <button
            type="button"
            class="btn-posponer"
            id="btn-pwa-posponer"
            (click)="onPosponer()"
          >
            Posponer
          </button>
          <button
            type="button"
            class="btn-actualizar"
            id="btn-pwa-actualizar"
            (click)="onActualizar()"
          >
            🔄 Actualizar ahora
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    .update-banner {
      display: flex; justify-content: space-between; align-items: center; gap: 16px;
      padding: 12px 20px; border-radius: var(--radius-md, 12px);
      background: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.4);
      box-shadow: 0 4px 20px rgba(99, 102, 241, 0.25); animation: slideDown 0.3s ease;
      margin-bottom: 16px; flex-wrap: wrap;
    }
    .banner-content { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 260px; }
    .banner-icon { font-size: 1.5rem; }
    .banner-text { display: flex; flex-direction: column; gap: 2px; }
    .banner-text strong { font-size: 0.95rem; color: #fff; }
    .banner-text span { font-size: 0.82rem; color: #c7d2fe; }
    .banner-actions { display: flex; align-items: center; gap: 10px; }
    .btn-posponer {
      padding: 8px 14px; border-radius: 8px; font-size: 0.85rem; font-weight: 600;
      background: rgba(255, 255, 255, 0.08); color: #c7d2fe; border: none; cursor: pointer;
      transition: all 0.2s;
    }
    .btn-posponer:hover { background: rgba(255, 255, 255, 0.15); color: #fff; }
    .btn-actualizar {
      padding: 8px 16px; border-radius: 8px; font-size: 0.85rem; font-weight: 600;
      background: #6366f1; color: #fff; border: none; cursor: pointer; transition: all 0.2s;
      box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4); white-space: nowrap;
    }
    .btn-actualizar:hover { background: #4f46e5; }
    @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class PwaUpdateBannerComponent {
  readonly pwaUpdateService = inject(PwaUpdateService);

  onActualizar(): void {
    this.pwaUpdateService.actualizar();
  }

  onPosponer(): void {
    this.pwaUpdateService.posponer();
  }
}
