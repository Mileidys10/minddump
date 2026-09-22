import { Injectable, inject, signal, computed } from '@angular/core';
import { EventoRepository, EventoCreateDto } from '../repositories/evento.repository';
import { Evento } from '../models';

export type FiltroEspacioTipo = number | null | 'all';

@Injectable({
  providedIn: 'root'
})
export class EventoService {
  private readonly repository = inject(EventoRepository);

  readonly eventos = signal<Evento[]>([]);
  readonly filtroEspacioId = signal<FiltroEspacioTipo>('all');
  readonly filtroCategoria = signal<string | null>(null);
  readonly categorias = signal<string[]>([]);

  readonly eventosOrdenados = computed(() => {
    let list = this.eventos();

    // 1. Filtrado por espacio
    const espFiltro = this.filtroEspacioId();
    if (espFiltro !== 'all') {
      if (espFiltro === null) {
        list = list.filter(e => e.espacioId === null);
      } else {
        list = list.filter(e => e.espacioId === espFiltro);
      }
    }

    // 2. Filtrado por categoría
    const catFiltro = this.filtroCategoria();
    if (catFiltro && catFiltro.trim().length > 0) {
      const catTrim = catFiltro.trim().toLowerCase();
      list = list.filter(e => !!e.categoria && e.categoria.trim().toLowerCase() === catTrim);
    }

    // 3. Ordenamiento por fechaInicio (próximos primero)
    return [...list].sort((a, b) => {
      const tiempoA = new Date(a.fechaInicio).getTime();
      const tiempoB = new Date(b.fechaInicio).getTime();

      if (tiempoA !== tiempoB) {
        return tiempoA - tiempoB;
      }

      const finA = new Date(a.fechaFin).getTime();
      const finB = new Date(b.fechaFin).getTime();
      if (finA !== finB) {
        return finA - finB;
      }

      return new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime();
    });
  });

  async cargarEventos(): Promise<void> {
    const list = await this.repository.getAll();
    this.eventos.set(list);

    const cats = await this.repository.getCategorias();
    this.categorias.set(cats);
  }

  setFiltroEspacio(espacioId: FiltroEspacioTipo): void {
    this.filtroEspacioId.set(espacioId);
  }

  setFiltroCategoria(categoria: string | null): void {
    this.filtroCategoria.set(categoria);
  }

  async getById(id: number): Promise<Evento | undefined> {
    return await this.repository.getById(id);
  }

  async create(evento: EventoCreateDto): Promise<Evento> {
    const creado = await this.repository.create(evento);
    await this.cargarEventos();
    return creado;
  }

  async update(id: number, cambios: Partial<Evento>): Promise<void> {
    await this.repository.update(id, cambios);
    await this.cargarEventos();
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
    await this.cargarEventos();
  }
}
