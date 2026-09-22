import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { EventosComponent } from './eventos.component';
import { EventoService } from '../../services/evento.service';
import { EspacioService } from '../../services/espacio.service';
import { Evento, Espacio } from '../../models';

describe('EventosComponent (T-06.2, T-06.4)', () => {
  let component: EventosComponent;
  let fixture: ComponentFixture<EventosComponent>;
  let mockEventoService: jasmine.SpyObj<EventoService>;
  let mockEspacioService: jasmine.SpyObj<EspacioService>;

  const mockEventos: Evento[] = [
    {
      id: 1,
      titulo: 'Reunión de Equipo',
      descripcion: 'Sincronización semanal',
      fechaInicio: '2026-10-01T10:00:00.000Z',
      fechaFin: '2026-10-01T11:00:00.000Z',
      espacioId: 1,
      categoria: 'Trabajo',
      fechaCreacion: '2026-09-20T00:00:00.000Z'
    },
    {
      id: 2,
      titulo: 'Cita con Dentista',
      descripcion: '',
      fechaInicio: '2026-10-02T15:00:00.000Z',
      fechaFin: '2026-10-02T16:00:00.000Z',
      espacioId: null,
      categoria: 'Salud',
      fechaCreacion: '2026-09-20T00:00:00.000Z'
    }
  ];

  const mockEspacios: Espacio[] = [
    { id: 1, nombre: 'Oficina', color: '#3b82f6', esSistema: false, fechaCreacion: '' },
    { id: 2, nombre: 'Útiles', color: '#10b981', esSistema: true, fechaCreacion: '' }
  ];

  const eventosSignal = signal<Evento[]>(mockEventos);
  const categoriasSignal = signal<string[]>(['Salud', 'Trabajo']);
  const filtroEspacioSignal = signal<number | null | 'all'>('all');
  const filtroCategoriaSignal = signal<string | null>(null);
  const espaciosSignal = signal<Espacio[]>(mockEspacios);

  beforeEach(async () => {
    eventosSignal.set(mockEventos);
    categoriasSignal.set(['Salud', 'Trabajo']);
    filtroEspacioSignal.set('all');
    filtroCategoriaSignal.set(null);
    espaciosSignal.set(mockEspacios);

    mockEventoService = jasmine.createSpyObj<EventoService>('EventoService', [
      'cargarEventos',
      'setFiltroEspacio',
      'setFiltroCategoria',
      'create',
      'update',
      'delete',
      'getById'
    ], {
      eventosOrdenados: eventosSignal,
      categorias: categoriasSignal,
      filtroEspacioId: filtroEspacioSignal,
      filtroCategoria: filtroCategoriaSignal
    });

    mockEspacioService = jasmine.createSpyObj<EspacioService>('EspacioService', [
      'loadAll',
      'getAll'
    ], {
      espacios: espaciosSignal
    });

    mockEventoService.cargarEventos.and.resolveTo();
    mockEspacioService.loadAll.and.resolveTo();

    await TestBed.configureTestingModule({
      imports: [EventosComponent],
      providers: [
        { provide: EventoService, useValue: mockEventoService },
        { provide: EspacioService, useValue: mockEspacioService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EventosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse correctamente e inicializar datos', () => {
    expect(component).toBeTruthy();
    expect(mockEspacioService.loadAll).toHaveBeenCalled();
    expect(mockEventoService.cargarEventos).toHaveBeenCalled();
  });

  it('debe renderizar las tarjetas de eventos con sus datos (T-06.2)', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Reunión de Equipo');
    expect(compiled.textContent).toContain('Cita con Dentista');
    expect(compiled.textContent).toContain('Trabajo');
    expect(compiled.textContent).toContain('Salud');
    expect(compiled.textContent).toContain('Oficina');
  });

  it('debe mostrar estado vacío cuando no hay eventos', () => {
    eventosSignal.set([]);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('#eventos-empty-state')).toBeTruthy();
    expect(compiled.textContent).toContain('Sin eventos programados');
  });

  it('debe invocar setFiltroEspacio al pulsar un chip de espacio', () => {
    component.onFiltrarEspacio(1);
    expect(mockEventoService.setFiltroEspacio).toHaveBeenCalledWith(1);

    component.onFiltrarEspacio(null);
    expect(mockEventoService.setFiltroEspacio).toHaveBeenCalledWith(null);
  });

  it('debe invocar setFiltroCategoria al pulsar un chip de categoría', () => {
    component.onFiltrarCategoria('Salud');
    expect(mockEventoService.setFiltroCategoria).toHaveBeenCalledWith('Salud');
  });

  it('debe abrir y cerrar el modal de creación', () => {
    expect(component.isModalFormOpen).toBeFalse();
    component.abrirModalCrear();
    expect(component.isModalFormOpen).toBeTrue();
    expect(component.eventoSeleccionado).toBeNull();

    component.cerrarModalForm();
    expect(component.isModalFormOpen).toBeFalse();
  });

  it('debe abrir el modal de edición con el evento seleccionado', () => {
    component.abrirModalEditar(mockEventos[0]);
    expect(component.isModalFormOpen).toBeTrue();
    expect(component.eventoSeleccionado).toBe(mockEventos[0]);
  });

  it('debe abrir y confirmar eliminación en el modal de borrado (T-06.4)', async () => {
    mockEventoService.delete.and.resolveTo();

    component.abrirModalEliminar(mockEventos[0]);
    expect(component.isModalDeleteOpen).toBeTrue();
    expect(component.eventoAEliminar).toBe(mockEventos[0]);

    await component.onConfirmarEliminar(1);
    expect(mockEventoService.delete).toHaveBeenCalledWith(1);
    expect(component.isModalDeleteOpen).toBeFalse();
  });

  it('debe abrir el modal de detalle al hacer clic en un evento', () => {
    component.abrirModalDetalle(mockEventos[1]);
    expect(component.isModalDetalleOpen).toBeTrue();
    expect(component.eventoDetalle).toBe(mockEventos[1]);

    component.cerrarModalDetalle();
    expect(component.isModalDetalleOpen).toBeFalse();
  });
});
