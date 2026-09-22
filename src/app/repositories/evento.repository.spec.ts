import { TestBed } from '@angular/core/testing';
import { EventoRepository } from './evento.repository';
import { DatabaseService } from './database.service';

describe('EventoRepository', () => {
  let repository: EventoRepository;
  let dbService: DatabaseService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [EventoRepository, DatabaseService]
    });

    repository = TestBed.inject(EventoRepository);
    dbService = TestBed.inject(DatabaseService);

    await dbService.eventos.clear();
    await dbService.recordatorios.clear();
  });

  afterEach(async () => {
    await dbService.eventos.clear();
    await dbService.recordatorios.clear();
  });

  it('debe crearse correctamente y exponer todos los métodos requeridos (T-06.1)', () => {
    expect(repository).toBeTruthy();
    expect(typeof repository.getAll).toBe('function');
    expect(typeof repository.getByEspacio).toBe('function');
    expect(typeof repository.getById).toBe('function');
    expect(typeof repository.create).toBe('function');
    expect(typeof repository.update).toBe('function');
    expect(typeof repository.delete).toBe('function');
    expect(typeof repository.getCategorias).toBe('function');
  });

  it('create() debe generar id y fechaCreacion automáticamente', async () => {
    const inicio = new Date('2026-10-01T10:00:00Z').toISOString();
    const fin = new Date('2026-10-01T11:00:00Z').toISOString();

    const creado = await repository.create({
      titulo: 'Reunión de planificación',
      descripcion: 'Definir sprint backlog',
      fechaInicio: inicio,
      fechaFin: fin,
      categoria: 'Trabajo',
      espacioId: 1
    });

    expect(creado.id).toBeDefined();
    expect(creado.titulo).toBe('Reunión de planificación');
    expect(creado.descripcion).toBe('Definir sprint backlog');
    expect(creado.fechaInicio).toBe(inicio);
    expect(creado.fechaFin).toBe(fin);
    expect(creado.categoria).toBe('Trabajo');
    expect(creado.espacioId).toBe(1);
    expect(creado.fechaCreacion).toBeDefined();

    const enDb = await repository.getById(creado.id!);
    expect(enDb).toBeDefined();
    expect(enDb?.titulo).toBe('Reunión de planificación');
  });

  it('create() debe validar que fechaInicio y fechaFin estén presentes', async () => {
    const valida = new Date('2026-10-01T10:00:00Z').toISOString();

    await expectAsync(
      repository.create({
        titulo: 'Sin inicio',
        fechaInicio: '',
        fechaFin: valida,
        espacioId: null
      })
    ).toBeRejectedWithError(/La fecha de inicio es requerida/);

    await expectAsync(
      repository.create({
        titulo: 'Sin fin',
        fechaInicio: valida,
        fechaFin: '',
        espacioId: null
      })
    ).toBeRejectedWithError(/La fecha de fin es requerida/);
  });

  it('create() debe validar que fechaFin sea posterior o igual a fechaInicio', async () => {
    const inicio = new Date('2026-10-01T15:00:00Z').toISOString();
    const finAnterior = new Date('2026-10-01T14:00:00Z').toISOString();

    await expectAsync(
      repository.create({
        titulo: 'Evento imposible',
        fechaInicio: inicio,
        fechaFin: finAnterior,
        espacioId: null
      })
    ).toBeRejectedWithError(/La fecha de fin debe ser posterior o igual a la fecha de inicio/);

    // Mismo inicio y fin es válido (evento puntual)
    const puntual = await repository.create({
      titulo: 'Evento puntual',
      fechaInicio: inicio,
      fechaFin: inicio,
      espacioId: null
    });
    expect(puntual.id).toBeDefined();
  });

  it('create() debe validar que el título no esté vacío', async () => {
    const inicio = new Date('2026-10-01T10:00:00Z').toISOString();
    const fin = new Date('2026-10-01T11:00:00Z').toISOString();

    await expectAsync(
      repository.create({
        titulo: '   ',
        fechaInicio: inicio,
        fechaFin: fin,
        espacioId: null
      })
    ).toBeRejectedWithError(/El título del evento es requerido/);
  });

  it('update() debe actualizar datos y validar coherencia de fechas', async () => {
    const ev = await repository.create({
      titulo: 'Original',
      fechaInicio: '2026-10-01T10:00:00Z',
      fechaFin: '2026-10-01T12:00:00Z',
      espacioId: 1
    });

    await repository.update(ev.id!, {
      titulo: 'Modificado',
      fechaFin: '2026-10-01T13:00:00Z'
    });

    const actualizado = await repository.getById(ev.id!);
    expect(actualizado?.titulo).toBe('Modificado');
    expect(actualizado?.fechaFin).toBe('2026-10-01T13:00:00Z');

    // Actualización con fechaFin anterior a la fechaInicio actual debe fallar
    await expectAsync(
      repository.update(ev.id!, {
        fechaFin: '2026-10-01T09:00:00Z'
      })
    ).toBeRejectedWithError(/La fecha de fin debe ser posterior o igual a la fecha de inicio/);
  });

  it('delete() debe eliminar el evento y sus recordatorios asociados en cascada (T-06.4)', async () => {
    const ev = await repository.create({
      titulo: 'Evento con alerta',
      fechaInicio: '2026-10-01T10:00:00Z',
      fechaFin: '2026-10-01T12:00:00Z',
      espacioId: 1
    });

    await dbService.recordatorios.add({
      titulo: 'Alerta evento 1',
      fechaHora: new Date().toISOString(),
      eventoId: ev.id!
    });
    await dbService.recordatorios.add({
      titulo: 'Alerta ajena',
      fechaHora: new Date().toISOString(),
      eventoId: 9999
    });

    expect(await dbService.recordatorios.where('eventoId').equals(ev.id!).count()).toBe(1);

    await repository.delete(ev.id!);

    expect(await repository.getById(ev.id!)).toBeUndefined();
    expect(await dbService.recordatorios.where('eventoId').equals(ev.id!).count()).toBe(0);
    // El ajeno permanece
    expect(await dbService.recordatorios.where('eventoId').equals(9999).count()).toBe(1);
  });

  it('getAll() y getByEspacio() deben retornar eventos ordenados por fechaInicio', async () => {
    await repository.create({
      titulo: 'Tarde',
      fechaInicio: '2026-10-03T10:00:00Z',
      fechaFin: '2026-10-03T11:00:00Z',
      espacioId: 1,
      categoria: 'Urgente'
    });
    await repository.create({
      titulo: 'Temprano',
      fechaInicio: '2026-10-01T10:00:00Z',
      fechaFin: '2026-10-01T11:00:00Z',
      espacioId: 1,
      categoria: 'Urgente'
    });
    await repository.create({
      titulo: 'Otro espacio',
      fechaInicio: '2026-10-02T10:00:00Z',
      fechaFin: '2026-10-02T11:00:00Z',
      espacioId: 2,
      categoria: 'Social'
    });

    const todos = await repository.getAll();
    expect(todos.length).toBe(3);
    expect(todos[0].titulo).toBe('Temprano');
    expect(todos[1].titulo).toBe('Otro espacio');
    expect(todos[2].titulo).toBe('Tarde');

    const espacio1 = await repository.getByEspacio(1);
    expect(espacio1.length).toBe(2);
    expect(espacio1[0].titulo).toBe('Temprano');
    expect(espacio1[1].titulo).toBe('Tarde');

    const categorias = await repository.getCategorias();
    expect(categorias).toEqual(['Social', 'Urgente']);
  });
});
