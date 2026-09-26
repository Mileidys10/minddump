import { Injectable, computed, inject, signal } from '@angular/core';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import { DatabaseService, generateSyncId } from '../repositories/database.service';
import { AuthService } from './auth.service';
import { FirebaseService } from './firebase.service';
import {
  SyncableEntity,
  SyncableTableName,
  SyncStatus,
  SyncStats
} from '../models/sync.model';

const STORAGE_KEY_LAST_SYNC = 'minddump_last_sync_timestamp';
const SYNCABLE_TABLES: SyncableTableName[] = [
  'espacios',
  'inbox',
  'notas',
  'tareas',
  'eventos',
  'recordatorios'
];

@Injectable({
  providedIn: 'root'
})
export class FirestoreSyncService {
  private readonly dbService = inject(DatabaseService);
  private readonly authService = inject(AuthService);
  private readonly firebaseService = inject(FirebaseService);

  readonly isOnline = signal<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  readonly syncStatus = signal<SyncStatus>('idle');
  readonly lastSyncTime = signal<string | null>(this.loadLastSyncTime());
  readonly pendingCount = signal<number>(0);
  readonly errorMessage = signal<string | null>(null);

  // Señal que se incrementa cada vez que una sincronización finaliza con éxito
  // para que los repositorios/componentes reactivos puedan recargar datos
  readonly syncRevision = signal<number>(0);

  readonly stats = computed<SyncStats>(() => ({
    totalPending: this.pendingCount(),
    lastSyncTime: this.lastSyncTime(),
    status: this.syncStatus(),
    errorMessage: this.errorMessage()
  }));

  constructor() {
    this.initNetworkListeners();
    this.refreshPendingCount();
  }

  private loadLastSyncTime(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEY_LAST_SYNC);
    } catch {
      return null;
    }
  }

  private saveLastSyncTime(timestamp: string): void {
    try {
      localStorage.setItem(STORAGE_KEY_LAST_SYNC, timestamp);
      this.lastSyncTime.set(timestamp);
    } catch {
      this.lastSyncTime.set(timestamp);
    }
  }

  private initNetworkListeners(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.isOnline.set(true);
      if (this.authService.isAuthenticated()) {
        this.syncAll();
      }
    });

    window.addEventListener('offline', () => {
      this.isOnline.set(false);
      this.syncStatus.set('offline');
    });
  }

  /**
   * Cuenta cuántos ítems están pendientes de sincronizar en todas las tablas
   */
  async refreshPendingCount(): Promise<number> {
    try {
      let count = 0;
      for (const table of SYNCABLE_TABLES) {
        const pending = await this.dbService.db.table(table).filter((i: any) => i.syncPending === true).count();
        count += pending;
      }
      this.pendingCount.set(count);
      return count;
    } catch {
      this.pendingCount.set(0);
      return 0;
    }
  }

  /**
   * Sube un ítem a la nube en background.
   * Si no hay conexión o no está autenticado, asegura que syncPending sea true en Dexie.
   */
  async pushToCloud<T extends SyncableEntity>(
    entityName: SyncableTableName,
    item: T
  ): Promise<void> {
    const table = this.dbService.db.table(entityName);

    // Asegurar syncId
    if (!item.syncId) {
      item.syncId = generateSyncId();
      if (item.id) {
        await table.update(item.id, { syncId: item.syncId });
      }
    }

    const firestore = this.firebaseService.getFirestore();
    const user = this.authService.currentUser();
    const isGoogle = this.authService.isGoogleUser();
    const canPush = this.isOnline() && firestore && user && user.uid && isGoogle;

    if (!canPush) {
      // Modo demo o invitado local: se considera sincronizado localmente sin requerir Firestore
      if (this.authService.isDemoUser() || this.authService.isOfflineGuest()) {
        if (item.id) {
          await table.update(item.id, { syncPending: false });
        }
      } else if (item.id) {
        await table.update(item.id, { syncPending: true });
      }
      await this.refreshPendingCount();
      return;
    }

    try {
      const docRef = doc(firestore, `users/${user.uid}/${entityName}/${item.syncId}`);
      // Remover id numérico local antes de guardar en Firestore
      const { id, ...cloudData } = item as any;
      cloudData.syncPending = false;

      await setDoc(docRef, cloudData, { merge: true });

      // Marcar como sincronizado en Dexie
      if (item.id) {
        await table.update(item.id, { syncPending: false });
      }
      await this.refreshPendingCount();
      this.saveLastSyncTime(new Date().toISOString());
      this.syncStatus.set('synced');
      this.errorMessage.set(null);
    } catch (err: any) {
      const isPermission = err?.code === 'permission-denied' ||
        (typeof err?.message === 'string' && err.message.toLowerCase().includes('permission'));

      if (item.id) {
        await table.update(item.id, { syncPending: true });
      }
      await this.refreshPendingCount();
      this.syncStatus.set('error');

      if (isPermission) {
        console.warn(`[FirestoreSync] Permisos de Firestore no configurados en Firebase Console.`, err);
        this.errorMessage.set('Reglas de Firestore no configuradas. Ve a Firebase Console > Firestore Database > Reglas y publica las reglas de acceso (revisa firestore.rules).');
      } else {
        console.warn(`[FirestoreSync] Error al subir ${entityName}/${item.syncId}:`, err);
        this.errorMessage.set(err?.message || 'Error de conexión con la nube');
      }
      throw err;
    }
  }

  /**
   * Descarga todos los ítems de una entidad desde Firestore y resuelve conflictos con Dexie
   */
  async pullFromCloud(entityName: SyncableTableName): Promise<void> {
    const firestore = this.firebaseService.getFirestore();
    const user = this.authService.currentUser();

    if (!firestore || !user || !user.uid || !this.authService.isGoogleUser() || !this.isOnline()) {
      return;
    }

    try {
      const colRef = collection(firestore, `users/${user.uid}/${entityName}`);
      const snapshot = await getDocs(colRef);
      const table = this.dbService.db.table(entityName);

      for (const docSnap of snapshot.docs) {
        const cloudData = docSnap.data() as SyncableEntity;
        const syncId = docSnap.id;

        // Buscar ítem local por syncId
        const localItem = await table.where('syncId').equals(syncId).first();

        if (!localItem) {
          if (cloudData.deletedAt) {
            continue;
          }
          const newItem = {
            ...cloudData,
            syncId,
            syncPending: false
          };
          await table.add(newItem);
        } else {
          const localDate = localItem.fechaActualizacion || localItem.fechaCreacion || '1970-01-01T00:00:00.000Z';
          const cloudDate = cloudData.fechaActualizacion || cloudData.fechaCreacion || '1970-01-01T00:00:00.000Z';

          if (cloudData.deletedAt) {
            if (localItem.id) {
              await table.delete(localItem.id);
            }
          } else if (new Date(cloudDate).getTime() > new Date(localDate).getTime()) {
            if (localItem.id) {
              const { id, ...updatedProps } = cloudData as any;
              await table.update(localItem.id, {
                ...updatedProps,
                syncId,
                syncPending: false
              });
            }
          } else if (localItem.syncPending) {
            try {
              await this.pushToCloud(entityName, localItem);
            } catch {
              // Manejo silencioso en conflictos individuales
            }
          }
        }
      }
    } catch (err: any) {
      const isPermission = err?.code === 'permission-denied' ||
        (typeof err?.message === 'string' && err.message.toLowerCase().includes('permission'));
      this.syncStatus.set('error');
      if (isPermission) {
        this.errorMessage.set('Reglas de Firestore no configuradas. Ve a Firebase Console > Firestore Database > Reglas y publica las reglas de acceso (revisa firestore.rules).');
      } else {
        this.errorMessage.set(err?.message || `Error al descargar ${entityName}`);
      }
      throw err;
    }
  }

  /**
   * Sube todos los ítems pendientes de sincronización (cola offline)
   */
  async pushPending(): Promise<void> {
    const firestore = this.firebaseService.getFirestore();
    const user = this.authService.currentUser();

    if (!firestore || !user || !user.uid || !this.authService.isGoogleUser() || !this.isOnline()) {
      return;
    }

    for (const entityName of SYNCABLE_TABLES) {
      const table = this.dbService.db.table(entityName);
      const allItems = await table.toArray();
      const pendingItems = allItems.filter((i: any) => i.syncPending === true);

      for (const item of pendingItems) {
        try {
          await this.pushToCloud(entityName, item);
        } catch (err: any) {
          const isPermission = err?.code === 'permission-denied' ||
            (typeof err?.message === 'string' && err.message.toLowerCase().includes('permission'));
          if (isPermission) {
            // Detener el bucle inmediatamente para evitar inundación de consola
            return;
          }
        }
      }
    }
  }

  /**
   * Sincronización completa bidireccional (Push pendientes + Pull novedades)
   */
  async syncAll(): Promise<boolean> {
    if (this.syncStatus() === 'syncing') {
      return false;
    }

    if (!this.isOnline()) {
      this.syncStatus.set('offline');
      return false;
    }

    const user = this.authService.currentUser();
    if (!user) {
      this.syncStatus.set('idle');
      return false;
    }

    // Modo demo o invitado local: sincronización fluida simulada 100% offline
    if (this.authService.isDemoUser() || this.authService.isOfflineGuest() || !this.authService.isGoogleUser()) {
      this.syncStatus.set('syncing');
      await new Promise(r => setTimeout(r, 400));
      const now = new Date().toISOString();
      this.saveLastSyncTime(now);
      this.pendingCount.set(0);
      this.syncStatus.set('synced');
      this.errorMessage.set(null);
      this.syncRevision.update(r => r + 1);
      return true;
    }

    const firestore = this.firebaseService.getFirestore();
    if (!firestore) {
      this.syncStatus.set('error');
      this.errorMessage.set('Firebase Firestore no está disponible.');
      return false;
    }

    try {
      this.syncStatus.set('syncing');
      this.errorMessage.set(null);

      // 1. Subir cambios locales pendientes acumulados en offline
      await this.pushPending();

      if (this.syncStatus() === 'error') {
        return false;
      }

      // 2. Descargar cambios remotos para todas las entidades
      for (const entityName of SYNCABLE_TABLES) {
        await this.pullFromCloud(entityName);
      }

      const now = new Date().toISOString();
      this.saveLastSyncTime(now);
      await this.refreshPendingCount();
      this.syncStatus.set('synced');
      this.errorMessage.set(null);
      this.syncRevision.update(r => r + 1);
      return true;
    } catch (err: any) {
      console.warn('[FirestoreSync] Error en syncAll:', err);
      this.syncStatus.set('error');
      if (!this.errorMessage()) {
        this.errorMessage.set(err?.message || 'Error durante la sincronización');
      }
      return false;
    }
  }

  /**
   * Maneja el borrado de una entidad con soporte de soft-delete para sincronización
   */
  async handleDelete(entityName: SyncableTableName, item: SyncableEntity): Promise<void> {
    const table = this.dbService.db.table(entityName);
    const firestore = this.firebaseService.getFirestore();
    const user = this.authService.currentUser();

    // Eliminar localmente de Dexie
    if (item.id) {
      await table.delete(item.id);
    }

    // Si tiene syncId y hay sesión real de Google en la nube, eliminar de Firestore
    if (item.syncId && firestore && user && user.uid && this.authService.isGoogleUser() && this.isOnline()) {
      try {
        const docRef = doc(firestore, `users/${user.uid}/${entityName}/${item.syncId}`);
        await deleteDoc(docRef);
      } catch (err) {
        console.warn(`[FirestoreSync] Error al eliminar documento en Firestore: ${item.syncId}`, err);
      }
    }
    await this.refreshPendingCount();
  }
}
