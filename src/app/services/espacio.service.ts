import { Injectable, inject, signal } from '@angular/core';
import { EspacioRepository } from '../repositories/espacio.repository';
import { Espacio } from '../models';
import { UTILES_ESPACIO_NOMBRE } from './init.service';

@Injectable({
  providedIn: 'root'
})
export class EspacioService {
  private readonly repository = inject(EspacioRepository);

  readonly espacios = signal<Espacio[]>([]);

  async loadAll(): Promise<Espacio[]> {
    const list = await this.repository.getAll();
    this.espacios.set(list);
    return list;
  }

  async getAll(): Promise<Espacio[]> {
    return await this.loadAll();
  }

  async getById(id: number): Promise<Espacio | undefined> {
    return await this.repository.getById(id);
  }

  async create(espacio: Omit<Espacio, 'id'>): Promise<Espacio> {
    if (!espacio.nombre || espacio.nombre.trim().length === 0) {
      throw new Error('El nombre del espacio es obligatorio');
    }

    const nuevo: Omit<Espacio, 'id'> = {
      ...espacio,
      nombre: espacio.nombre.trim(),
      titulo: espacio.nombre.trim(),
      color: espacio.color || '#6366f1',
      esSistema: false,
      fechaCreacion: espacio.fechaCreacion || new Date().toISOString()
    };

    const creado = await this.repository.create(nuevo);
    await this.loadAll();
    return creado;
  }

  async update(id: number, cambios: Partial<Espacio>): Promise<void> {
    const actual = await this.repository.getById(id);
    if (!actual) {
      throw new Error(`Espacio con id ${id} no encontrado`);
    }

    // Regla: El espacio del sistema no puede renombrarse
    if ((actual.esSistema || actual.nombre === UTILES_ESPACIO_NOMBRE) && cambios.nombre && cambios.nombre.trim() !== actual.nombre) {
      throw new Error(`El espacio del sistema "${actual.nombre}" no puede ser renombrado.`);
    }

    // Regla: Prohibir alterar la marca de esSistema
    if (actual.esSistema && cambios.esSistema === false) {
      throw new Error(`No se puede modificar el estado de sistema del espacio "${actual.nombre}".`);
    }

    const actualizacion: Partial<Espacio> = { ...cambios };
    if (cambios.nombre) {
      actualizacion.nombre = cambios.nombre.trim();
      actualizacion.titulo = cambios.nombre.trim();
    }

    await this.repository.update(id, actualizacion);
    await this.loadAll();
  }

  async delete(id: number): Promise<void> {
    const actual = await this.repository.getById(id);
    if (!actual) {
      return;
    }

    // Regla: El espacio del sistema no puede eliminarse
    if (actual.esSistema || actual.nombre === UTILES_ESPACIO_NOMBRE) {
      throw new Error(`El espacio de sistema "${actual.nombre}" está protegido y no puede ser eliminado.`);
    }

    // Desvincular elementos asociados (notas, tareas, eventos) poniéndoles espacioId: null
    await this.repository.detachElements(id);

    // Eliminar espacio
    await this.repository.delete(id);
    await this.loadAll();
  }

  canDelete(espacio?: Espacio | null): boolean {
    if (!espacio) return false;
    return !espacio.esSistema && espacio.nombre !== UTILES_ESPACIO_NOMBRE;
  }

  canRename(espacio?: Espacio | null): boolean {
    if (!espacio) return false;
    return !espacio.esSistema && espacio.nombre !== UTILES_ESPACIO_NOMBRE;
  }
}
