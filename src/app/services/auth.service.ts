import { Injectable, computed, inject, signal } from '@angular/core';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { FirebaseService } from './firebase.service';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous?: boolean;
}

const STORAGE_KEY_OFFLINE_GUEST = 'minddump_offline_guest_mode';
const STORAGE_KEY_DEMO_USER = 'minddump_demo_user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly firebaseService = inject(FirebaseService);

  readonly currentUser = signal<AuthUser | null>(null);
  readonly isOfflineGuest = signal<boolean>(this.checkOfflineGuest());
  readonly isLoading = signal<boolean>(true);
  readonly authError = signal<string | null>(null);

  readonly isAuthenticated = computed(() => {
    return this.currentUser() !== null || this.isOfflineGuest();
  });

  readonly isGoogleUser = computed(() => {
    const u = this.currentUser();
    return !!u && u.uid !== 'guest-local-user' && !u.isAnonymous;
  });

  constructor() {
    this.initAuthListener();
  }

  private checkOfflineGuest(): boolean {
    return localStorage.getItem(STORAGE_KEY_OFFLINE_GUEST) === 'true';
  }

  private initAuthListener(): void {
    const auth = this.firebaseService.getAuth();
    if (!auth) {
      // Si Firebase no está configurado, verificar si hay usuario demo previo
      const savedDemo = localStorage.getItem(STORAGE_KEY_DEMO_USER);
      if (savedDemo) {
        try {
          this.currentUser.set(JSON.parse(savedDemo));
        } catch {
          this.currentUser.set(null);
        }
      }
      this.isLoading.set(false);
      return;
    }

    onAuthStateChanged(
      auth,
      (user: User | null) => {
        if (user) {
          const authUser: AuthUser = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email?.split('@')[0] || 'Usuario',
            photoURL: user.photoURL,
            isAnonymous: user.isAnonymous
          };
          this.currentUser.set(authUser);
          this.isOfflineGuest.set(false);
          localStorage.removeItem(STORAGE_KEY_OFFLINE_GUEST);
          localStorage.removeItem(STORAGE_KEY_DEMO_USER);
        } else {
          const savedDemo = localStorage.getItem(STORAGE_KEY_DEMO_USER);
          if (savedDemo) {
            try {
              this.currentUser.set(JSON.parse(savedDemo));
            } catch {
              this.currentUser.set(null);
            }
          } else {
            this.currentUser.set(null);
          }
        }
        this.isLoading.set(false);
      },
      error => {
        console.warn('[AuthService] Error en listener de autenticación:', error);
        this.authError.set(error.message);
        this.isLoading.set(false);
      }
    );
  }

  async loginWithGoogle(): Promise<boolean> {
    this.authError.set(null);
    this.isLoading.set(true);

    const auth = this.firebaseService.getAuth();
    if (!auth) {
      this.authError.set('Firebase no está inicializado. Revisa la configuración en Configuración.');
      this.isLoading.set(false);
      return false;
    }

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const authUser: AuthUser = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0] || 'Usuario',
        photoURL: user.photoURL,
        isAnonymous: user.isAnonymous
      };

      this.currentUser.set(authUser);
      this.isOfflineGuest.set(false);
      localStorage.removeItem(STORAGE_KEY_OFFLINE_GUEST);
      localStorage.removeItem(STORAGE_KEY_DEMO_USER);
      this.isLoading.set(false);
      return true;
    } catch (err: any) {
      console.warn('[AuthService] Error al iniciar sesión con Google:', err);
      // Errores comunes de Firebase Auth
      let mensaje = 'Error al iniciar sesión con Google.';
      if (err.code === 'auth/popup-closed-by-user') {
        mensaje = 'La ventana de inicio de sesión fue cerrada.';
      } else if (err.code === 'auth/cancelled-popup-request') {
        mensaje = 'Solicitud de autenticación cancelada.';
      } else if (err.code === 'auth/api-key-not-valid' || err.code === 'auth/invalid-api-key') {
        mensaje = 'La clave API de Firebase es de prueba o no es válida. Configura tu proyecto real en Configuración.';
      } else if (err.message) {
        mensaje = err.message;
      }

      this.authError.set(mensaje);
      this.isLoading.set(false);
      return false;
    }
  }

  /**
   * Permite inicio de sesión rápido en modo demo/pruebas locales
   */
  loginAsDemo(email: string = 'estudiante@universidad.edu.co', nombre: string = 'Estudiante U'): void {
    const demoUser: AuthUser = {
      uid: 'demo-google-uid-12345',
      email,
      displayName: nombre,
      photoURL: null,
      isAnonymous: false
    };
    this.currentUser.set(demoUser);
    this.isOfflineGuest.set(false);
    localStorage.setItem(STORAGE_KEY_DEMO_USER, JSON.stringify(demoUser));
    localStorage.removeItem(STORAGE_KEY_OFFLINE_GUEST);
    this.authError.set(null);
  }

  /**
   * Permite usar la app en modo local sin cuenta
   */
  enableOfflineGuestMode(): void {
    this.isOfflineGuest.set(true);
    this.currentUser.set(null);
    localStorage.setItem(STORAGE_KEY_OFFLINE_GUEST, 'true');
    localStorage.removeItem(STORAGE_KEY_DEMO_USER);
    this.authError.set(null);
  }

  async logout(): Promise<void> {
    this.isLoading.set(true);
    const auth = this.firebaseService.getAuth();
    if (auth) {
      try {
        await signOut(auth);
      } catch (err) {
        console.warn('[AuthService] Error al cerrar sesión en Firebase:', err);
      }
    }
    this.currentUser.set(null);
    this.isOfflineGuest.set(false);
    localStorage.removeItem(STORAGE_KEY_OFFLINE_GUEST);
    localStorage.removeItem(STORAGE_KEY_DEMO_USER);
    this.isLoading.set(false);
  }
}
