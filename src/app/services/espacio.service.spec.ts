import { TestBed } from '@angular/core/testing';
import { EspacioService } from './espacio.service';
import { EspacioRepository } from '../repositories/espacio.repository';
import { DatabaseService } from '../repositories/database.service';
import { UTILES_ESPACIO_NOMBRE } from './init.service';

describe('EspacioService (T-02.1 Lógica de Negocio & Reglas de Espacio)', () => {
  let service: EspacioService;
  let dbService: DatabaseService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [EspacioService, EspacioRepository, DatabaseService]
    });

    service = TestBed.inject(EspacioService);
    dbService = TestBed.inject(DatabaseService);

    await dbService.espacios.clear();
    await dbService.notas.clear();
    await dbService.tareas.clear();
    await dbService.eventos.clear();
  });

  afterAll(async () => {
    await dbService.db.close();
  });

  it('debe rechazar la creación de un espacio con nombre vacío', async () => {
    await expectAsync(service.create({
      nombre: '   ',
      color: '#6366f1',
      esSistema: false,
      fechaCreacion: new Date().toISOString()
    })).toBeRejectedWithError('El nombre del espacio es obligatorio');
  });

  it('debe impedir eliminar un espacio con esSistema: true (Útiles)', async () => {
    const utiles = await dbService.espacios.add({
      nombre: UTILES_ESPACIO_NOMBRE,
      color: '#6366f1',
      esSistema: true,
      fechaCreacion: new Date().toISOString()
    });

    await expectAsync(service.delete(utiles)).toBeRejectedWithError(
      /está protegido y no puede ser eliminado/
    );

    const existe = await dbService.espacios.get(utiles);
    expect(existe).toBeDefined();
  });

  it('debe impedir renombrar un espacio con esSistema: true', async () => {
    const utiles = await dbService.espacios.add({
      nombre: UTILES_ESPACIO_NOMBRE,
      color: '#6366f1',
      esSistema: true,
      fechaCreacion: new Date().toISOString()
    });

    await expectAsync(service.update(utiles, { nombre: 'Papelera' })).toBeRejectedWithError(
      /no puede ser renombrado/
    );

    const actual = await dbService.espacios.get(utiles);
    expect(actual?.nombre).toBe(UTILES_ESPACIO_NOMBRE);
  });

  it('debe desvincular notas, tareas y eventos al eliminar un espacio regular (T-02.4)', async () => {
    const regular = await service.create({
      nombre: 'Freelance',
      color: '#f59e0b',
      esSistema: false,
      fechaCreacion: new Date().toISOString()
    });

    const regId = regular.id!;

    const notaId = await dbService.notas.add({
      titulo: 'Cotización',
      espacioId: regId,
      fechaCreacion: new Date().toISOString(),
      fechaActualizacion: new Date().toISOString()
    });

    const tareaId = await dbService.tareas.add({
      titulo: 'Entregar diseño',
      estado: 'Pendiente',
      prioridad: 'Urgente',
      espacioId: regId,
      fechaCreacion: new Date().toISOString(),
      fechaActualizacion: new Date().toISOString()
    });

    await service.delete(regId);

    const nota = await dbService.notas.get(notaId);
    const tarea = await dbService.tareas.get(tareaId);
    const espacio = await dbService.espacios.get(regId);

    expect(espacio).toBeUndefined();
    expect(nota?.espacioId).toBeNull();
    expect(tarea?.espacioId).toBeNull();
  });

  it('debe actualizar la señal reactiva espacios al crear o eliminar', async () => {
    expect(service.espacios().length).toBe(0);

    const creado = await service.create({
      nombre: 'Fitness',
      color: '#10b981',
      esSistema: false,
      fechaCreacion: new Date().toISOString()
    });

    expect(service.espacios().length).toBe(1);
    expect(service.espacios()[0].nombre).toBe('Fitness');

    await service.delete(creado.id!);
    expect(service.espacios().length).toBe(0);
  });
});
