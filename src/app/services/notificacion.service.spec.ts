import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { NotificacionService } from './notificacion.service';
import { RecordatorioService } from './recordatorio.service';
import { DatabaseService } from '../repositories/database.service';
import { Recordatorio, Tarea, Evento } from '../models';

describe('NotificacionService (T-07.2 & T-07.3)', () => {
  let service: NotificacionService;
  let recordatorioServiceSpy: jasmine.SpyObj<RecordatorioService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let dbService: DatabaseService;

  const mockRecordatorioTarea: Recordatorio = {
    id: 101,
    titulo: 'Entregar informe',
    fechaHora: '2026-09-01T10:00:00.000Z',
    tareaId: 5,
    eventoId: null,
    notificado: false
  };

  const mockRecordatorioEvento: Recordatorio = {
    id: 102,
    titulo: 'Reunión kickoff',
    fechaHora: '2026-09-01T11:00:00.000Z',
    tareaId: null,
    eventoId: 8,
    notificado: false
  };

  const mockTarea: Tarea = {
    id: 5,
    titulo: 'Informe Trimestral',
    descripcion: 'Consolidar métricas',
    prioridad: 'Urgente',
    estado: 'Pendiente',
    fechaLimite: null,
    espacioId: null,
    fechaCreacion: '2026-09-01',
    fechaActualizacion: '2026-09-01'
  };

  const mockEvento: Evento = {
    id: 8,
    titulo: 'Reunión de Equipo',
    descripcion: 'Kickoff Q4',
    fechaInicio: '2026-09-01T11:00:00.000Z',
    fechaFin: '2026-09-01T12:00:00.000Z',
    espacioId: null,
    fechaCreacion: '2026-09-01'
  };

  beforeEach(async () => {
    recordatorioServiceSpy = jasmine.createSpyObj('RecordatorioService', [
      'getPendientesNotificar',
      'marcarNotificado',
      'create'
    ]);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        NotificacionService,
        DatabaseService,
        { provide: RecordatorioService, useValue: recordatorioServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    service = TestBed.inject(NotificacionService);
    dbService = TestBed.inject(DatabaseService);

    await dbService.tareas.clear();
    await dbService.eventos.clear();
    await dbService.tareas.add(mockTarea);
    await dbService.eventos.add(mockEvento);

    recordatorioServiceSpy.getPendientesNotificar.and.returnValue(Promise.resolve([]));
    recordatorioServiceSpy.marcarNotificado.and.returnValue(Promise.resolve(mockRecordatorioTarea));
  });

  afterEach(async () => {
    service.detenerMonitoreo();
    await dbService.tareas.clear();
    await dbService.eventos.clear();
  });

  it('debe crearse correctamente e inicializar el estado del permiso', () => {
    expect(service).toBeTruthy();
    expect(service.permiso()).toBeDefined();
  });

  describe('Flujo de solicitud de permiso con explicación previa (T-07.2)', () => {
    it('debe mostrar el modal explicativo si el estado es default', (done) => {
      spyOn(service, 'isSupported').and.returnValue(true);
      (window as unknown as { Notification: { permission: NotificationPermission } }).Notification = { permission: 'default' };
      service.permiso.set('default');

      void service.solicitarPermisoConExplicacion();
      expect(service.mostrarModalExplicativo()).toBeTrue();
      done();
    });

    it('al confirmar la explicación, solicita permiso a la Notification API y actualiza la señal', async () => {
      spyOn(service, 'isSupported').and.returnValue(true);
      const requestSpy = jasmine.createSpy('requestPermission').and.returnValue(Promise.resolve('granted'));
      (window as unknown as { Notification: { permission: NotificationPermission; requestPermission: () => Promise<NotificationPermission> } }).Notification = {
        permission: 'default',
        requestPermission: requestSpy
      };

      const promesa = service.solicitarPermisoConExplicacion();
      expect(service.mostrarModalExplicativo()).toBeTrue();

      await service.onConfirmarExplicacion();
      const resultado = await promesa;

      expect(requestSpy).toHaveBeenCalled();
      expect(service.permiso()).toBe('granted');
      expect(resultado).toBe('granted');
      expect(service.mostrarModalExplicativo()).toBeFalse();
      expect(service.mensajeDenegadoVisible()).toBeFalse();
    });

    it('si el usuario deniega el permiso, informa que los recordatorios se guardarán sin notificaciones', async () => {
      spyOn(service, 'isSupported').and.returnValue(true);
      const requestSpy = jasmine.createSpy('requestPermission').and.returnValue(Promise.resolve('denied'));
      (window as unknown as { Notification: { permission: NotificationPermission; requestPermission: () => Promise<NotificationPermission> } }).Notification = {
        permission: 'default',
        requestPermission: requestSpy
      };

      const promesa = service.solicitarPermisoConExplicacion();
      await service.onConfirmarExplicacion();
      const resultado = await promesa;

      expect(service.permiso()).toBe('denied');
      expect(resultado).toBe('denied');
      expect(service.mensajeDenegadoVisible()).toBeTrue();
    });

    it('al cancelar la explicación, cierra el modal y no pide permiso al navegador', async () => {
      const promesa = service.solicitarPermisoConExplicacion();
      service.onCancelarExplicacion();
      const res = await promesa;

      expect(res).toBe('default');
      expect(service.mostrarModalExplicativo()).toBeFalse();
    });
  });

  describe('Notificaciones locales en app activa (T-07.3)', () => {
    it('debe detectar recordatorios vencidos y marcarlos como notificados', async () => {
      recordatorioServiceSpy.getPendientesNotificar.and.returnValue(
        Promise.resolve([mockRecordatorioTarea, mockRecordatorioEvento])
      );
      service.permiso.set('granted');

      const count = await service.comprobarYDispararRecordatorios();
      expect(count).toBe(2);
      expect(recordatorioServiceSpy.marcarNotificado).toHaveBeenCalledWith(101);
      expect(recordatorioServiceSpy.marcarNotificado).toHaveBeenCalledWith(102);
    });

    it('debe iniciar y detener el monitoreo periódico sin errores', () => {
      service.iniciarMonitoreo(5000);
      expect(() => service.detenerMonitoreo()).not.toThrow();
    });
  });

  describe('Pruebas de Notificaciones en Dispositivos Reales y Plataformas (T-07.6)', () => {
    it('enviarNotificacionPrueba debe retornar false si el permiso no está otorgado', async () => {
      service.permiso.set('default');
      const res = await service.enviarNotificacionPrueba();
      expect(res).toBeFalse();
    });

    it('enviarNotificacionPrueba debe retornar false si la plataforma no soporta notificaciones', async () => {
      spyOn(service, 'isSupported').and.returnValue(false);
      service.permiso.set('granted');
      const res = await service.enviarNotificacionPrueba();
      expect(res).toBeFalse();
    });

    it('enviarNotificacionPrueba debe emitir vía ServiceWorker showNotification cuando controller está activo (PWA / Android)', async () => {
      spyOn(service, 'isSupported').and.returnValue(true);
      service.permiso.set('granted');

      const showNotificationSpy = jasmine.createSpy('showNotification').and.resolveTo();
      const mockRegistration = { showNotification: showNotificationSpy } as unknown as ServiceWorkerRegistration;

      const originalServiceWorker = navigator.serviceWorker;
      Object.defineProperty(navigator, 'serviceWorker', {
        value: {
          controller: {},
          ready: Promise.resolve(mockRegistration)
        },
        configurable: true
      });

      const res = await service.enviarNotificacionPrueba();
      expect(res).toBeTrue();
      expect(showNotificationSpy).toHaveBeenCalledWith(
        jasmine.stringContaining('MindDump: Alerta de Prueba'),
        jasmine.objectContaining({
          icon: 'favicon.ico',
          data: { url: '/configuracion' }
        })
      );

      Object.defineProperty(navigator, 'serviceWorker', {
        value: originalServiceWorker,
        configurable: true
      });
    });

    it('programarPruebaEnSegundoPlano debe persistir recordatorio para tiempo futuro y retornar el registro', async () => {
      const mockCreado: Recordatorio = {
        id: 77,
        titulo: '🧪 Alerta de Prueba en Segundo Plano',
        fechaHora: new Date(Date.now() + 5000).toISOString(),
        tareaId: null,
        eventoId: null,
        notificado: false
      };
      recordatorioServiceSpy.create.and.resolveTo(mockCreado);

      const res = await service.programarPruebaEnSegundoPlano(5);
      expect(recordatorioServiceSpy.create).toHaveBeenCalledWith(jasmine.objectContaining({
        titulo: '🧪 Alerta de Prueba en Segundo Plano'
      }));
      expect(res.id).toBe(77);
    });

    it('debe comprobar recordatorios al disparar eventos window focus y document visibilitychange', () => {
      const spyComprobar = spyOn(service, 'comprobarYDispararRecordatorios').and.resolveTo(0);
      service.iniciarMonitoreo(60000);

      window.dispatchEvent(new Event('focus'));
      expect(spyComprobar).toHaveBeenCalled();

      document.dispatchEvent(new Event('visibilitychange'));
      expect(spyComprobar).toHaveBeenCalled();

      service.detenerMonitoreo();
    });

    it('al pulsar una notificación estándar debe enfocar la ventana y navegar a la ruta destino', async () => {
      spyOn(service, 'isSupported').and.returnValue(true);
      service.permiso.set('granted');

      let capturedOnclick: (() => void) | null = null;
      const closeSpy = jasmine.createSpy('close');

      class MockNotification {
        set onclick(handler: () => void) {
          capturedOnclick = handler;
        }
        close = closeSpy;
        constructor(public title: string, public options?: NotificationOptions) {}
      }

      const originalNotification = (window as unknown as { Notification?: unknown }).Notification;
      (window as unknown as { Notification: unknown }).Notification = MockNotification;

      const originalServiceWorker = navigator.serviceWorker;
      Object.defineProperty(navigator, 'serviceWorker', {
        value: { controller: null },
        configurable: true
      });

      const spyFocus = spyOn(window, 'focus');
      const res = await service.enviarNotificacionPrueba();
      expect(res).toBeTrue();
      expect(capturedOnclick).not.toBeNull();

      if (capturedOnclick) {
        (capturedOnclick as () => void)();
        expect(spyFocus).toHaveBeenCalled();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/configuracion']);
        expect(closeSpy).toHaveBeenCalled();
      }

      (window as unknown as { Notification: unknown }).Notification = originalNotification;
      Object.defineProperty(navigator, 'serviceWorker', {
        value: originalServiceWorker,
        configurable: true
      });
    });
  });
});
