import { TestBed } from '@angular/core/testing';
import { EventoService } from './evento.service';
import { EventoRepository } from '../repositories/evento.repository';
import { Evento } from '../models';

describe('EventoService', () => {
  let service: EventoService;
  let mockRepo: jasmine.SpyObj<EventoRepository>;

  const eventosMock: Evento[] = [
    {
      id: 1,
      titulo: 'Evento Futuro 1',
      fechaInicio: '2026-10-05T10:00:00Z',
      fechaFin: '2026-10-05T11:00:00Z',
      espacioId: 1,
      categoria: 'Trabajo',
      fechaCreacion: '2026-09-01T10:00:00Z'
    },
    {
      id: 2,
      titulo: 'Evento Próximo',
      fechaInicio: '2026-10-01T08:00:00Z',
      fechaFin: '2026-10-01T09:00:00Z',
      espacioId: null,
      categoria: 'Personal',
      fechaCreacion: '2026-09-02T10:00:00Z'
    },
    {
      id: 3,
      titulo: 'Evento Futuro 2',
      fechaInicio: '2026-10-10T14:00:00Z',
      fechaFin: '2026-10-10T15:00:00Z',
      espacioId: 1,
      categoria: 'Trabajo',
      fechaCreacion: '2026-09-03T10:00:00Z'
    }
  ];

  beforeEach(() => {
    mockRepo = jasmine.createSpyObj<EventoRepository>('EventoRepository', [
      'getAll',
      'getByEspacio',
      'getById',
      'create',
      'update',
      'delete',
      'getCategorias'
    ]);

    mockRepo.getAll.and.resolveTo([...eventosMock]);
    mockRepo.getCategorias.and.resolveTo(['Personal', 'Trabajo']);

    TestBed.configureTestingModule({
      providers: [
        EventoService,
        { provide: EventoRepository, useValue: mockRepo }
      ]
    });

    service = TestBed.inject(EventoService);
  });

  it('debe crearse correctamente', () => {
    expect(service).toBeTruthy();
    expect(service.filtroEspacioId()).toBe('all');
    expect(service.filtroCategoria()).toBeNull();
  });

  it('cargarEventos() debe actualizar las señales de eventos y categorías', async () => {
    await service.cargarEventos();
    expect(service.eventos().length).toBe(3);
    expect(service.categorias()).toEqual(['Personal', 'Trabajo']);
  });

  it('eventosOrdenados debe ordenar por fechaInicio ascendente (próximos primero)', async () => {
    await service.cargarEventos();
    const ordenados = service.eventosOrdenados();

    expect(ordenados.length).toBe(3);
    expect(ordenados[0].id).toBe(2); // 1-oct
    expect(ordenados[1].id).toBe(1); // 5-oct
    expect(ordenados[2].id).toBe(3); // 10-oct
  });

  it('debe filtrar por espacio correctamente (all, específico y null)', async () => {
    await service.cargarEventos();

    // Filtro espacio 1
    service.setFiltroEspacio(1);
    let ordenados = service.eventosOrdenados();
    expect(ordenados.length).toBe(2);
    expect(ordenados.every(e => e.espacioId === 1)).toBeTrue();

    // Filtro sin espacio (null)
    service.setFiltroEspacio(null);
    ordenados = service.eventosOrdenados();
    expect(ordenados.length).toBe(1);
    expect(ordenados[0].id).toBe(2);

    // Reset a 'all'
    service.setFiltroEspacio('all');
    ordenados = service.eventosOrdenados();
    expect(ordenados.length).toBe(3);
  });

  it('debe filtrar por categoría insensible a mayúsculas', async () => {
    await service.cargarEventos();

    service.setFiltroCategoria('trabajo');
    const ordenados = service.eventosOrdenados();
    expect(ordenados.length).toBe(2);
    expect(ordenados.every(e => e.categoria === 'Trabajo')).toBeTrue();
  });

  it('create() debe llamar al repositorio y refrescar la lista', async () => {
    const nuevo: Evento = {
      id: 4,
      titulo: 'Nuevo Evento',
      fechaInicio: '2026-10-02T10:00:00Z',
      fechaFin: '2026-10-02T11:00:00Z',
      espacioId: null,
      fechaCreacion: '2026-09-21T10:00:00Z'
    };
    mockRepo.create.and.resolveTo(nuevo);

    const res = await service.create({
      titulo: 'Nuevo Evento',
      fechaInicio: '2026-10-02T10:00:00Z',
      fechaFin: '2026-10-02T11:00:00Z',
      espacioId: null
    });

    expect(res.id).toBe(4);
    expect(mockRepo.create).toHaveBeenCalled();
    expect(mockRepo.getAll).toHaveBeenCalled();
  });

  it('update() y delete() deben llamar al repositorio y refrescar la lista', async () => {
    mockRepo.update.and.resolveTo();
    mockRepo.delete.and.resolveTo();

    await service.update(1, { titulo: 'Actualizado' });
    expect(mockRepo.update).toHaveBeenCalledWith(1, { titulo: 'Actualizado' });

    await service.delete(1);
    expect(mockRepo.delete).toHaveBeenCalledWith(1);
  });
});
