import { Injectable, inject } from '@angular/core';
import { DatabaseService } from '../repositories/database.service';
import { Espacio } from '../models';

export const UTILES_ESPACIO_NOMBRE = 'Útiles';

@Injectable({
  providedIn: 'root'
})
export class AppInitService {
  private readonly dbService = inject(DatabaseService);

  async init(): Promise<void> {
    await this.initUtilesSpace();
  }

  async initUtilesSpace(): Promise<Espacio> {
    const existing = await this.dbService.espacios
      .filter((espacio: Espacio) => espacio.esSistema === true || espacio.nombre === UTILES_ESPACIO_NOMBRE)
      .first();

    if (existing) {
      // Si existe pero no tenía marcado esSistema, asegurar que lo tenga
      if (!existing.esSistema) {
        existing.esSistema = true;
        if (existing.id) {
          await this.dbService.espacios.update(existing.id, { esSistema: true });
        }
      }
      return existing;
    }

    const utiles: Espacio = {
      nombre: UTILES_ESPACIO_NOMBRE,
      titulo: UTILES_ESPACIO_NOMBRE,
      descripcion: 'Espacio predefinido del sistema para elementos generales y utilidades',
      color: '#6366f1',
      esSistema: true,
      fechaCreacion: new Date().toISOString()
    };

    const id = await this.dbService.espacios.add(utiles);
    return { ...utiles, id };
  }

  async borrarTodoYReiniciar(): Promise<Espacio> {
    await Promise.all([
      this.dbService.espacios.clear(),
      this.dbService.inbox.clear(),
      this.dbService.notas.clear(),
      this.dbService.tareas.clear(),
      this.dbService.eventos.clear(),
      this.dbService.recordatorios.clear()
    ]);
    return await this.initUtilesSpace();
  }
}
