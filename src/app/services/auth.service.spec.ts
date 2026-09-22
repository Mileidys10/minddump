import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { FirebaseService } from './firebase.service';

describe('AuthService (C-02 & E-12)', () => {
  let service: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [AuthService, FirebaseService]
    });
    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('debe crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('debe permitir iniciar sesión en modo Demo y actualizar el estado reactivo', () => {
    service.loginAsDemo('estudiante@universidad.edu.co', 'Estudiante U');

    const user = service.currentUser();
    expect(user).toBeTruthy();
    expect(user?.email).toBe('estudiante@universidad.edu.co');
    expect(user?.displayName).toBe('Estudiante U');
    expect(service.isAuthenticated()).toBeTrue();
    expect(service.isOfflineGuest()).toBeFalse();
  });

  it('debe permitir habilitar el Modo Local (Sin cuenta) para offline total', () => {
    service.enableOfflineGuestMode();

    expect(service.isOfflineGuest()).toBeTrue();
    expect(service.isAuthenticated()).toBeTrue();
    expect(service.currentUser()).toBeNull();
  });

  it('debe limpiar todo el estado al cerrar sesión (logout)', async () => {
    service.loginAsDemo('test@u.edu.co', 'Test User');
    expect(service.isAuthenticated()).toBeTrue();

    await service.logout();

    expect(service.currentUser()).toBeNull();
    expect(service.isOfflineGuest()).toBeFalse();
    expect(service.isAuthenticated()).toBeFalse();
  });
});
