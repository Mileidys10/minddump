import { Injectable, signal } from '@angular/core';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { environment, FirebaseConfig } from '../../environments/environment';

export type { FirebaseConfig };

const STORAGE_KEY_FIREBASE_CONFIG = 'minddump_custom_firebase_config';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private app: FirebaseApp | null = null;
  private authInstance: Auth | null = null;
  private firestoreInstance: Firestore | null = null;

  readonly isInitialized = signal<boolean>(false);
  readonly currentConfig = signal<FirebaseConfig>(this.loadConfig());
  readonly initError = signal<string | null>(null);

  constructor() {
    this.initFirebase();
  }

  private loadConfig(): FirebaseConfig {
    try {
      const custom = localStorage.getItem(STORAGE_KEY_FIREBASE_CONFIG);
      if (custom) {
        const parsed = JSON.parse(custom) as FirebaseConfig;
        if (parsed.apiKey && !parsed.apiKey.includes('DemoKey') && parsed.projectId && !parsed.projectId.includes('minddump-sync')) {
          return parsed;
        } else {
          localStorage.removeItem(STORAGE_KEY_FIREBASE_CONFIG);
        }
      }
    } catch {
      // Ignorar errores de parsing
    }
    return environment.firebase;
  }

  initFirebase(customConfig?: FirebaseConfig): boolean {
    try {
      const config = customConfig || this.loadConfig();
      if (!config.apiKey || !config.projectId) {
        this.initError.set('Configuración de Firebase incompleta.');
        this.isInitialized.set(false);
        return false;
      }

      if (getApps().length > 0) {
        this.app = getApp();
      } else {
        this.app = initializeApp(config);
      }

      this.authInstance = getAuth(this.app);
      this.firestoreInstance = getFirestore(this.app);

      this.currentConfig.set(config);
      this.initError.set(null);
      this.isInitialized.set(true);
      return true;
    } catch (err: any) {
      console.warn('[FirebaseService] Error al inicializar Firebase:', err?.message || err);
      this.initError.set(err?.message || 'Error al conectar con Firebase.');
      this.isInitialized.set(false);
      return false;
    }
  }

  saveCustomConfig(config: FirebaseConfig): boolean {
    try {
      localStorage.setItem(STORAGE_KEY_FIREBASE_CONFIG, JSON.stringify(config));
      return this.initFirebase(config);
    } catch (err: any) {
      this.initError.set(err?.message || 'Error al guardar configuración');
      return false;
    }
  }

  resetToDefaultConfig(): void {
    localStorage.removeItem(STORAGE_KEY_FIREBASE_CONFIG);
    this.initFirebase(environment.firebase);
  }

  getApp(): FirebaseApp | null {
    return this.app;
  }

  getAuth(): Auth | null {
    return this.authInstance;
  }

  getFirestore(): Firestore | null {
    return this.firestoreInstance;
  }
}
