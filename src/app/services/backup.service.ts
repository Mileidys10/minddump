import { Injectable, inject } from '@angular/core';
import { DatabaseService, generateSyncId } from '../repositories/database.service';
import { Espacio, InboxItem, Nota, Tarea, Evento, Recordatorio } from '../models';

export interface MindDumpBackupPayload {
  version: string;
  exportDate: string;
  source: string;
  data: {
    espacios: Espacio[];
    inbox: InboxItem[];
    notas: Nota[];
    tareas: Tarea[];
    eventos: Evento[];
    recordatorios: Recordatorio[];
  };
}

export interface ImportResult {
  exito: boolean;
  totalImportados: number;
  detalles: {
    espacios: number;
    inbox: number;
    notas: number;
    tareas: number;
    eventos: number;
    recordatorios: number;
  };
  mensaje: string;
}

@Injectable({
  providedIn: 'root'
})
export class BackupService {
  private readonly dbService = inject(DatabaseService);

  /**
   * Genera el payload de respaldo en formato objeto JavaScript con todas las tablas.
   */
  async generarBackup(): Promise<MindDumpBackupPayload> {
    const db = this.dbService.db;

    const [espacios, inbox, notas, tareas, eventos, recordatorios] = await Promise.all([
      db.espacios.toArray(),
      db.inbox.toArray(),
      db.notas.toArray(),
      db.tareas.toArray(),
      db.eventos.toArray(),
      db.recordatorios.toArray()
    ]);

    return {
      version: '2.0',
      exportDate: new Date().toISOString(),
      source: 'MindDump - Segundo Cerebro PWA',
      data: {
        espacios,
        inbox,
        notas,
        tareas,
        eventos,
        recordatorios
      }
    };
  }

  /**
   * Genera y descarga automaticamente un archivo .json con todos los datos locales.
   */
  async descargarRespaldo(): Promise<string> {
    const payload = await this.generarBackup();
    const jsonStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });

    const fecha = new Date().toISOString().split('T')[0];
    const nombreArchivo = 'minddump_respaldo_' + fecha + '.json';

    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = nombreArchivo;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }

    return nombreArchivo;
  }

  /**
   * Restaura datos a partir de una cadena JSON o payload estructurado.
   * Si una entidad ya existe (por syncId), la actualiza; si no, la inserta.
   */
  async restaurarBackup(contenidoJson: string): Promise<ImportResult> {
    let payload: MindDumpBackupPayload;

    try {
      payload = JSON.parse(contenidoJson);
    } catch {
      return {
        exito: false,
        totalImportados: 0,
        detalles: { espacios: 0, inbox: 0, notas: 0, tareas: 0, eventos: 0, recordatorios: 0 },
        mensaje: 'El archivo seleccionado no es un JSON valido.'
      };
    }

    if (!payload.data || typeof payload.data !== 'object') {
      return {
        exito: false,
        totalImportados: 0,
        detalles: { espacios: 0, inbox: 0, notas: 0, tareas: 0, eventos: 0, recordatorios: 0 },
        mensaje: 'Formato de respaldo incompatible: falta la seccion data.'
      };
    }

    const db = this.dbService.db;
    const detalles = {
      espacios: 0,
      inbox: 0,
      notas: 0,
      tareas: 0,
      eventos: 0,
      recordatorios: 0
    };

    // 1. Restaurar Espacios
    if (Array.isArray(payload.data.espacios)) {
      for (const item of payload.data.espacios) {
        if (!item.syncId) item.syncId = generateSyncId();
        item.syncPending = true;
        const existente = await db.espacios.where('syncId').equals(item.syncId).first();
        if (existente && existente.id) {
          await db.espacios.update(existente.id, item);
        } else {
          const { id, ...dataSinId } = item as any;
          await db.espacios.add(dataSinId);
        }
        detalles.espacios++;
      }
    }

    // 2. Restaurar Inbox
    if (Array.isArray(payload.data.inbox)) {
      for (const item of payload.data.inbox) {
        if (!item.syncId) item.syncId = generateSyncId();
        item.syncPending = true;
        const existente = await db.inbox.where('syncId').equals(item.syncId).first();
        if (existente && existente.id) {
          await db.inbox.update(existente.id, item);
        } else {
          const { id, ...dataSinId } = item as any;
          await db.inbox.add(dataSinId);
        }
        detalles.inbox++;
      }
    }

    // 3. Restaurar Notas
    if (Array.isArray(payload.data.notas)) {
      for (const item of payload.data.notas) {
        if (!item.syncId) item.syncId = generateSyncId();
        item.syncPending = true;
        const existente = await db.notas.where('syncId').equals(item.syncId).first();
        if (existente && existente.id) {
          await db.notas.update(existente.id, item);
        } else {
          const { id, ...dataSinId } = item as any;
          await db.notas.add(dataSinId);
        }
        detalles.notas++;
      }
    }

    // 4. Restaurar Tareas
    if (Array.isArray(payload.data.tareas)) {
      for (const item of payload.data.tareas) {
        if (!item.syncId) item.syncId = generateSyncId();
        item.syncPending = true;
        const existente = await db.tareas.where('syncId').equals(item.syncId).first();
        if (existente && existente.id) {
          await db.tareas.update(existente.id, item);
        } else {
          const { id, ...dataSinId } = item as any;
          await db.tareas.add(dataSinId);
        }
        detalles.tareas++;
      }
    }

    // 5. Restaurar Eventos
    if (Array.isArray(payload.data.eventos)) {
      for (const item of payload.data.eventos) {
        if (!item.syncId) item.syncId = generateSyncId();
        item.syncPending = true;
        const existente = await db.eventos.where('syncId').equals(item.syncId).first();
        if (existente && existente.id) {
          await db.eventos.update(existente.id, item);
        } else {
          const { id, ...dataSinId } = item as any;
          await db.eventos.add(dataSinId);
        }
        detalles.eventos++;
      }
    }

    // 6. Restaurar Recordatorios
    if (Array.isArray(payload.data.recordatorios)) {
      for (const item of payload.data.recordatorios) {
        if (!item.syncId) item.syncId = generateSyncId();
        item.syncPending = true;
        const existente = await db.recordatorios.where('syncId').equals(item.syncId).first();
        if (existente && existente.id) {
          await db.recordatorios.update(existente.id, item);
        } else {
          const { id, ...dataSinId } = item as any;
          await db.recordatorios.add(dataSinId);
        }
        detalles.recordatorios++;
      }
    }

    const totalImportados =
      detalles.espacios +
      detalles.inbox +
      detalles.notas +
      detalles.tareas +
      detalles.eventos +
      detalles.recordatorios;

    return {
      exito: true,
      totalImportados,
      detalles,
      mensaje: 'Respaldo restaurado exitosamente: ' + totalImportados + ' elementos procesados.'
    };
  }
}
