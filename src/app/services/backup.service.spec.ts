import { TestBed } from '@angular/core/testing';
import { BackupService, MindDumpBackupPayload } from './backup.service';
import { DatabaseService } from '../repositories/database.service';

describe('BackupService', () => {
  let service: BackupService;
  let dbService: DatabaseService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [BackupService, DatabaseService]
    });

    service = TestBed.inject(BackupService);
    dbService = TestBed.inject(DatabaseService);

    // Limpiar base de datos antes de cada prueba
    await dbService.db.espacios.clear();
    await dbService.db.inbox.clear();
    await dbService.db.notas.clear();
    await dbService.db.tareas.clear();
    await dbService.db.eventos.clear();
    await dbService.db.recordatorios.clear();
  });

  it('debe crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('debe generar un backup con la estructura correcta', async () => {
    await dbService.db.espacios.add({
      nombre: 'Universidad',
      color: '#6366f1',
      esSistema: false,
      fechaCreacion: new Date().toISOString()
    });

    const backup = await service.generarBackup();
    expect(backup.version).toBe('2.0');
    expect(backup.source).toContain('MindDump');
    expect(backup.data.espacios.length).toBe(1);
    expect(backup.data.espacios[0].nombre).toBe('Universidad');
  });

  it('debe restaurar datos desde un JSON valido', async () => {
    const payload: MindDumpBackupPayload = {
      version: '2.0',
      exportDate: new Date().toISOString(),
      source: 'MindDump',
      data: {
        espacios: [{ nombre: 'Trabajo', color: '#10b981', esSistema: false, fechaCreacion: new Date().toISOString() }],
        inbox: [{ titulo: 'Idea genial', organizado: false, fechaCreacion: new Date().toISOString() }],
        notas: [],
        tareas: [],
        eventos: [],
        recordatorios: []
      }
    };

    const resultado = await service.restaurarBackup(JSON.stringify(payload));
    expect(resultado.exito).toBeTrue();
    expect(resultado.totalImportados).toBe(2);
    expect(resultado.detalles.espacios).toBe(1);
    expect(resultado.detalles.inbox).toBe(1);

    const espaciosEnDb = await dbService.db.espacios.toArray();
    expect(espaciosEnDb.length).toBe(1);
    expect(espaciosEnDb[0].nombre).toBe('Trabajo');
  });

  it('debe rechazar un JSON malformado con error amigable', async () => {
    const resultado = await service.restaurarBackup('{ jsonInvalido ');
    expect(resultado.exito).toBeFalse();
    expect(resultado.mensaje).toContain('no es un JSON valido');
  });
});
