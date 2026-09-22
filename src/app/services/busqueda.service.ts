import { Injectable, inject } from '@angular/core';
import { DatabaseService } from '../repositories/database.service';
import { Nota, Tarea, EstadoTarea, PrioridadTarea } from '../models';

export type TipoItemBusqueda = 'nota' | 'tarea';

export interface FiltrosBusqueda {
  espacioId?: number | null | 'all';
  categoria?: string | null | 'all';
  tipo?: 'all' | 'nota' | 'tarea';
}

export interface ResultadoBusqueda {
  id: number;
  tipo: TipoItemBusqueda;
  titulo: string;
  contenido: string;
  espacioId?: number | null;
  categoria?: string | null;
  fechaCreacion: string;
  fechaActualizacion?: string;
  estado?: EstadoTarea;
  prioridad?: PrioridadTarea;
  fechaLimite?: string | null;
  notaOriginal?: Nota;
  tareaOriginal?: Tarea;
}

@Injectable({
  providedIn: 'root'
})
export class BusquedaService {
  private readonly dbService = inject(DatabaseService);

  /**
   * Realiza una búsqueda en memoria case-insensitive sobre notas y tareas.
   * Examina:
   * - Notas: título y contenido
   * - Tareas: título y descripción
   */
  async buscar(query: string, filtros?: FiltrosBusqueda): Promise<ResultadoBusqueda[]> {
    const term = (query || '').trim().toLowerCase();
    const tipoFiltro = filtros?.tipo || 'all';
    const espacioFiltro = filtros?.espacioId !== undefined ? filtros.espacioId : 'all';
    const categoriaFiltro = filtros?.categoria !== undefined ? filtros.categoria : 'all';

    // Si no hay término de búsqueda y los filtros son 'all', retorna vacío
    if (!term && tipoFiltro === 'all' && espacioFiltro === 'all' && categoriaFiltro === 'all') {
      return [];
    }

    const resultados: ResultadoBusqueda[] = [];

    // 1. Buscar en Notas
    if (tipoFiltro === 'all' || tipoFiltro === 'nota') {
      const notas = await this.dbService.notas.toArray();

      for (const nota of notas) {
        if (!nota.id) continue;

        const coincideTexto =
          !term ||
          (nota.titulo && nota.titulo.toLowerCase().includes(term)) ||
          (nota.contenido && nota.contenido.toLowerCase().includes(term));

        if (!coincideTexto) continue;

        if (!this.pasaFiltroEspacio(nota.espacioId, espacioFiltro)) continue;
        if (!this.pasaFiltroCategoria(nota.categoria, categoriaFiltro)) continue;

        resultados.push({
          id: nota.id,
          tipo: 'nota',
          titulo: nota.titulo,
          contenido: nota.contenido || '',
          espacioId: nota.espacioId ?? null,
          categoria: nota.categoria ?? null,
          fechaCreacion: nota.fechaCreacion,
          fechaActualizacion: nota.fechaActualizacion,
          notaOriginal: nota
        });
      }
    }

    // 2. Buscar en Tareas
    if (tipoFiltro === 'all' || tipoFiltro === 'tarea') {
      const tareas = await this.dbService.tareas.toArray();

      for (const tarea of tareas) {
        if (!tarea.id) continue;

        const coincideTexto =
          !term ||
          (tarea.titulo && tarea.titulo.toLowerCase().includes(term)) ||
          (tarea.descripcion && tarea.descripcion.toLowerCase().includes(term));

        if (!coincideTexto) continue;

        if (!this.pasaFiltroEspacio(tarea.espacioId, espacioFiltro)) continue;
        if (!this.pasaFiltroCategoria(tarea.categoria, categoriaFiltro)) continue;

        resultados.push({
          id: tarea.id,
          tipo: 'tarea',
          titulo: tarea.titulo,
          contenido: tarea.descripcion || '',
          espacioId: tarea.espacioId ?? null,
          categoria: tarea.categoria ?? null,
          fechaCreacion: tarea.fechaCreacion,
          fechaActualizacion: tarea.fechaActualizacion,
          estado: tarea.estado,
          prioridad: tarea.prioridad,
          fechaLimite: tarea.fechaLimite ?? tarea.fechaLímite ?? null,
          tareaOriginal: tarea
        });
      }
    }

    // Ordenar resultados: coincidencias en título primero, luego cronológicamente más recientes
    return resultados.sort((a, b) => {
      if (term) {
        const aEnTitulo = a.titulo.toLowerCase().includes(term);
        const bEnTitulo = b.titulo.toLowerCase().includes(term);
        if (aEnTitulo && !bEnTitulo) return -1;
        if (!aEnTitulo && bEnTitulo) return 1;
      }
      const fechaA = new Date(a.fechaActualizacion || a.fechaCreacion).getTime();
      const fechaB = new Date(b.fechaActualizacion || b.fechaCreacion).getTime();
      return fechaB - fechaA;
    });
  }

  /**
   * Obtiene la lista de categorías únicas presentes entre notas y tareas.
   */
  async getCategoriasDisponibles(): Promise<string[]> {
    const [notas, tareas] = await Promise.all([
      this.dbService.notas.toArray(),
      this.dbService.tareas.toArray()
    ]);

    const categoriasSet = new Set<string>();
    notas.forEach(n => {
      if (n.categoria && n.categoria.trim().length > 0) {
        categoriasSet.add(n.categoria.trim());
      }
    });
    tareas.forEach(t => {
      if (t.categoria && t.categoria.trim().length > 0) {
        categoriasSet.add(t.categoria.trim());
      }
    });

    return Array.from(categoriasSet).sort((a, b) => a.localeCompare(b, 'es'));
  }

  private pasaFiltroEspacio(
    itemEspacioId: number | null | undefined,
    filtroEspacio: number | null | 'all'
  ): boolean {
    if (filtroEspacio === 'all') return true;
    if (filtroEspacio === null) return itemEspacioId === null || itemEspacioId === undefined;
    return itemEspacioId === filtroEspacio;
  }

  private pasaFiltroCategoria(
    itemCategoria: string | null | undefined,
    filtroCategoria: string | null | 'all'
  ): boolean {
    if (filtroCategoria === 'all') return true;
    if (filtroCategoria === null) return !itemCategoria || itemCategoria.trim().length === 0;
    if (!itemCategoria) return false;
    return itemCategoria.trim().toLowerCase() === filtroCategoria.trim().toLowerCase();
  }
}
