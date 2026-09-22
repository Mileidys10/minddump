import { Injectable, inject, signal } from '@angular/core';
import { RecordatorioRepository, RecordatorioCreateDto } from '../repositories/recordatorio.repository';
import { Recordatorio } from '../models';

@Injectable({
  providedIn: 'root'
})
export class RecordatorioService {
  private readonly repository = inject(RecordatorioRepository);

  readonly recordatorios = signal<Recordatorio[]>([]);
  readonly cargando = signal<boolean>(false);

  async loadAll(): Promise<Recordatorio[]> {
    this.cargando.set(true);
    try {
      const items = await this.repository.getAll();
      this.recordatorios.set(items);
      return items;
    } finally {
      this.cargando.set(false);
    }
  }

  async getByTarea(tareaId: number): Promise<Recordatorio[]> {
    return this.repository.getByTarea(tareaId);
  }

  async getByEvento(eventoId: number): Promise<Recordatorio[]> {
    return this.repository.getByEvento(eventoId);
  }

  async getById(id: number): Promise<Recordatorio | undefined> {
    return this.repository.getById(id);
  }

  async getAnterioresAHora(fechaReferencia?: string): Promise<Recordatorio[]> {
    return this.repository.getAnterioresAHora(fechaReferencia);
  }

  async getPendientesNotificar(fechaReferencia?: string): Promise<Recordatorio[]> {
    return this.repository.getPendientesNotificar(fechaReferencia);
  }

  async create(recordatorio: RecordatorioCreateDto | Recordatorio): Promise<Recordatorio> {
    const creado = await this.repository.create(recordatorio);
    await this.loadAll();
    return creado;
  }

  async update(id: number, cambios: Partial<Recordatorio>): Promise<Recordatorio> {
    const actualizado = await this.repository.update(id, cambios);
    await this.loadAll();
    return actualizado;
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
    await this.loadAll();
  }

  async marcarNotificado(id: number): Promise<Recordatorio> {
    const actualizado = await this.repository.update(id, { notificado: true });
    await this.loadAll();
    return actualizado;
  }
}
