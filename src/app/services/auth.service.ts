import { Injectable, computed, inject, signal } from '@angular/core';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
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

  /**
   * Retorna true si es un usuario real autenticado via Google en Firebase
   */
  readonly isGoogleUser = computed(() => {
    const u = this.currentUser();
    return !!u && u.uid !== 'guest-local-user' && u.uid !== 'demo-google-uid-12345' && !u.isAnonymous;
  });

  /**
   * Retorna true si el usuario actual esta en modo demo/prueba local
   */
  readonly isDemoUser = computed(() => {
    const u = this.currentUser();
    return !!u && u.uid === 'demo-google-uid-12345';
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

    // Procesar retorno de redireccion (util en celulares / PWA)
    if (typeof window !== 'undefined') {
      getRedirectResult(auth)
        .then(result => {
          if (result && result.user) {
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
          }
        })
        .catch(err => {
          console.warn('[AuthService] Error al procesar retorno de redireccion:', err);
        });
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
        console.warn('[AuthService] Error en listener de autenticacion:', error);
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
      this.authError.set('Firebase no esta inicializado. Revisa la configuracion en Configuracion.');
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
      console.warn('[AuthService] Error al iniciar sesion con Google:', err);

      // Si el navegador movil bloqueo el popup, intentar redireccion automaticamente
      if (err.code === 'auth/popup-blocked') {
        try {
          const provider = new GoogleAuthProvider();
          provider.setCustomParameters({ prompt: 'select_account' });
          await signInWithRedirect(auth, provider);
          return true;
        } catch (redirectErr: any) {
          this.authError.set(redirectErr.message || 'Error en redireccion de Google.');
          this.isLoading.set(false);
          return false;
        }
      }

      let mensaje = 'Error al iniciar sesion con Google.';
      if (err.code === 'auth/popup-closed-by-user') {
        mensaje = 'La ventana de inicio de sesion fue cerrada.';
      } else if (err.code === 'auth/cancelled-popup-request') {
        mensaje = 'Solicitud de autenticacion cancelada.';
      } else if (err.code === 'auth/api-key-not-valid' || err.code === 'auth/invalid-api-key') {
        mensaje = 'La clave API de Firebase es de prueba o no es valida. Configura tu proyecto real en Configuracion.';
      } else if (err.message) {
        mensaje = err.message;
      }

      this.authError.set(mensaje);
      this.isLoading.set(false);
      return false;
    }
  }

  /**
   * Permite inicio de sesion rapido en modo demo/pruebas locales
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
        console.warn('[AuthService] Error al cerrar sesion en Firebase:', err);
      }
    }
    this.currentUser.set(null);
    this.isOfflineGuest.set(false);
    localStorage.removeItem(STORAGE_KEY_OFFLINE_GUEST);
    localStorage.removeItem(STORAGE_KEY_DEMO_USER);
    this.isLoading.set(false);
  }
}
