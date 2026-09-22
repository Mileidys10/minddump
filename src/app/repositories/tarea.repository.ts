import { Injectable, inject } from '@angular/core';
import { DatabaseService, generateSyncId } from './database.service';
import { Tarea, EstadoTarea, PrioridadTarea } from '../models';
import { FirestoreSyncService } from '../services/firestore-sync.service';

export const ESTADOS_TAREA_VALIDOS: readonly EstadoTarea[] = [
  'Pendiente',
  'En progreso',
  'Completada',
  'Cancelada'
] as const;

export const PRIORIDADES_TAREA_VALIDAS: readonly PrioridadTarea[] = [
  'Urgente',
  'Normal',
  'Baja'
] as const;

export type TareaCreateDto = Omit<Tarea, 'id' | 'fechaCreacion' | 'fechaActualizacion' | 'estado' | 'prioridad'> & {
  estado?: EstadoTarea;
  prioridad?: PrioridadTarea;
};

@Injectable({
  providedIn: 'root'
})
export class TareaRepository {
  private readonly dbService = inject(DatabaseService);
  private readonly syncService = inject(FirestoreSyncService);

  validarEstado(estado: unknown): asserts estado is EstadoTarea {
    if (!ESTADOS_TAREA_VALIDOS.includes(estado as EstadoTarea)) {
      throw new Error(`Estado inválido: "${String(estado)}". Los estados permitidos son: ${ESTADOS_TAREA_VALIDOS.join(', ')}`);
    }
  }

  validarPrioridad(prioridad: unknown): asserts prioridad is PrioridadTarea {
    if (!PRIORIDADES_TAREA_VALIDAS.includes(prioridad as PrioridadTarea)) {
      throw new Error(`Prioridad inválida: "${String(prioridad)}". Las prioridades permitidas son: ${PRIORIDADES_TAREA_VALIDAS.join(', ')}`);
    }
  }

  async getAll(categoria?: string, estado?: EstadoTarea): Promise<Tarea[]> {
    if (estado !== undefined) {
      this.validarEstado(estado);
    }

    let collection = this.dbService.tareas.toCollection();

    if (categoria && categoria.trim().length > 0) {
      const catTrim = categoria.trim().toLowerCase();
      collection = this.dbService.tareas.filter(
        t => !t.deletedAt && !!t.categoria && t.categoria.trim().toLowerCase() === catTrim
      );
    }

    let items = await collection.toArray();
    items = items.filter(t => !t.deletedAt);

    if (estado !== undefined) {
      items = items.filter(t => t.estado === estado);
    }

    return items;
  }

  async getByEspacio(espacioId: number, categoria?: string, estado?: EstadoTarea): Promise<Tarea[]> {
    if (estado !== undefined) {
      this.validarEstado(estado);
    }

    let collection = this.dbService.tareas.where('espacioId').equals(espacioId);

    if (categoria && categoria.trim().length > 0) {
      const catTrim = categoria.trim().toLowerCase();
      collection = collection.filter(t => !t.deletedAt && !!t.categoria && t.categoria.trim().toLowerCase() === catTrim);
    }

    let items = await collection.toArray();
    items = items.filter(t => !t.deletedAt);

    if (estado !== undefined) {
      items = items.filter(t => t.estado === estado);
    }

    return items;
  }

  async getByEstado(estado: EstadoTarea, espacioId?: number): Promise<Tarea[]> {
    this.validarEstado(estado);

    if (espacioId !== undefined) {
      return await this.getByEspacio(espacioId, undefined, estado);
    }

    const items = await this.dbService.tareas.where('estado').equals(estado).toArray();
    return items.filter(t => !t.deletedAt);
  }

  async getById(id: number): Promise<Tarea | undefined> {
    const item = await this.dbService.tareas.get(id);
    return item && !item.deletedAt ? item : undefined;
  }

  async create(tarea: TareaCreateDto): Promise<Tarea> {
    const estado = tarea.estado ?? 'Pendiente';
    const prioridad = tarea.prioridad ?? 'Normal';

    this.validarEstado(estado);
    this.validarPrioridad(prioridad);

    const ahora = new Date().toISOString();
    const nuevaTarea: Tarea = {
      ...tarea,
      syncId: (tarea as any).syncId || generateSyncId(),
      syncPending: true,
      deletedAt: null,
      titulo: tarea.titulo.trim(),
      descripcion: (tarea.descripcion || '').trim(),
      prioridad,
      estado,
      fechaLimite: tarea.fechaLimite ?? tarea.fechaLímite ?? null,
      fechaLímite: tarea.fechaLimite ?? tarea.fechaLímite ?? null,
      categoria: tarea.categoria ? tarea.categoria.trim() : undefined,
      espacioId: tarea.espacioId ?? null,
      fechaCreacion: ahora,
      fechaActualizacion: ahora
    };

    const id = await this.dbService.tareas.add(nuevaTarea);
    const itemGuardado = { ...nuevaTarea, id };

    this.syncService.pushToCloud('tareas', itemGuardado).catch(err => {
      console.warn('[TareaRepo] Fallback sync:', err);
    });

    return itemGuardado;
  }

  async update(id: number, cambios: Partial<Tarea>): Promise<void> {
    const actual = await this.dbService.tareas.get(id);
    if (!actual) {
      throw new Error(`Tarea con id ${id} no encontrada`);
    }

    if (cambios.estado !== undefined) {
      this.validarEstado(cambios.estado);
    }
    if (cambios.prioridad !== undefined) {
      this.validarPrioridad(cambios.prioridad);
    }

    const actualizacion: Partial<Tarea> = {
      ...cambios,
      syncPending: true,
      fechaActualizacion: new Date().toISOString()
    };

    if (cambios.titulo !== undefined) {
      actualizacion.titulo = cambios.titulo.trim();
    }
    if (cambios.descripcion !== undefined) {
      actualizacion.descripcion = cambios.descripcion.trim();
    }
    if (cambios.categoria !== undefined) {
      actualizacion.categoria = cambios.categoria ? cambios.categoria.trim() : undefined;
    }
    if (cambios.fechaLimite !== undefined || cambios.fechaLímite !== undefined) {
      const fl = cambios.fechaLimite ?? cambios.fechaLímite ?? null;
      actualizacion.fechaLimite = fl;
      actualizacion.fechaLímite = fl;
    }

    await this.dbService.tareas.update(id, actualizacion);
    const itemActualizado = await this.dbService.tareas.get(id);
    if (itemActualizado) {
      this.syncService.pushToCloud('tareas', itemActualizado).catch(() => {});
    }
  }

  async cambiarEstado(id: number, nuevoEstado: EstadoTarea): Promise<void> {
    this.validarEstado(nuevoEstado);
    await this.update(id, { estado: nuevoEstado });
  }

  async delete(id: number): Promise<void> {
    const actual = await this.dbService.tareas.get(id);
    if (actual) {
      // Cascada: Eliminar también los recordatorios asociados a la tarea (T-05.5)
      const recs = await this.dbService.recordatorios.where('tareaId').equals(id).toArray();
      for (const r of recs) {
        await this.syncService.handleDelete('recordatorios', r);
      }
      await this.syncService.handleDelete('tareas', actual);
    }
  }

  async getCategorias(espacioId?: number): Promise<string[]> {
    let collection = this.dbService.tareas.toCollection();
    if (espacioId !== undefined) {
      collection = this.dbService.tareas.where('espacioId').equals(espacioId);
    }

    const tareas = await collection.toArray();
    const categorias = new Set<string>();

    for (const t of tareas) {
      if (!t.deletedAt && t.categoria && t.categoria.trim().length > 0) {
        categorias.add(t.categoria.trim());
      }
    }

    return Array.from(categorias).sort();
  }
}
