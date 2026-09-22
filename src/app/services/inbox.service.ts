import { Injectable, inject, signal, computed } from '@angular/core';
import { InboxRepository, InboxCreateDto } from '../repositories/inbox.repository';
import { InboxItem } from '../models';

@Injectable({
  providedIn: 'root'
})
export class InboxService {
  private readonly repository = inject(InboxRepository);

  readonly pendientes = signal<InboxItem[]>([]);
  readonly totalPendientes = computed(() => this.pendientes().length);

  async refresh(): Promise<void> {
    const items = await this.repository.getPendientes();
    this.pendientes.set(items);
  }

  async getPendientes(): Promise<InboxItem[]> {
    return await this.repository.getPendientes();
  }

  async getAll(): Promise<InboxItem[]> {
    return await this.repository.getAll();
  }

  async getById(id: number): Promise<InboxItem | undefined> {
    return await this.repository.getById(id);
  }

  async create(data: InboxCreateDto): Promise<InboxItem> {
    if (!data.titulo || data.titulo.trim().length === 0) {
      throw new Error('El título de la captura es obligatorio');
    }

    const creado = await this.repository.create(data);
    await this.refresh();
    return creado;
  }

  async update(id: number, cambios: Partial<InboxItem>): Promise<void> {
    if (cambios.titulo !== undefined && cambios.titulo.trim().length === 0) {
      throw new Error('El título de la captura no puede estar vacío');
    }

    await this.repository.update(id, cambios);
    await this.refresh();
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
    await this.refresh();
  }

  async marcarOrganizado(id: number): Promise<void> {
    await this.repository.marcarOrganizado(id);
    await this.refresh();
  }
}
