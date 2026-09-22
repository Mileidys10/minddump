import { Injectable, signal } from '@angular/core';

export type TemaVisual = 'dark' | 'light';

export const STORAGE_KEY_TEMA = 'minddump_theme';

@Injectable({
  providedIn: 'root'
})
export class TemaService {
  readonly tema = signal<TemaVisual>('dark');

  constructor() {
    this.inicializarTema();
  }

  private inicializarTema(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY_TEMA) as TemaVisual | null;
      if (stored === 'light' || stored === 'dark') {
        this.aplicarTema(stored);
        return;
      }

      // Si no hay preferencia guardada, verificar preferencia del sistema operativo
      const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
      const initialTema: TemaVisual = prefersLight ? 'light' : 'dark';
      this.aplicarTema(initialTema);
    } catch {
      this.aplicarTema('dark');
    }
  }

  setTema(nuevoTema: TemaVisual): void {
    this.aplicarTema(nuevoTema);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_TEMA, nuevoTema);
      }
    } catch {
      // Ignorar fallos de almacenamiento local
    }
  }

  toggleTema(): void {
    const siguiente = this.tema() === 'dark' ? 'light' : 'dark';
    this.setTema(siguiente);
  }

  private aplicarTema(tema: TemaVisual): void {
    this.tema.set(tema);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', tema);
    }
  }
}
