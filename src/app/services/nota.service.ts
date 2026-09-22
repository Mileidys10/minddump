import { Injectable, inject, signal } from '@angular/core';
import { NotaRepository } from '../repositories/nota.repository';
import { EspacioService } from './espacio.service';
import { Nota } from '../models';

@Injectable({
  providedIn: 'root'
})
export class NotaService {
  private readonly repository = inject(NotaRepository);
  private readonly espacioService = inject(EspacioService);

  readonly notas = signal<Nota[]>([]);
  readonly espacioActivoId = signal<number | null>(null);
  readonly categoriaSeleccionada = signal<string | null>(null);
  readonly categorias = signal<string[]>([]);

  async initContext(): Promise<void> {
    const espacios = await this.espacioService.getAll();
    if (espacios.length > 0 && this.espacioActivoId() === null) {
      // Priorizar el espacio de sistema (Útiles) o el primer espacio disponible
      const utiles = espacios.find(e => e.esSistema);
      const inicialId = utiles?.id ?? espacios[0].id ?? null;
      await this.setEspacioActivo(inicialId);
    } else {
      await this.refresh();
    }
  }

  async setEspacioActivo(espacioId: number | null): Promise<void> {
    this.espacioActivoId.set(espacioId);
    this.categoriaSeleccionada.set(null);
    await this.refresh();
  }

  async setCategoriaFiltro(categoria: string | null): Promise<void> {
    this.categoriaSeleccionada.set(categoria);
    await this.refresh();
  }

  async refresh(): Promise<void> {
    const espId = this.espacioActivoId();
    const cat = this.categoriaSeleccionada();

    if (espId !== null) {
      const list = await this.repository.getByEspacio(espId, cat || undefined);
      this.notas.set(list);
      const catList = await this.repository.getCategorias(espId);
      this.categorias.set(catList);
    } else {
      // Si no hay espacio activo seleccionado, lista vacía para pantalla P-05 per D-01
      this.notas.set([]);
      this.categorias.set([]);
    }
  }

  async getAll(categoria?: string): Promise<Nota[]> {
    return await this.repository.getAll(categoria);
  }

  async getByEspacio(espacioId: number, categoria?: string): Promise<Nota[]> {
    return await this.repository.getByEspacio(espacioId, categoria);
  }

  async getById(id: number): Promise<Nota | undefined> {
    return await this.repository.getById(id);
  }

  async create(nota: Omit<Nota, 'id' | 'fechaCreacion' | 'fechaActualizacion'>): Promise<Nota> {
    if (!nota.titulo || nota.titulo.trim().length === 0) {
      throw new Error('El título de la nota es obligatorio');
    }

    const creada = await this.repository.create(nota);
    await this.refresh();
    return creada;
  }

  async update(id: number, cambios: Partial<Nota>): Promise<void> {
    if (cambios.titulo !== undefined && cambios.titulo.trim().length === 0) {
      throw new Error('El título de la nota no puede estar vacío');
    }

    await this.repository.update(id, cambios);
    await this.refresh();
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
    await this.refresh();
  }
}
