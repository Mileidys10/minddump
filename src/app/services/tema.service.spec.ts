import { TestBed } from '@angular/core/testing';
import { TemaService, STORAGE_KEY_TEMA } from './tema.service';

describe('TemaService (T-11.1)', () => {
  let service: TemaService;

  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY_TEMA);
    document.documentElement.removeAttribute('data-theme');

    TestBed.configureTestingModule({
      providers: [TemaService]
    });
    service = TestBed.inject(TemaService);
  });

  afterEach(() => {
    localStorage.removeItem(STORAGE_KEY_TEMA);
    document.documentElement.removeAttribute('data-theme');
  });

  it('debe crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('debe permitir cambiar a modo claro y persistir en localStorage', () => {
    service.setTema('light');
    expect(service.tema()).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem(STORAGE_KEY_TEMA)).toBe('light');
  });

  it('debe permitir cambiar a modo oscuro y persistir en localStorage', () => {
    service.setTema('light');
    service.setTema('dark');
    expect(service.tema()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem(STORAGE_KEY_TEMA)).toBe('dark');
  });

  it('debe alternar entre claro y oscuro con toggleTema', () => {
    service.setTema('dark');
    service.toggleTema();
    expect(service.tema()).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');

    service.toggleTema();
    expect(service.tema()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});
