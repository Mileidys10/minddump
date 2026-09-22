import { TestBed } from '@angular/core/testing';
import { EspacioRepository } from './espacio.repository';
import { DatabaseService } from './database.service';

describe('EspacioRepository (T-02.1 CRUD & Persistencia)', () => {
  let repository: EspacioRepository;
  let dbService: DatabaseService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [EspacioRepository, DatabaseService]
    });

    repository = TestBed.inject(EspacioRepository);
    dbService = TestBed.inject(DatabaseService);

    await dbService.espacios.clear();
    await dbService.notas.clear();
    await dbService.tareas.clear();
    await dbService.eventos.clear();
  });

  afterAll(async () => {
    await dbService.db.close();
  });

  it('debe exponer getAll, getById, create, update, delete y detachElements', () => {
    expect(repository.getAll).toBeDefined();
    expect(repository.getById).toBeDefined();
    expect(repository.create).toBeDefined();
    expect(repository.update).toBeDefined();
    expect(repository.delete).toBeDefined();
    expect(repository.detachElements).toBeDefined();
  });

  it('debe crear y recuperar un espacio mediante getAll y getById', async () => {
    const nuevo = await repository.create({
      nombre: 'Trabajo',
      color: '#3b82f6',
      esSistema: false,
      fechaCreacion: new Date().toISOString()
    });

    expect(nuevo.id).toBeDefined();

    const todos = await repository.getAll();
    expect(todos.length).toBe(1);
    expect(todos[0].nombre).toBe('Trabajo');

    const recuperado = await repository.getById(nuevo.id!);
    expect(recuperado).toBeDefined();
    expect(recuperado?.nombre).toBe('Trabajo');
  });

  it('debe actualizar los datos de un espacio', async () => {
    const creado = await repository.create({
      nombre: 'Estudio',
      color: '#10b981',
      esSistema: false,
      fechaCreacion: new Date().toISOString()
    });

    await repository.update(creado.id!, { nombre: 'Universidad', color: '#059669' });

    const actualizado = await repository.getById(creado.id!);
    expect(actualizado?.nombre).toBe('Universidad');
    expect(actualizado?.color).toBe('#059669');
  });

  it('debe eliminar un espacio', async () => {
    const creado = await repository.create({
      nombre: 'Temporal',
      color: '#f43f5e',
      esSistema: false,
      fechaCreacion: new Date().toISOString()
    });

    await repository.delete(creado.id!);
    const postEliminar = await repository.getById(creado.id!);
    expect(postEliminar).toBeUndefined();
  });

  it('detachElements debe poner espacioId: null en notas, tareas y eventos asociados', async () => {
    const espacio = await repository.create({
      nombre: 'Proyecto X',
      color: '#8b5cf6',
      esSistema: false,
      fechaCreacion: new Date().toISOString()
    });

    const espId = espacio.id!;

    // Crear nota asociada
    const notaId = await dbService.notas.add({
      titulo: 'Nota X',
      contenido: 'Detalle',
      espacioId: espId,
      fechaCreacion: new Date().toISOString(),
      fechaActualizacion: new Date().toISOString()
    });

    // Crear tarea asociada
    const tareaId = await dbService.tareas.add({
      titulo: 'Tarea X',
      estado: 'Pendiente',
      prioridad: 'Normal',
      espacioId: espId,
      fechaCreacion: new Date().toISOString(),
      fechaActualizacion: new Date().toISOString()
    });

    // Crear evento asociado
    const eventoId = await dbService.eventos.add({
      titulo: 'Evento X',
      fechaInicio: '2026-10-01T10:00',
      fechaFin: '2026-10-01T11:00',
      espacioId: espId,
      fechaCreacion: new Date().toISOString()
    });

    // Desvincular elementos
    await repository.detachElements(espId);

    const nota = await dbService.notas.get(notaId);
    const tarea = await dbService.tareas.get(tareaId);
    const evento = await dbService.eventos.get(eventoId);

    expect(nota?.espacioId).toBeNull();
    expect(tarea?.espacioId).toBeNull();
    expect(evento?.espacioId).toBeNull();
  });
});
