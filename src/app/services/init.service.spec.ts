import { TestBed } from '@angular/core/testing';
import { AppInitService, UTILES_ESPACIO_NOMBRE } from './init.service';
import { EspacioService } from './espacio.service';
import { DatabaseService } from '../repositories/database.service';

describe('AppInitService & EspacioService (T-01.4 Reglas de Espacio Útiles)', () => {
  let initService: AppInitService;
  let espacioService: EspacioService;
  let dbService: DatabaseService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [AppInitService, EspacioService, DatabaseService]
    });

    initService = TestBed.inject(AppInitService);
    espacioService = TestBed.inject(EspacioService);
    dbService = TestBed.inject(DatabaseService);

    // Limpiar tablas para aislamiento de pruebas
    await dbService.espacios.clear();
    await dbService.notas.clear();
    await dbService.tareas.clear();
    await dbService.eventos.clear();
  });

  afterAll(async () => {
    await dbService.db.close();
  });

  it('debe crear automáticamente el espacio "Útiles" con esSistema: true en la primera inicialización', async () => {
    await initService.init();

    const espacios = await dbService.espacios.toArray();
    expect(espacios.length).toBe(1);
    expect(espacios[0].nombre).toBe(UTILES_ESPACIO_NOMBRE);
    expect(espacios[0].esSistema).toBeTrue();
  });

  it('no debe duplicar el espacio "Útiles" si ya existe en subsiguientes arranques', async () => {
    await initService.init();
    await initService.init();
    await initService.init();

    const espacios = await dbService.espacios.toArray();
    expect(espacios.length).toBe(1);
    expect(espacios[0].nombre).toBe(UTILES_ESPACIO_NOMBRE);
  });

  it('debe impedir eliminar el espacio "Útiles" a nivel de servicio lanzando un error', async () => {
    const utiles = await initService.initUtilesSpace();
    expect(utiles.id).toBeDefined();

    await expectAsync(espacioService.delete(utiles.id!)).toBeRejectedWithError(
      /está protegido y no puede ser eliminado/
    );

    const despues = await dbService.espacios.get(utiles.id!);
    expect(despues).toBeDefined();
    expect(despues?.nombre).toBe(UTILES_ESPACIO_NOMBRE);
  });

  it('debe impedir renombrar el espacio "Útiles" a nivel de servicio lanzando un error', async () => {
    const utiles = await initService.initUtilesSpace();
    expect(utiles.id).toBeDefined();

    await expectAsync(
      espacioService.update(utiles.id!, { nombre: 'Otro Nombre' })
    ).toBeRejectedWithError(/no puede ser renombrado/);

    const despues = await dbService.espacios.get(utiles.id!);
    expect(despues?.nombre).toBe(UTILES_ESPACIO_NOMBRE);
  });

  it('canDelete y canRename deben retornar false para el espacio Útiles', async () => {
    const utiles = await initService.initUtilesSpace();
    expect(espacioService.canDelete(utiles)).toBeFalse();
    expect(espacioService.canRename(utiles)).toBeFalse();
  });

  it('debe permitir crear, renombrar y eliminar espacios regulares que no son de sistema', async () => {
    const regular = await espacioService.create({
      nombre: 'Proyectos Personales',
      color: '#10b981',
      esSistema: false,
      fechaCreacion: new Date().toISOString()
    });

    expect(espacioService.canDelete(regular)).toBeTrue();
    expect(espacioService.canRename(regular)).toBeTrue();

    await espacioService.update(regular.id!, { nombre: 'Proyectos 2026' });
    const modificado = await espacioService.getById(regular.id!);
    expect(modificado?.nombre).toBe('Proyectos 2026');

    await espacioService.delete(regular.id!);
    const eliminado = await espacioService.getById(regular.id!);
    expect(eliminado).toBeUndefined();
  });

  it('borrarTodoYReiniciar debe limpiar toda la base de datos y recrear el espacio Útiles (T-11.1)', async () => {
    // Insertar datos de prueba
    await dbService.espacios.add({ nombre: 'Espacio Temporal', esSistema: false, color: '#f59e0b', fechaCreacion: new Date().toISOString() });
    await dbService.inbox.add({ titulo: 'Captura temporal', organizado: false, fechaCreacion: new Date().toISOString() });
    await dbService.notas.add({ titulo: 'Nota temporal', contenido: 'test', espacioId: null, fechaCreacion: new Date().toISOString(), fechaActualizacion: new Date().toISOString() });
    await dbService.tareas.add({ titulo: 'Tarea temporal', estado: 'Pendiente', prioridad: 'Normal', espacioId: null, fechaCreacion: new Date().toISOString(), fechaActualizacion: new Date().toISOString() });
    await dbService.eventos.add({ titulo: 'Evento temporal', fechaInicio: new Date().toISOString(), fechaFin: new Date().toISOString(), espacioId: null, fechaCreacion: new Date().toISOString() });
    await dbService.recordatorios.add({ fechaHora: new Date().toISOString(), tareaId: 1, notificado: false });

    // Ejecutar borrado y reinicio
    const utiles = await initService.borrarTodoYReiniciar();

    expect(utiles.nombre).toBe(UTILES_ESPACIO_NOMBRE);
    expect(utiles.esSistema).toBeTrue();

    expect(await dbService.inbox.count()).toBe(0);
    expect(await dbService.notas.count()).toBe(0);
    expect(await dbService.tareas.count()).toBe(0);
    expect(await dbService.eventos.count()).toBe(0);
    expect(await dbService.recordatorios.count()).toBe(0);

    const espaciosFinales = await dbService.espacios.toArray();
    expect(espaciosFinales.length).toBe(1);
    expect(espaciosFinales[0].nombre).toBe(UTILES_ESPACIO_NOMBRE);
  });
});

