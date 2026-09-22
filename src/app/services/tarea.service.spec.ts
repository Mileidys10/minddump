import { TestBed } from '@angular/core/testing';
import { TareaService } from './tarea.service';
import { TareaRepository } from '../repositories/tarea.repository';
import { EspacioService } from './espacio.service';
import { DatabaseService } from '../repositories/database.service';
import { AppInitService } from './init.service';

describe('TareaService', () => {
  let service: TareaService;
  let dbService: DatabaseService;
  let espacioService: EspacioService;
  let appInitService: AppInitService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [TareaService, TareaRepository, EspacioService, DatabaseService, AppInitService]
    });

    service = TestBed.inject(TareaService);
    dbService = TestBed.inject(DatabaseService);
    espacioService = TestBed.inject(EspacioService);
    appInitService = TestBed.inject(AppInitService);

    await dbService.espacios.clear();
    await dbService.tareas.clear();
    await dbService.recordatorios.clear();

    await appInitService.initUtilesSpace();
  });

  afterEach(async () => {
    await dbService.espacios.clear();
    await dbService.tareas.clear();
    await dbService.recordatorios.clear();
  });

  it('debe inicializarse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('debe rechazar la creación con título vacío o solo espacios', async () => {
    await expectAsync(
      service.create({
        titulo: '   ',
        prioridad: 'Normal',
        estado: 'Pendiente',
        espacioId: 1
      })
    ).toBeRejectedWithError('El título de la tarea es obligatorio');
  });

  it('debe inicializar el espacio activo en initContext', async () => {
    await service.initContext();
    expect(service.espacioActivoId()).not.toBeNull();
  });

  it('debe separar y ordenar correctamente tareasActivas y tareasFinalizadas', async () => {
    const espacios = await espacioService.getAll();
    const espId = espacios[0].id!;
    await service.setEspacioActivo(espId);

    // Crear tareas con distintas prioridades y fechas límite
    const tBaja = await service.create({
      titulo: 'Tarea Baja',
      prioridad: 'Baja',
      estado: 'Pendiente',
      espacioId: espId
    });

    const tUrgenteLejana = await service.create({
      titulo: 'Urgente Lejana',
      prioridad: 'Urgente',
      estado: 'Pendiente',
      fechaLimite: '2026-12-31T23:59:59.000Z',
      espacioId: espId
    });

    const tUrgenteCercana = await service.create({
      titulo: 'Urgente Cercana',
      prioridad: 'Urgente',
      estado: 'En progreso',
      fechaLimite: '2026-10-01T12:00:00.000Z',
      espacioId: espId
    });

    const tNormal = await service.create({
      titulo: 'Tarea Normal',
      prioridad: 'Normal',
      estado: 'Pendiente',
      espacioId: espId
    });

    const tCompletada = await service.create({
      titulo: 'Tarea Hecha',
      prioridad: 'Urgente',
      estado: 'Completada',
      espacioId: espId
    });

    const tCancelada = await service.create({
      titulo: 'Tarea Descartada',
      prioridad: 'Baja',
      estado: 'Cancelada',
      espacioId: espId
    });

    const activas = service.tareasActivas();
    const finalizadas = service.tareasFinalizadas();

    expect(activas.length).toBe(4);
    expect(finalizadas.length).toBe(2);

    // 1. Urgente Cercana primero (Urgente + fecha más temprana)
    expect(activas[0].id).toBe(tUrgenteCercana.id);
    // 2. Urgente Lejana segundo (Urgente + fecha posterior)
    expect(activas[1].id).toBe(tUrgenteLejana.id);
    // 3. Normal
    expect(activas[2].id).toBe(tNormal.id);
    // 4. Baja
    expect(activas[3].id).toBe(tBaja.id);

    // Finalizadas
    expect(finalizadas.map(t => t.id)).toContain(tCompletada.id!);
    expect(finalizadas.map(t => t.id)).toContain(tCancelada.id!);
  });

  it('debe cambiar de estado reactivamente con cambiarEstado()', async () => {
    const espacios = await espacioService.getAll();
    const espId = espacios[0].id!;
    await service.setEspacioActivo(espId);

    const tarea = await service.create({
      titulo: 'Tarea dinámica',
      prioridad: 'Normal',
      estado: 'Pendiente',
      espacioId: espId
    });

    expect(service.tareasActivas().length).toBe(1);
    expect(service.tareasFinalizadas().length).toBe(0);

    // Mover a En progreso
    await service.cambiarEstado(tarea.id!, 'En progreso');
    expect(service.tareasActivas()[0].estado).toBe('En progreso');

    // Mover a Completada
    await service.cambiarEstado(tarea.id!, 'Completada');
    expect(service.tareasActivas().length).toBe(0);
    expect(service.tareasFinalizadas().length).toBe(1);
    expect(service.tareasFinalizadas()[0].estado).toBe('Completada');
  });

  it('debe filtrar tareas por categoría en el espacio activo', async () => {
    const espacios = await espacioService.getAll();
    const espId = espacios[0].id!;
    await service.setEspacioActivo(espId);

    await service.create({
      titulo: 'Tarea Bug',
      prioridad: 'Urgente',
      estado: 'Pendiente',
      categoria: 'Bugs',
      espacioId: espId
    });

    await service.create({
      titulo: 'Tarea Feature',
      prioridad: 'Normal',
      estado: 'Pendiente',
      categoria: 'Features',
      espacioId: espId
    });

    expect(service.categorias()).toEqual(['Bugs', 'Features']);
    expect(service.tareasActivas().length).toBe(2);

    await service.setCategoriaFiltro('Bugs');
    expect(service.tareasActivas().length).toBe(1);
    expect(service.tareasActivas()[0].titulo).toBe('Tarea Bug');

    await service.setCategoriaFiltro(null);
    expect(service.tareasActivas().length).toBe(2);
  });

  it('debe eliminar la tarea y actualizar la lista reactivamente', async () => {
    const espacios = await espacioService.getAll();
    const espId = espacios[0].id!;
    await service.setEspacioActivo(espId);

    const tarea = await service.create({
      titulo: 'Tarea a borrar',
      prioridad: 'Baja',
      estado: 'Pendiente',
      espacioId: espId
    });

    expect(service.tareas().length).toBe(1);

    await service.delete(tarea.id!);
    expect(service.tareas().length).toBe(0);
  });
});
