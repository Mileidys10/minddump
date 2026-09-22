import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InicioComponent } from './inicio.component';
import { InboxService } from '../../services/inbox.service';
import { TareaService } from '../../services/tarea.service';
import { EventoService } from '../../services/evento.service';
import { EspacioService } from '../../services/espacio.service';
import { NotaService } from '../../services/nota.service';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { InboxItem, Tarea, Evento, Espacio, Nota } from '../../models';

describe('InicioComponent (T-10.1 & T-10.2 Dashboard MVP)', () => {
  let component: InicioComponent;
  let fixture: ComponentFixture<InicioComponent>;

  let inboxServiceSpy: jasmine.SpyObj<InboxService>;
  let tareaServiceSpy: jasmine.SpyObj<TareaService>;
  let eventoServiceSpy: jasmine.SpyObj<EventoService>;
  let espacioServiceSpy: jasmine.SpyObj<EspacioService>;
  let notaServiceSpy: jasmine.SpyObj<NotaService>;

  const pendientesSignal = signal<InboxItem[]>([]);
  const tareasSignal = signal<Tarea[]>([]);
  const eventosSignal = signal<Evento[]>([]);
  const espaciosSignal = signal<Espacio[]>([]);
  const notasSignal = signal<Nota[]>([]);

  beforeEach(async () => {
    pendientesSignal.set([]);
    tareasSignal.set([]);
    eventosSignal.set([]);
    espaciosSignal.set([]);
    notasSignal.set([]);

    inboxServiceSpy = jasmine.createSpyObj('InboxService', [
      'refresh',
      'marcarOrganizado'
    ], {
      pendientes: pendientesSignal,
      totalPendientes: signal(0)
    });
    inboxServiceSpy.refresh.and.resolveTo();
    inboxServiceSpy.marcarOrganizado.and.resolveTo();

    tareaServiceSpy = jasmine.createSpyObj('TareaService', [
      'getAll',
      'create',
      'update',
      'delete',
      'cambiarEstado'
    ], {
      tareas: tareasSignal
    });
    const dummyTarea: Tarea = { id: 1, titulo: '', estado: 'Pendiente', prioridad: 'Normal', espacioId: null, fechaCreacion: '', fechaActualizacion: '' };
    const dummyNota: Nota = { id: 1, titulo: '', contenido: '', categoria: '', espacioId: null, fechaCreacion: '', fechaActualizacion: '' };

    tareaServiceSpy.getAll.and.resolveTo([]);
    tareaServiceSpy.create.and.resolveTo(dummyTarea);
    tareaServiceSpy.update.and.resolveTo();
    tareaServiceSpy.delete.and.resolveTo();
    tareaServiceSpy.cambiarEstado.and.resolveTo();

    eventoServiceSpy = jasmine.createSpyObj('EventoService', [
      'cargarEventos',
      'update',
      'delete'
    ], {
      eventos: eventosSignal
    });
    eventoServiceSpy.cargarEventos.and.resolveTo();
    eventoServiceSpy.update.and.resolveTo();
    eventoServiceSpy.delete.and.resolveTo();

    espacioServiceSpy = jasmine.createSpyObj('EspacioService', ['loadAll'], {
      espacios: espaciosSignal
    });
    espacioServiceSpy.loadAll.and.resolveTo([]);

    notaServiceSpy = jasmine.createSpyObj('NotaService', ['create', 'refresh'], {
      notas: notasSignal
    });
    notaServiceSpy.create.and.resolveTo(dummyNota);
    notaServiceSpy.refresh.and.resolveTo();

    await TestBed.configureTestingModule({
      imports: [InicioComponent],
      providers: [
        provideRouter([]),
        { provide: InboxService, useValue: inboxServiceSpy },
        { provide: TareaService, useValue: tareaServiceSpy },
        { provide: EventoService, useValue: eventoServiceSpy },
        { provide: EspacioService, useValue: espacioServiceSpy },
        { provide: NotaService, useValue: notaServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(InicioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  describe('Accesos Rápidos (T-10.2)', () => {
    it('debe mostrar accesos directos visibles a Inbox, Notas, Tareas y Eventos', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const linkInbox = compiled.querySelector('#quicklink-inbox');
      const linkNotas = compiled.querySelector('#quicklink-notas');
      const linkTareas = compiled.querySelector('#quicklink-tareas');
      const linkEventos = compiled.querySelector('#quicklink-eventos');

      expect(linkInbox).toBeTruthy();
      expect(linkNotas).toBeTruthy();
      expect(linkTareas).toBeTruthy();
      expect(linkEventos).toBeTruthy();
    });
  });

  describe('Resumen de Inbox Reciente (T-10.1 & R-18)', () => {
    it('debe mostrar las últimas 5 capturas del Inbox pendientes de organizar ordenadas por fecha reciente', () => {
      const mockItems: InboxItem[] = [
        { id: 1, titulo: 'Captura 1 antigua', organizado: false, fechaCreacion: '2026-09-01T10:00:00Z' },
        { id: 2, titulo: 'Captura 2', organizado: false, fechaCreacion: '2026-09-02T10:00:00Z' },
        { id: 3, titulo: 'Captura 3', organizado: false, fechaCreacion: '2026-09-03T10:00:00Z' },
        { id: 4, titulo: 'Captura 4', organizado: false, fechaCreacion: '2026-09-04T10:00:00Z' },
        { id: 5, titulo: 'Captura 5', organizado: false, fechaCreacion: '2026-09-05T10:00:00Z' },
        { id: 6, titulo: 'Captura 6 mas reciente', organizado: false, fechaCreacion: '2026-09-06T10:00:00Z' },
        { id: 7, titulo: 'Captura organizada', organizado: true, fechaCreacion: '2026-09-07T10:00:00Z' }
      ];

      pendientesSignal.set(mockItems.filter(i => !i.organizado));
      fixture.detectChanges();

      const resultado = component.capturasInboxRecientes();
      expect(resultado.length).toBe(5); // Exactamente 5 por R-18
      expect(resultado[0].titulo).toBe('Captura 6 mas reciente'); // La más reciente primero
      expect(resultado[4].titulo).toBe('Captura 2');

      const card = fixture.nativeElement.querySelector('#dashboard-inbox-item-6');
      expect(card).toBeTruthy();
      expect(card.textContent).toContain('Captura 6 mas reciente');
    });

    it('debe mostrar estado vacío cuando no hay capturas pendientes en Inbox', () => {
      pendientesSignal.set([]);
      fixture.detectChanges();

      const empty = fixture.nativeElement.querySelector('#empty-inbox');
      expect(empty).toBeTruthy();
      expect(empty.textContent).toContain('¡Inbox despejado!');
    });

    it('debe abrir modal de organización al hacer clic en un item de Inbox (T-10.1)', () => {
      pendientesSignal.set([
        { id: 10, titulo: 'Idea genial', organizado: false, fechaCreacion: '2026-09-20T10:00:00Z' }
      ]);
      fixture.detectChanges();

      const itemCard = fixture.nativeElement.querySelector('#dashboard-inbox-item-10') as HTMLElement;
      expect(itemCard).toBeTruthy();

      itemCard.click();
      fixture.detectChanges();

      expect(component.isConvertInboxModalOpen).toBeTrue();
      expect(component.inboxItemSeleccionado?.id).toBe(10);
    });
  });

  describe('Resumen de Tareas Activas (T-10.1)', () => {
    it('debe mostrar solo tareas Pendiente o En progreso ordenadas por prioridad y fecha límite', () => {
      const mockTareas: Tarea[] = [
        { id: 1, titulo: 'Tarea Baja lejana', estado: 'Pendiente', prioridad: 'Baja', fechaLimite: '2026-10-15T00:00:00Z', espacioId: null, fechaCreacion: '', fechaActualizacion: '' },
        { id: 2, titulo: 'Tarea Urgente proxima', estado: 'Pendiente', prioridad: 'Urgente', fechaLimite: '2026-10-01T00:00:00Z', espacioId: null, fechaCreacion: '', fechaActualizacion: '' },
        { id: 3, titulo: 'Tarea Normal', estado: 'En progreso', prioridad: 'Normal', fechaLimite: '2026-10-05T00:00:00Z', espacioId: null, fechaCreacion: '', fechaActualizacion: '' },
        { id: 4, titulo: 'Tarea Urgente sin fecha', estado: 'Pendiente', prioridad: 'Urgente', fechaLimite: null, espacioId: null, fechaCreacion: '', fechaActualizacion: '' },
        { id: 5, titulo: 'Tarea Completada', estado: 'Completada', prioridad: 'Urgente', fechaLimite: '2026-09-01T00:00:00Z', espacioId: null, fechaCreacion: '', fechaActualizacion: '' },
        { id: 6, titulo: 'Tarea Cancelada', estado: 'Cancelada', prioridad: 'Normal', fechaLimite: '2026-09-01T00:00:00Z', espacioId: null, fechaCreacion: '', fechaActualizacion: '' }
      ];

      tareasSignal.set(mockTareas);
      fixture.detectChanges();

      const resultado = component.tareasPendientes();
      expect(resultado.length).toBe(4); // Excluye Completada y Cancelada

      // 1°: Urgente con fecha límite
      expect(resultado[0].titulo).toBe('Tarea Urgente proxima');
      // 2°: Urgente sin fecha límite
      expect(resultado[1].titulo).toBe('Tarea Urgente sin fecha');
      // 3°: Normal
      expect(resultado[2].titulo).toBe('Tarea Normal');
      // 4°: Baja
      expect(resultado[3].titulo).toBe('Tarea Baja lejana');

      const cardUrgente = fixture.nativeElement.querySelector('#dashboard-tarea-item-2');
      expect(cardUrgente).toBeTruthy();
      expect(cardUrgente.textContent).toContain('Tarea Urgente proxima');
    });

    it('debe mostrar estado vacío cuando no hay tareas activas', () => {
      tareasSignal.set([]);
      fixture.detectChanges();

      const empty = fixture.nativeElement.querySelector('#empty-tareas');
      expect(empty).toBeTruthy();
      expect(empty.textContent).toContain('¡Todo al día!');
    });

    it('debe abrir modal de detalle de tarea al hacer clic en la tarjeta (T-10.1)', () => {
      tareasSignal.set([
        { id: 99, titulo: 'Revisar servidor', estado: 'Pendiente', prioridad: 'Urgente', espacioId: null, fechaCreacion: '', fechaActualizacion: '' }
      ]);
      fixture.detectChanges();

      const itemCard = fixture.nativeElement.querySelector('#dashboard-tarea-item-99') as HTMLElement;
      expect(itemCard).toBeTruthy();

      itemCard.click();
      fixture.detectChanges();

      expect(component.isDetalleTareaModalOpen).toBeTrue();
      expect(component.tareaSeleccionada?.id).toBe(99);
    });
  });

  describe('Resumen de Próximos Eventos (T-10.1)', () => {
    it('debe mostrar eventos con fechaInicio >= hoy ordenados cronológicamente', () => {
      const hoy = new Date();
      const pasado = new Date(hoy.getTime() - 86400000 * 5).toISOString();
      const hoyTarde = new Date(hoy.getTime() + 3600000 * 2).toISOString();
      const manana = new Date(hoy.getTime() + 86400000).toISOString();
      const proximaSemana = new Date(hoy.getTime() + 86400000 * 7).toISOString();

      const mockEventos: Evento[] = [
        { id: 1, titulo: 'Evento pasado', fechaInicio: pasado, fechaFin: pasado, espacioId: null, fechaCreacion: '' },
        { id: 2, titulo: 'Evento proxima semana', fechaInicio: proximaSemana, fechaFin: proximaSemana, espacioId: null, fechaCreacion: '' },
        { id: 3, titulo: 'Evento hoy tarde', fechaInicio: hoyTarde, fechaFin: hoyTarde, espacioId: null, fechaCreacion: '' },
        { id: 4, titulo: 'Evento manana', fechaInicio: manana, fechaFin: manana, espacioId: null, fechaCreacion: '' }
      ];

      eventosSignal.set(mockEventos);
      fixture.detectChanges();

      const resultado = component.proximosEventos();
      expect(resultado.length).toBe(3); // Excluye evento pasado

      expect(resultado[0].titulo).toBe('Evento hoy tarde');
      expect(resultado[1].titulo).toBe('Evento manana');
      expect(resultado[2].titulo).toBe('Evento proxima semana');

      const card = fixture.nativeElement.querySelector('#dashboard-evento-item-3');
      expect(card).toBeTruthy();
      expect(card.textContent).toContain('Evento hoy tarde');
    });

    it('debe mostrar estado vacío cuando no hay próximos eventos', () => {
      eventosSignal.set([]);
      fixture.detectChanges();

      const empty = fixture.nativeElement.querySelector('#empty-eventos');
      expect(empty).toBeTruthy();
      expect(empty.textContent).toContain('Sin eventos programados');
    });

    it('debe abrir modal de detalle de evento al hacer clic en la tarjeta (T-10.1)', () => {
      const hoy = new Date().toISOString();
      eventosSignal.set([
        { id: 77, titulo: 'Reunión de Fábrica', fechaInicio: hoy, fechaFin: hoy, espacioId: null, fechaCreacion: '' }
      ]);
      fixture.detectChanges();

      const card = fixture.nativeElement.querySelector('#dashboard-evento-item-77') as HTMLElement;
      expect(card).toBeTruthy();

      card.click();
      fixture.detectChanges();

      expect(component.isDetalleEventoModalOpen).toBeTrue();
      expect(component.eventoSeleccionado?.id).toBe(77);
    });
  });

  describe('Acciones de Gestión desde Modales (T-10.1)', () => {
    it('debe cambiar el estado de una tarea y actualizar tareaSeleccionada', async () => {
      component.tareaSeleccionada = { id: 1, titulo: 'Tarea 1', estado: 'Pendiente', prioridad: 'Normal', espacioId: null, fechaCreacion: '', fechaActualizacion: '' };
      await component.cambiarEstadoTarea({ id: 1, nuevoEstado: 'Completada' });

      expect(tareaServiceSpy.cambiarEstado).toHaveBeenCalledWith(1, 'Completada');
      expect(component.tareaSeleccionada.estado).toBe('Completada');
    });

    it('debe guardar cambios de tarea editada y cerrar modal de edición', async () => {
      component.tareaParaEditar = { id: 5, titulo: 'Tarea previa', estado: 'Pendiente', prioridad: 'Normal', espacioId: null, fechaCreacion: '', fechaActualizacion: '' };
      component.isEditarTareaModalOpen = true;

      await component.guardarTareaEditada({ titulo: 'Tarea modificada' });

      expect(tareaServiceSpy.update).toHaveBeenCalledWith(5, { titulo: 'Tarea modificada' });
      expect(component.isEditarTareaModalOpen).toBeFalse();
    });

    it('debe eliminar una tarea y cerrar modal de detalle', async () => {
      component.isDetalleTareaModalOpen = true;
      await component.eliminarTarea({ id: 9, titulo: 'Tarea a borrar', estado: 'Pendiente', prioridad: 'Baja', espacioId: null, fechaCreacion: '', fechaActualizacion: '' });

      expect(tareaServiceSpy.delete).toHaveBeenCalledWith(9);
      expect(component.isDetalleTareaModalOpen).toBeFalse();
    });

    it('debe guardar cambios de evento editado y cerrar modal de edición', async () => {
      component.eventoParaEditar = { id: 12, titulo: 'Evento previo', fechaInicio: '', fechaFin: '', espacioId: null, fechaCreacion: '' };
      component.isEditarEventoModalOpen = true;

      await component.guardarEventoEditado({ titulo: 'Evento modificado' });

      expect(eventoServiceSpy.update).toHaveBeenCalledWith(12, { titulo: 'Evento modificado' });
      expect(component.isEditarEventoModalOpen).toBeFalse();
      expect(eventoServiceSpy.cargarEventos).toHaveBeenCalled();
    });

    it('debe eliminar un evento y cerrar modal de detalle', async () => {
      component.isDetalleEventoModalOpen = true;
      await component.eliminarEvento({ id: 15, titulo: 'Evento a borrar', fechaInicio: '', fechaFin: '', espacioId: null, fechaCreacion: '' });

      expect(eventoServiceSpy.delete).toHaveBeenCalledWith(15);
      expect(component.isDetalleEventoModalOpen).toBeFalse();
      expect(eventoServiceSpy.cargarEventos).toHaveBeenCalled();
    });

    it('debe convertir captura a nota, marcar organizado y refrescar inbox', async () => {
      component.isConvertInboxModalOpen = true;
      await component.convertirCapturaANota({
        itemId: 4,
        nota: { titulo: 'Nota convertida', contenido: 'info', categoria: 'General', espacioId: 1 }
      });

      expect(notaServiceSpy.create).toHaveBeenCalled();
      expect(inboxServiceSpy.marcarOrganizado).toHaveBeenCalledWith(4);
      expect(inboxServiceSpy.refresh).toHaveBeenCalled();
      expect(component.isConvertInboxModalOpen).toBeFalse();
    });

    it('debe convertir captura a tarea, marcar organizado y refrescar inbox y tareas', async () => {
      component.isConvertInboxModalOpen = true;
      await component.convertirCapturaATarea({
        itemId: 8,
        tarea: { titulo: 'Tarea convertida', prioridad: 'Normal', estado: 'Pendiente', espacioId: null }
      });

      expect(tareaServiceSpy.create).toHaveBeenCalled();
      expect(inboxServiceSpy.marcarOrganizado).toHaveBeenCalledWith(8);
      expect(inboxServiceSpy.refresh).toHaveBeenCalled();
      expect(component.isConvertInboxModalOpen).toBeFalse();
    });
  });
});
