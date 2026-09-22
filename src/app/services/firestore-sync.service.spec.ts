import { TestBed } from '@angular/core/testing';
import { FirestoreSyncService } from './firestore-sync.service';
import { DatabaseService } from '../repositories/database.service';
import { AuthService } from './auth.service';
import { FirebaseService } from './firebase.service';

describe('FirestoreSyncService (C-03 & E-12)', () => {
  let syncService: FirestoreSyncService;
  let dbService: DatabaseService;
  let authService: AuthService;

  beforeEach(async () => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [FirestoreSyncService, DatabaseService, AuthService, FirebaseService]
    });

    syncService = TestBed.inject(FirestoreSyncService);
    dbService = TestBed.inject(DatabaseService);
    authService = TestBed.inject(AuthService);

    // Limpiar tablas para test
    await dbService.notas.clear();
    await dbService.tareas.clear();
  });

  afterEach(async () => {
    await dbService.notas.clear();
    await dbService.tareas.clear();
    localStorage.clear();
  });

  it('debe crearse correctamente con estado inicial idle', () => {
    expect(syncService).toBeTruthy();
    expect(syncService.syncStatus()).toBe('idle');
  });

  it('debe detectar ítems pendientes de sincronización con refreshPendingCount', async () => {
    // Añadir una nota con syncPending = true
    await dbService.notas.add({
      titulo: 'Nota Offline',
      contenido: 'Pendiente de subir',
      espacioId: null,
      fechaCreacion: new Date().toISOString(),
      fechaActualizacion: new Date().toISOString(),
      syncId: 'test-uuid-1',
      syncPending: true,
      deletedAt: null
    });

    const count = await syncService.refreshPendingCount();
    expect(count).toBeGreaterThanOrEqual(1);
    expect(syncService.pendingCount()).toBeGreaterThanOrEqual(1);
  });

  it('debe completar syncAll exitosamente en modo demo/offline', async () => {
    authService.loginAsDemo();

    const resultado = await syncService.syncAll();
    expect(resultado).toBeTrue();
    expect(syncService.syncStatus()).toBe('synced');
    expect(syncService.lastSyncTime()).toBeTruthy();
    expect(syncService.pendingCount()).toBe(0);
  });

  it('debe eliminar ítem de Dexie con handleDelete', async () => {
    const id = await dbService.notas.add({
      titulo: 'Nota para borrar',
      espacioId: null,
      fechaCreacion: new Date().toISOString(),
      fechaActualizacion: new Date().toISOString(),
      syncId: 'uuid-delete-test',
      syncPending: false,
      deletedAt: null
    });

    const nota = await dbService.notas.get(id);
    expect(nota).toBeTruthy();

    await syncService.handleDelete('notas', nota!);

    const postDelete = await dbService.notas.get(id);
    expect(postDelete).toBeUndefined();
  });
});
