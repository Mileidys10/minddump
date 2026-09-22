import { Injectable, inject, signal, computed } from '@angular/core';
import { TareaRepository, TareaCreateDto } from '../repositories/tarea.repository';
import { EspacioService } from './espacio.service';
import { Tarea, EstadoTarea, PrioridadTarea } from '../models';

const PRIORIDAD_PESO: Record<PrioridadTarea, number> = {
  Urgente: 1,
  Normal: 2,
  Baja: 3
};

@Injectable({
  providedIn: 'root'
})
export class TareaService {
  private readonly repository = inject(TareaRepository);
  private readonly espacioService = inject(EspacioService);

  readonly tareas = signal<Tarea[]>([]);
  readonly espacioActivoId = signal<number | null>(null);
  readonly categoriaSeleccionada = signal<string | null>(null);
  readonly categorias = signal<string[]>([]);

  readonly tareasActivas = computed(() => {
    const list = this.tareas().filter(
      t => t.estado === 'Pendiente' || t.estado === 'En progreso'
    );

    return list.sort((a, b) => {
      // 1. Orden por prioridad (Urgente primero, luego Normal, luego Baja)
      const pesoA = PRIORIDAD_PESO[a.prioridad] ?? 99;
      const pesoB = PRIORIDAD_PESO[b.prioridad] ?? 99;
      if (pesoA !== pesoB) {
        return pesoA - pesoB;
      }

      // 2. Orden secundario por fecha límite (las que vencen antes primero; sin fecha al final)
      const fechaA = a.fechaLimite ?? a.fechaLímite ?? null;
      const fechaB = b.fechaLimite ?? b.fechaLímite ?? null;
      if (fechaA && fechaB) {
        return new Date(fechaA).getTime() - new Date(fechaB).getTime();
      }
      if (fechaA && !fechaB) {
        return -1;
      }
      if (!fechaA && fechaB) {
        return 1;
      }

      // 3. Empate: por fecha de creación descendente
      return new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime();
    });
  });

  readonly tareasFinalizadas = computed(() => {
    const list = this.tareas().filter(
      t => t.estado === 'Completada' || t.estado === 'Cancelada'
    );

    // Ordenadas por fecha de actualización descendente
    return list.sort((a, b) => {
      return new Date(b.fechaActualizacion).getTime() - new Date(a.fechaActualizacion).getTime();
    });
  });

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
      this.tareas.set(list);
      const catList = await this.repository.getCategorias(espId);
      this.categorias.set(catList);
    } else {
      // Si no hay espacio activo seleccionado, lista vacía para pantalla P-06 per D-01
      this.tareas.set([]);
      this.categorias.set([]);
    }
  }

  async getAll(categoria?: string, estado?: EstadoTarea): Promise<Tarea[]> {
    return await this.repository.getAll(categoria, estado);
  }

  async getByEspacio(espacioId: number, categoria?: string, estado?: EstadoTarea): Promise<Tarea[]> {
    return await this.repository.getByEspacio(espacioId, categoria, estado);
  }

  async getById(id: number): Promise<Tarea | undefined> {
    return await this.repository.getById(id);
  }

  async create(tarea: TareaCreateDto): Promise<Tarea> {
    if (!tarea.titulo || tarea.titulo.trim().length === 0) {
      throw new Error('El título de la tarea es obligatorio');
    }

    const creada = await this.repository.create(tarea);
    await this.refresh();
    return creada;
  }

  async update(id: number, cambios: Partial<Tarea>): Promise<void> {
    if (cambios.titulo !== undefined && cambios.titulo.trim().length === 0) {
      throw new Error('El título de la tarea no puede estar vacío');
    }

    await this.repository.update(id, cambios);
    await this.refresh();
  }

  async cambiarEstado(id: number, nuevoEstado: EstadoTarea): Promise<void> {
    await this.repository.cambiarEstado(id, nuevoEstado);
    await this.refresh();
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
    await this.refresh();
  }
}
