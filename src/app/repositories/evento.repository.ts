import { Injectable, inject } from '@angular/core';
import { DatabaseService, generateSyncId } from './database.service';
import { Evento } from '../models';
import { FirestoreSyncService } from '../services/firestore-sync.service';

export type EventoCreateDto = Omit<Evento, 'id' | 'fechaCreacion'>;

@Injectable({
  providedIn: 'root'
})
export class EventoRepository {
  private readonly dbService = inject(DatabaseService);
  private readonly syncService = inject(FirestoreSyncService);

  validarFechas(fechaInicio: unknown, fechaFin: unknown): void {
    if (!fechaInicio || typeof fechaInicio !== 'string' || fechaInicio.trim().length === 0) {
      throw new Error('La fecha de inicio es requerida');
    }
    if (!fechaFin || typeof fechaFin !== 'string' || fechaFin.trim().length === 0) {
      throw new Error('La fecha de fin es requerida');
    }

    const tInicio = new Date(fechaInicio).getTime();
    const tFin = new Date(fechaFin).getTime();

    if (isNaN(tInicio)) {
      throw new Error(`Fecha de inicio inválida: "${String(fechaInicio)}"`);
    }
    if (isNaN(tFin)) {
      throw new Error(`Fecha de fin inválida: "${String(fechaFin)}"`);
    }

    if (tFin < tInicio) {
      throw new Error('La fecha de fin debe ser posterior o igual a la fecha de inicio');
    }
  }

  validarTitulo(titulo: unknown): asserts titulo is string {
    if (!titulo || typeof titulo !== 'string' || titulo.trim().length === 0) {
      throw new Error('El título del evento es requerido y no puede estar vacío');
    }
  }

  async getAll(categoria?: string): Promise<Evento[]> {
    let collection = this.dbService.eventos.toCollection();

    if (categoria && categoria.trim().length > 0) {
      const catTrim = categoria.trim().toLowerCase();
      collection = this.dbService.eventos.filter(
        e => !e.deletedAt && !!e.categoria && e.categoria.trim().toLowerCase() === catTrim
      );
    }

    const items = await collection.toArray();
    return items
      .filter(e => !e.deletedAt)
      .sort((a, b) => new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime());
  }

  async getByEspacio(espacioId: number, categoria?: string): Promise<Evento[]> {
    let collection = this.dbService.eventos.where('espacioId').equals(espacioId);

    if (categoria && categoria.trim().length > 0) {
      const catTrim = categoria.trim().toLowerCase();
      collection = collection.filter(e => !e.deletedAt && !!e.categoria && e.categoria.trim().toLowerCase() === catTrim);
    }

    const items = await collection.toArray();
    return items
      .filter(e => !e.deletedAt)
      .sort((a, b) => new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime());
  }

  async getById(id: number): Promise<Evento | undefined> {
    const item = await this.dbService.eventos.get(id);
    return item && !item.deletedAt ? item : undefined;
  }

  async create(evento: EventoCreateDto): Promise<Evento> {
    this.validarTitulo(evento.titulo);
    this.validarFechas(evento.fechaInicio, evento.fechaFin);

    const ahora = new Date().toISOString();
    const nuevoEvento: Evento = {
      ...evento,
      syncId: (evento as any).syncId || generateSyncId(),
      syncPending: true,
      deletedAt: null,
      titulo: evento.titulo.trim(),
      descripcion: (evento.descripcion || '').trim(),
      categoria: evento.categoria ? evento.categoria.trim() : undefined,
      fechaInicio: evento.fechaInicio,
      fechaFin: evento.fechaFin,
      espacioId: evento.espacioId ?? null,
      fechaCreacion: ahora,
      fechaActualizacion: ahora
    };

    const id = await this.dbService.eventos.add(nuevoEvento);
    const itemGuardado = { ...nuevoEvento, id };

    this.syncService.pushToCloud('eventos', itemGuardado).catch(err => {
      console.warn('[EventoRepo] Fallback sync:', err);
    });

    return itemGuardado;
  }

  async update(id: number, cambios: Partial<Evento>): Promise<void> {
    const actual = await this.dbService.eventos.get(id);
    if (!actual) {
      throw new Error(`Evento con id ${id} no encontrado`);
    }

    if (cambios.titulo !== undefined) {
      this.validarTitulo(cambios.titulo);
    }

    const inicioFinal = cambios.fechaInicio !== undefined ? cambios.fechaInicio : actual.fechaInicio;
    const finFinal = cambios.fechaFin !== undefined ? cambios.fechaFin : actual.fechaFin;
    this.validarFechas(inicioFinal, finFinal);

    const actualizacion: Partial<Evento> = {
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
    if (cambios.espacioId !== undefined) {
      actualizacion.espacioId = cambios.espacioId ?? null;
    }

    await this.dbService.eventos.update(id, actualizacion);
    const itemActualizado = await this.dbService.eventos.get(id);
    if (itemActualizado) {
      this.syncService.pushToCloud('eventos', itemActualizado).catch(() => {});
    }
  }

  async delete(id: number): Promise<void> {
    const actual = await this.dbService.eventos.get(id);
    if (actual) {
      // Cascada: Eliminar también los recordatorios asociados al evento (T-06.4)
      const recs = await this.dbService.recordatorios.where('eventoId').equals(id).toArray();
      for (const r of recs) {
        await this.syncService.handleDelete('recordatorios', r);
      }
      await this.syncService.handleDelete('eventos', actual);
    }
  }

  async getCategorias(espacioId?: number): Promise<string[]> {
    let collection = this.dbService.eventos.toCollection();
    if (espacioId !== undefined) {
      collection = this.dbService.eventos.where('espacioId').equals(espacioId);
    }

    const eventos = await collection.toArray();
    const categorias = new Set<string>();

    for (const e of eventos) {
      if (!e.deletedAt && e.categoria && e.categoria.trim().length > 0) {
        categorias.add(e.categoria.trim());
      }
    }

    return Array.from(categorias).sort();
  }
}
