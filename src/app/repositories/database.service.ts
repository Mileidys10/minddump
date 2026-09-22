import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';
import {
  Espacio,
  InboxItem,
  Nota,
  Tarea,
  Evento,
  Recordatorio
} from '../models';

export function generateSyncId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export class MindDumpDatabase extends Dexie {
  espacios!: Table<Espacio, number>;
  inbox!: Table<InboxItem, number>;
  notas!: Table<Nota, number>;
  tareas!: Table<Tarea, number>;
  eventos!: Table<Evento, number>;
  recordatorios!: Table<Recordatorio, number>;

  constructor() {
    super('minddump_db');

    // Versión 1 original
    this.version(1).stores({
      espacios: '++id, nombre, esSistema, fechaCreacion',
      inbox: '++id, titulo, organizado, fechaCreacion',
      notas: '++id, titulo, categoria, espacioId, fechaCreacion, fechaActualizacion',
      tareas: '++id, titulo, estado, prioridad, fechaLimite, fechaLímite, espacioId, categoria, fechaCreacion, fechaActualizacion',
      eventos: '++id, titulo, fechaInicio, fechaFin, espacioId, categoria, fechaCreacion',
      recordatorios: '++id, fechaHora, tareaId, eventoId, notificado'
    });

    // Versión 2: soporte para sincronización en la nube (syncId, syncPending, deletedAt)
    this.version(2)
      .stores({
        espacios: '++id, &syncId, nombre, esSistema, fechaCreacion, syncPending, deletedAt',
        inbox: '++id, &syncId, titulo, organizado, fechaCreacion, syncPending, deletedAt',
        notas: '++id, &syncId, titulo, categoria, espacioId, fechaCreacion, fechaActualizacion, syncPending, deletedAt',
        tareas: '++id, &syncId, titulo, estado, prioridad, fechaLimite, fechaLímite, espacioId, categoria, fechaCreacion, fechaActualizacion, syncPending, deletedAt',
        eventos: '++id, &syncId, titulo, fechaInicio, fechaFin, espacioId, categoria, fechaCreacion, syncPending, deletedAt',
        recordatorios: '++id, &syncId, fechaHora, tareaId, eventoId, notificado, syncPending, deletedAt'
      })
      .upgrade(async tx => {
        const tables = ['espacios', 'inbox', 'notas', 'tareas', 'eventos', 'recordatorios'];
        for (const tableName of tables) {
          await tx.table(tableName).toCollection().modify((item: any) => {
            if (!item.syncId) {
              item.syncId = generateSyncId();
            }
            if (item.syncPending === undefined) {
              item.syncPending = false;
            }
            if (item.deletedAt === undefined) {
              item.deletedAt = null;
            }
          });
        }
      });
  }
}

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  readonly db: MindDumpDatabase;

  constructor() {
    this.db = new MindDumpDatabase();
  }

  get espacios(): Table<Espacio, number> {
    return this.db.espacios;
  }

  get inbox(): Table<InboxItem, number> {
    return this.db.inbox;
  }

  get notas(): Table<Nota, number> {
    return this.db.notas;
  }

  get tareas(): Table<Tarea, number> {
    return this.db.tareas;
  }

  get eventos(): Table<Evento, number> {
    return this.db.eventos;
  }

  get recordatorios(): Table<Recordatorio, number> {
    return this.db.recordatorios;
  }
}
