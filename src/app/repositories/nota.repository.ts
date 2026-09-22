import { Injectable, inject } from '@angular/core';
import { DatabaseService, generateSyncId } from './database.service';
import { Nota } from '../models';
import { FirestoreSyncService } from '../services/firestore-sync.service';

@Injectable({
  providedIn: 'root'
})
export class NotaRepository {
  private readonly dbService = inject(DatabaseService);
  private readonly syncService = inject(FirestoreSyncService);

  async getAll(categoria?: string): Promise<Nota[]> {
    let collection = this.dbService.notas.toCollection();

    if (categoria && categoria.trim().length > 0) {
      const catTrim = categoria.trim().toLowerCase();
      collection = this.dbService.notas.filter(
        nota => !nota.deletedAt && !!nota.categoria && nota.categoria.trim().toLowerCase() === catTrim
      );
      return await collection.toArray();
    }

    const all = await collection.toArray();
    return all.filter(n => !n.deletedAt);
  }

  async getByEspacio(espacioId: number, categoria?: string): Promise<Nota[]> {
    const collection = this.dbService.notas.where('espacioId').equals(espacioId);

    if (categoria && categoria.trim().length > 0) {
      const catTrim = categoria.trim().toLowerCase();
      return await collection
        .filter(nota => !nota.deletedAt && !!nota.categoria && nota.categoria.trim().toLowerCase() === catTrim)
        .toArray();
    }

    const items = await collection.toArray();
    return items.filter(n => !n.deletedAt);
  }

  async getById(id: number): Promise<Nota | undefined> {
    const item = await this.dbService.notas.get(id);
    return item && !item.deletedAt ? item : undefined;
  }

  async create(nota: Omit<Nota, 'id' | 'fechaCreacion' | 'fechaActualizacion'>): Promise<Nota> {
    const ahora = new Date().toISOString();
    const nuevaNota: Nota = {
      ...nota,
      syncId: (nota as any).syncId || generateSyncId(),
      syncPending: true,
      deletedAt: null,
      titulo: nota.titulo.trim(),
      contenido: (nota.contenido || '').trim(),
      categoria: nota.categoria ? nota.categoria.trim() : undefined,
      espacioId: nota.espacioId ?? null,
      fechaCreacion: ahora,
      fechaActualizacion: ahora
    };

    const id = await this.dbService.notas.add(nuevaNota);
    const itemGuardado = { ...nuevaNota, id };

    this.syncService.pushToCloud('notas', itemGuardado).catch(err => {
      console.warn('[NotaRepo] Fallback sync:', err);
    });

    return itemGuardado;
  }

  async update(id: number, cambios: Partial<Nota>): Promise<void> {
    const actual = await this.dbService.notas.get(id);
    if (!actual) {
      throw new Error(`Nota con id ${id} no encontrada`);
    }

    const actualizacion: Partial<Nota> = {
      ...cambios,
      syncPending: true,
      fechaActualizacion: new Date().toISOString()
    };

    if (cambios.titulo !== undefined) {
      actualizacion.titulo = cambios.titulo.trim();
    }
    if (cambios.contenido !== undefined) {
      actualizacion.contenido = cambios.contenido.trim();
    }
    if (cambios.categoria !== undefined) {
      actualizacion.categoria = cambios.categoria ? cambios.categoria.trim() : undefined;
    }

    await this.dbService.notas.update(id, actualizacion);
    const itemActualizado = await this.dbService.notas.get(id);
    if (itemActualizado) {
      this.syncService.pushToCloud('notas', itemActualizado).catch(() => {});
    }
  }

  async delete(id: number): Promise<void> {
    const actual = await this.dbService.notas.get(id);
    if (actual) {
      await this.syncService.handleDelete('notas', actual);
    }
  }

  async getCategorias(espacioId?: number): Promise<string[]> {
    let collection = this.dbService.notas.toCollection();
    if (espacioId !== undefined) {
      collection = this.dbService.notas.where('espacioId').equals(espacioId);
    }

    const notas = await collection.toArray();
    const categorias = new Set<string>();

    for (const n of notas) {
      if (!n.deletedAt && n.categoria && n.categoria.trim().length > 0) {
        categorias.add(n.categoria.trim());
      }
    }

    return Array.from(categorias).sort();
  }
}
