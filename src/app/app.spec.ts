import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';

describe('App Component (T-01.5 Layout, Navegación y Shell)', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes)]
    }).compileComponents();
  });

  it('debe crear la aplicación correctamente', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('debe contener enlaces de navegación para las 8 rutas requeridas', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    const desktopNav = compiled.querySelector('#app-sidebar');
    expect(desktopNav).toBeTruthy();

    const expectedHrefs = [
      '/inicio',
      '/inbox',
      '/espacios',
      '/notas',
      '/tareas',
      '/eventos',
      '/busqueda',
      '/configuracion'
    ];

    expectedHrefs.forEach(href => {
      const link = compiled.querySelector(`a[href="${href}"]`);
      expect(link).withContext(`Enlace a ruta ${href} debe existir`).toBeTruthy();
    });
  });

  it('debe tener el ítem de Búsqueda permanente en la barra de navegación (D-06)', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    const searchDesktop = compiled.querySelector('#nav-desktop-busqueda');
    expect(searchDesktop).toBeTruthy();
    expect(searchDesktop?.textContent).toContain('Búsqueda');
  });

  it('debe mostrar el botón global flotante (+) en el shell', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    const desktopFab = compiled.querySelector('#global-add-btn');
    expect(desktopFab).toBeTruthy();
    expect(desktopFab?.textContent).toContain('+');
  });

  it('debe desplegar el menú de exactamente 4 opciones al hacer click en el botón + (D-02)', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    fixture.detectChanges();

    expect(app.isQuickMenuOpen()).toBeFalse();

    // Abrir menú
    app.toggleQuickMenu();
    fixture.detectChanges();

    expect(app.isQuickMenuOpen()).toBeTrue();
    const compiled = fixture.nativeElement as HTMLElement;

    const quickMenu = compiled.querySelector('#quick-creation-menu');
    expect(quickMenu).toBeTruthy();

    const optionInbox = compiled.querySelector('#quick-option-inbox');
    const optionNota = compiled.querySelector('#quick-option-nota');
    const optionTarea = compiled.querySelector('#quick-option-tarea');
    const optionEvento = compiled.querySelector('#quick-option-evento');

    expect(optionInbox).withContext('Opción Captura rápida debe existir').toBeTruthy();
    expect(optionNota).withContext('Opción Nueva nota debe existir').toBeTruthy();
    expect(optionTarea).withContext('Opción Nueva tarea debe existir').toBeTruthy();
    expect(optionEvento).withContext('Opción Nuevo evento debe existir').toBeTruthy();

    // Cerrar menú
    app.closeQuickMenu();
    fixture.detectChanges();
    expect(app.isQuickMenuOpen()).toBeFalse();
  });

  it('debe abrir los formularios correspondientes según la opción rápida seleccionada (T-03.2)', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    fixture.detectChanges();

    // 1. Captura rápida (Inbox)
    app.onQuickAction('inbox');
    expect(app.isCapturaModalOpen).toBeTrue();
    app.closeCapturaModal();
    expect(app.isCapturaModalOpen).toBeFalse();

    // 2. Nueva nota
    app.onQuickAction('nota');
    expect(app.isNotaModalOpen).toBeTrue();
    app.closeNotaModal();
    expect(app.isNotaModalOpen).toBeFalse();

    // 3. Nueva tarea
    app.onQuickAction('tarea');
    expect(app.isTareaModalOpen).toBeTrue();
    app.closeTareaModal();
    expect(app.isTareaModalOpen).toBeFalse();

    // 4. Nuevo evento
    app.onQuickAction('evento');
    expect(app.isEventoModalOpen).toBeTrue();
    app.closeEventoModal();
    expect(app.isEventoModalOpen).toBeFalse();
  });
});

