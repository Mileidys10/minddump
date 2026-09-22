import { TestBed } from '@angular/core/testing';
import { TareaRepository, ESTADOS_TAREA_VALIDOS, PRIORIDADES_TAREA_VALIDAS } from './tarea.repository';
import { DatabaseService } from './database.service';
import { EstadoTarea, PrioridadTarea } from '../models';

describe('TareaRepository', () => {
  let repository: TareaRepository;
  let dbService: DatabaseService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [TareaRepository, DatabaseService]
    });

    repository = TestBed.inject(TareaRepository);
    dbService = TestBed.inject(DatabaseService);

    await dbService.tareas.clear();
    await dbService.recordatorios.clear();
  });

  afterEach(async () => {
    await dbService.tareas.clear();
    await dbService.recordatorios.clear();
  });

  it('debe crearse correctamente', () => {
    expect(repository).toBeTruthy();
  });

  it('debe exponer los enums de estados y prioridades válidas', () => {
    expect(ESTADOS_TAREA_VALIDOS).toEqual(['Pendiente', 'En progreso', 'Completada', 'Cancelada']);
    expect(PRIORIDADES_TAREA_VALIDAS).toEqual(['Urgente', 'Normal', 'Baja']);
  });

  it('debe rechazar estados o prioridades inválidos', async () => {
    expect(() => repository.validarEstado('Invalido' as EstadoTarea)).toThrowError(/Estado inválido/);
    expect(() => repository.validarPrioridad('SuperAlta' as PrioridadTarea)).toThrowError(/Prioridad inválida/);

    await expectAsync(
      repository.create({
        titulo: 'Tarea inválida',
        estado: 'NoExiste' as EstadoTarea,
        prioridad: 'Normal',
        espacioId: null
      })
    ).toBeRejectedWithError(/Estado inválido/);

    await expectAsync(
      repository.create({
        titulo: 'Tarea inválida',
        estado: 'Pendiente',
        prioridad: 'NoExiste' as PrioridadTarea,
        espacioId: null
      })
    ).toBeRejectedWithError(/Prioridad inválida/);
  });

  it('debe crear una tarea con id, fechas y estado por defecto Pendiente', async () => {
    const creada = await repository.create({
      titulo: 'Comprar insumos',
      descripcion: 'Para el taller',
      prioridad: 'Urgente',
      espacioId: 1
    });

    expect(creada.id).toBeDefined();
    expect(creada.titulo).toBe('Comprar insumos');
    expect(creada.estado).toBe('Pendiente');
    expect(creada.prioridad).toBe('Urgente');
    expect(creada.fechaCreacion).toBeDefined();
    expect(creada.fechaActualizacion).toBeDefined();
    expect(creada.espacioId).toBe(1);

    const enDb = await repository.getById(creada.id!);
    expect(enDb).toBeDefined();
    expect(enDb?.titulo).toBe('Comprar insumos');
  });

  it('debe actualizar una tarea y refrescar fechaActualizacion', async () => {
    const creada = await repository.create({
      titulo: 'Original',
      prioridad: 'Normal',
      estado: 'Pendiente',
      espacioId: 1
    });

    // Pequeña espera para asegurar diferencia de timestamp
    await new Promise(resolve => setTimeout(resolve, 10));

    await repository.update(creada.id!, {
      titulo: 'Modificada',
      prioridad: 'Urgente'
    });

    const actualizada = await repository.getById(creada.id!);
    expect(actualizada?.titulo).toBe('Modificada');
    expect(actualizada?.prioridad).toBe('Urgente');
    expect(new Date(actualizada!.fechaActualizacion).getTime())
      .toBeGreaterThanOrEqual(new Date(creada.fechaActualizacion).getTime());
  });

  it('debe cambiar el estado de una tarea mediante cambiarEstado()', async () => {
    const creada = await repository.create({
      titulo: 'Flujo de trabajo',
      prioridad: 'Normal',
      estado: 'Pendiente',
      espacioId: 1
    });

    await repository.cambiarEstado(creada.id!, 'En progreso');
    let rec = await repository.getById(creada.id!);
    expect(rec?.estado).toBe('En progreso');

    await repository.cambiarEstado(creada.id!, 'Completada');
    rec = await repository.getById(creada.id!);
    expect(rec?.estado).toBe('Completada');

    await expectAsync(
      repository.cambiarEstado(creada.id!, 'Desconocido' as EstadoTarea)
    ).toBeRejectedWithError(/Estado inválido/);
  });

  it('debe filtrar tareas por espacio, categoría y estado', async () => {
    await repository.create({ titulo: 'T1', prioridad: 'Urgente', estado: 'Pendiente', espacioId: 1, categoria: 'Backend' });
    await repository.create({ titulo: 'T2', prioridad: 'Normal', estado: 'Completada', espacioId: 1, categoria: 'Frontend' });
    await repository.create({ titulo: 'T3', prioridad: 'Baja', estado: 'Pendiente', espacioId: 2, categoria: 'Backend' });
    await repository.create({ titulo: 'T4 huérfana', prioridad: 'Normal', estado: 'Pendiente', espacioId: null });

    const todas = await repository.getAll();
    expect(todas.length).toBe(4);

    const espacio1 = await repository.getByEspacio(1);
    expect(espacio1.length).toBe(2);

    const espacio1Cat = await repository.getByEspacio(1, 'Backend');
    expect(espacio1Cat.length).toBe(1);
    expect(espacio1Cat[0].titulo).toBe('T1');

    const espacio1Completadas = await repository.getByEspacio(1, undefined, 'Completada');
    expect(espacio1Completadas.length).toBe(1);
    expect(espacio1Completadas[0].titulo).toBe('T2');

    const pendientesGlobales = await repository.getByEstado('Pendiente');
    expect(pendientesGlobales.length).toBe(3);

    const categoriasEspacio1 = await repository.getCategorias(1);
    expect(categoriasEspacio1).toEqual(['Backend', 'Frontend']);
  });

  it('debe eliminar la tarea y sus recordatorios asociados en cascada (T-05.5)', async () => {
    const tarea = await repository.create({
      titulo: 'Tarea con recordatorio',
      prioridad: 'Urgente',
      estado: 'Pendiente',
      espacioId: 1
    });

    // Crear 2 recordatorios asociados a la tarea y 1 para otra
    await dbService.recordatorios.add({
      titulo: 'Recordatorio 1',
      fechaHora: new Date().toISOString(),
      tareaId: tarea.id!
    });
    await dbService.recordatorios.add({
      titulo: 'Recordatorio 2',
      fechaHora: new Date().toISOString(),
      tareaId: tarea.id!
    });
    await dbService.recordatorios.add({
      titulo: 'Recordatorio Ajeno',
      fechaHora: new Date().toISOString(),
      tareaId: 999
    });

    const antesRecordatorios = await dbService.recordatorios.where('tareaId').equals(tarea.id!).count();
    expect(antesRecordatorios).toBe(2);

    await repository.delete(tarea.id!);

    const tareaBorrada = await repository.getById(tarea.id!);
    expect(tareaBorrada).toBeUndefined();

    const despuesRecordatorios = await dbService.recordatorios.where('tareaId').equals(tarea.id!).count();
    expect(despuesRecordatorios).toBe(0);

    const ajenoQueda = await dbService.recordatorios.where('tareaId').equals(999).count();
    expect(ajenoQueda).toBe(1);
  });
});
