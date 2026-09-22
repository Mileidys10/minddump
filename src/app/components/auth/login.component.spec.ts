import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth.service';
import { FirebaseService } from '../../services/firebase.service';

describe('LoginComponent (C-02 & E-12)', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: AuthService;
  let router: Router;

  beforeEach(async () => {
    localStorage.clear();
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        AuthService,
        FirebaseService,
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('debe crearse correctamente y mostrar elementos de marca', () => {
    expect(component).toBeTruthy();

    const titleEl = fixture.nativeElement.querySelector('.brand-title');
    expect(titleEl.textContent).toContain('MindDump');

    const googleBtn = fixture.nativeElement.querySelector('#btn-login-google');
    expect(googleBtn).toBeTruthy();

    const demoBtn = fixture.nativeElement.querySelector('#btn-login-demo');
    expect(demoBtn).toBeTruthy();

    const guestBtn = fixture.nativeElement.querySelector('#btn-login-guest');
    expect(guestBtn).toBeTruthy();
  });

  it('debe iniciar sesión en modo Demo y navegar a /inicio al pulsar el botón', () => {
    component.onLoginDemo();

    expect(authService.isAuthenticated()).toBeTrue();
    expect(authService.currentUser()?.displayName).toBe('Estudiante U');
    expect(router.navigate).toHaveBeenCalledWith(['/inicio']);
  });

  it('debe activar el Modo Local sin cuenta y navegar a /inicio al pulsar el botón', () => {
    component.onContinueGuest();

    expect(authService.isOfflineGuest()).toBeTrue();
    expect(authService.isAuthenticated()).toBeTrue();
    expect(router.navigate).toHaveBeenCalledWith(['/inicio']);
  });
});
