import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfiguracionComponent } from './configuracion.component';
import { NotificacionService } from '../../services/notificacion.service';
import { TemaService } from '../../services/tema.service';
import { PwaUpdateService } from '../../services/pwa-update.service';
import { AppInitService } from '../../services/init.service';
import { InboxService } from '../../services/inbox.service';
import { NotaService } from '../../services/nota.service';
import { TareaService } from '../../services/tarea.service';
import { EventoService } from '../../services/evento.service';
import { EspacioService } from '../../services/espacio.service';
import { RecordatorioService } from '../../services/recordatorio.service';
import { BackupService } from '../../services/backup.service';
import { signal } from '@angular/core';

describe('ConfiguracionComponent (T-11.1 & T-11.2)', () => {
  let component: ConfiguracionComponent;
  let fixture: ComponentFixture<ConfiguracionComponent>;
  let notifServiceSpy: jasmine.SpyObj<NotificacionService>;
  let temaServiceSpy: jasmine.SpyObj<TemaService>;
  let pwaUpdateServiceSpy: jasmine.SpyObj<PwaUpdateService>;
  let appInitServiceSpy: jasmine.SpyObj<AppInitService>;
  let inboxServiceSpy: jasmine.SpyObj<InboxService>;
  let notaServiceSpy: jasmine.SpyObj<NotaService>;
  let tareaServiceSpy: jasmine.SpyObj<TareaService>;
  let eventoServiceSpy: jasmine.SpyObj<EventoService>;
  let espacioServiceSpy: jasmine.SpyObj<EspacioService>;
  let recordatorioServiceSpy: jasmine.SpyObj<RecordatorioService>;
  let backupServiceSpy: jasmine.SpyObj<BackupService>;

  const temaSignal = signal<'dark' | 'light'>('dark');

  beforeEach(async () => {
    temaSignal.set('dark');

    notifServiceSpy = jasmine.createSpyObj('NotificacionService', [
      'actualizarEstadoPermiso',
      'solicitarPermisoConExplicacion',
      'onConfirmarExplicacion',
      'onCancelarExplicacion',
      'enviarNotificacionPrueba',
      'programarPruebaEnSegundoPlano'
    ], {
      permiso: jasmine.createSpy('permiso').and.returnValue('default'),
      mostrarModalExplicativo: jasmine.createSpy('mostrarModalExplicativo').and.returnValue(false),
      mensajeDenegadoVisible: jasmine.createSpy('mensajeDenegadoVisible').and.returnValue(false)
    });
    notifServiceSpy.enviarNotificacionPrueba.and.resolveTo(true);
    notifServiceSpy.programarPruebaEnSegundoPlano.and.resolveTo({
      id: 99,
      titulo: 'Test',
      fechaHora: new Date().toISOString(),
      notificado: false
    });

    temaServiceSpy = jasmine.createSpyObj('TemaService', ['setTema', 'toggleTema'], {
      tema: temaSignal
    });

    pwaUpdateServiceSpy = jasmine.createSpyObj('PwaUpdateService', [
      'comprobarActualizacion',
      'actualizar',
      'posponer'
    ], {
      nuevaVersionDisponible: signal(false),
      pospuesto: signal(false),
      comprobando: signal(false)
    });

    appInitServiceSpy = jasmine.createSpyObj('AppInitService', ['borrarTodoYReiniciar', 'initUtilesSpace']);
    appInitServiceSpy.borrarTodoYReiniciar.and.resolveTo({
      id: 1,
      nombre: 'Útiles',
      esSistema: true,
      color: '#6366f1',
      fechaCreacion: new Date().toISOString()
    });

    inboxServiceSpy = jasmine.createSpyObj('InboxService', ['refresh']);
    notaServiceSpy = jasmine.createSpyObj('NotaService', ['refresh']);
    tareaServiceSpy = jasmine.createSpyObj('TareaService', ['refresh']);
    eventoServiceSpy = jasmine.createSpyObj('EventoService', ['cargarEventos']);
    espacioServiceSpy = jasmine.createSpyObj('EspacioService', ['loadAll']);
    recordatorioServiceSpy = jasmine.createSpyObj('RecordatorioService', ['loadAll']);
    backupServiceSpy = jasmine.createSpyObj('BackupService', ['descargarRespaldo', 'restaurarBackup']);
    backupServiceSpy.descargarRespaldo.and.resolveTo('minddump_respaldo_test.json');
    backupServiceSpy.restaurarBackup.and.resolveTo({ exito: true, totalImportados: 5, detalles: { espacios: 1, inbox: 1, notas: 1, tareas: 1, eventos: 1, recordatorios: 0 }, mensaje: 'OK' });

    await TestBed.configureTestingModule({
      imports: [ConfiguracionComponent],
      providers: [
        { provide: NotificacionService, useValue: notifServiceSpy },
        { provide: TemaService, useValue: temaServiceSpy },
        { provide: PwaUpdateService, useValue: pwaUpdateServiceSpy },
        { provide: AppInitService, useValue: appInitServiceSpy },
        { provide: InboxService, useValue: inboxServiceSpy },
        { provide: NotaService, useValue: notaServiceSpy },
        { provide: TareaService, useValue: tareaServiceSpy },
        { provide: EventoService, useValue: eventoServiceSpy },
        { provide: EspacioService, useValue: espacioServiceSpy },
        { provide: RecordatorioService, useValue: recordatorioServiceSpy },
        { provide: BackupService, useValue: backupServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ConfiguracionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });


  it('debe mostrar la seccion de respaldo y llamar a descargarRespaldo al hacer clic', async () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('#section-respaldo-soberano')).toBeTruthy();

    await component.onDescargarRespaldo();
    expect(backupServiceSpy.descargarRespaldo).toHaveBeenCalled();
    expect(component.mensajeBackup()).toContain('minddump_respaldo_test.json');
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe mostrar las secciones requeridas visualmente separadas (T-11.1)', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('#section-tema-visual')).toBeTruthy();
    expect(compiled.querySelector('#section-notificaciones')).toBeTruthy();
    expect(compiled.querySelector('#section-estado-pwa')).toBeTruthy();
    expect(compiled.querySelector('#section-info-version')).toBeTruthy();
    expect(compiled.querySelector('#section-borrar-datos')).toBeTruthy();
  });

  it('debe permitir seleccionar el modo claro y modo oscuro (T-11.1 Tema Visual)', () => {
    const btnClaro = fixture.nativeElement.querySelector('#btn-tema-claro') as HTMLButtonElement;
    btnClaro.click();
    expect(temaServiceSpy.setTema).toHaveBeenCalledWith('light');

    const btnOscuro = fixture.nativeElement.querySelector('#btn-tema-oscuro') as HTMLButtonElement;
    btnOscuro.click();
    expect(temaServiceSpy.setTema).toHaveBeenCalledWith('dark');
  });

  it('debe mostrar el estado del permiso de notificación y solicitar permiso al pulsar (T-11.1)', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Permisos de Notificación');
    expect(compiled.textContent).toContain('🟡 Pendiente');

    const btn = fixture.nativeElement.querySelector('#btn-solicitar-permiso-notif') as HTMLButtonElement;
    btn.click();
    expect(notifServiceSpy.solicitarPermisoConExplicacion).toHaveBeenCalled();
  });

  it('debe permitir probar notificación inmediata cuando el permiso está concedido (T-07.6)', async () => {
    (notifServiceSpy.permiso as jasmine.Spy).and.returnValue('granted');
    fixture.detectChanges();

    const btnProbar = fixture.nativeElement.querySelector('#btn-probar-notificacion') as HTMLButtonElement;
    expect(btnProbar).toBeTruthy();

    btnProbar.click();
    expect(notifServiceSpy.enviarNotificacionPrueba).toHaveBeenCalled();
  });

  it('debe permitir programar notificación de prueba en segundo plano cuando el permiso está concedido (T-07.6)', async () => {
    (notifServiceSpy.permiso as jasmine.Spy).and.returnValue('granted');
    fixture.detectChanges();

    const btnSegundoPlano = fixture.nativeElement.querySelector('#btn-probar-notificacion-segundo-plano') as HTMLButtonElement;
    expect(btnSegundoPlano).toBeTruthy();

    btnSegundoPlano.click();
    expect(notifServiceSpy.programarPruebaEnSegundoPlano).toHaveBeenCalledWith(5);
  });

  it('debe mostrar información de versión y estado de PWA (T-11.1)', () => {
    const versionBadge = fixture.nativeElement.querySelector('#badge-version-app') as HTMLElement;
    expect(versionBadge).toBeTruthy();
    expect(versionBadge.textContent).toContain('v1.0.0-mvp');

    const pwaBadge = fixture.nativeElement.querySelector('#badge-estado-pwa') as HTMLElement;
    expect(pwaBadge).toBeTruthy();
  });

  it('debe permitir comprobar actualizaciones de la PWA (T-11.2)', () => {
    const btnCheck = fixture.nativeElement.querySelector('#btn-comprobar-actualizaciones') as HTMLButtonElement;
    btnCheck.click();
    expect(pwaUpdateServiceSpy.comprobarActualizacion).toHaveBeenCalled();
  });

  it('debe abrir el modal de doble confirmación al pulsar Borrar todo (T-11.1)', () => {
    expect(component.mostrarModalBorrado()).toBeFalse();

    const btnReset = fixture.nativeElement.querySelector('#btn-reset-data') as HTMLButtonElement;
    btnReset.click();

    expect(component.mostrarModalBorrado()).toBeTrue();
  });

  it('debe ejecutar el borrado total, recrear Útiles y recargar servicios al confirmar (T-11.1)', async () => {
    await component.ejecutarBorradoTotal();

    expect(appInitServiceSpy.borrarTodoYReiniciar).toHaveBeenCalled();
    expect(inboxServiceSpy.refresh).toHaveBeenCalled();
    expect(notaServiceSpy.refresh).toHaveBeenCalled();
    expect(tareaServiceSpy.refresh).toHaveBeenCalled();
    expect(eventoServiceSpy.cargarEventos).toHaveBeenCalled();
    expect(espacioServiceSpy.loadAll).toHaveBeenCalled();
    expect(recordatorioServiceSpy.loadAll).toHaveBeenCalled();

    expect(component.mensajeExitoBorrado()).toBeTrue();
  });
});
