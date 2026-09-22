import { TestBed } from '@angular/core/testing';
import { BusquedaService } from './busqueda.service';
import { DatabaseService } from '../repositories/database.service';
import { Nota, Tarea } from '../models';

describe('BusquedaService (T-08.1)', () => {
  let service: BusquedaService;
  let dbService: DatabaseService;

  const mockNota1: Nota = {
    id: 1,
    titulo: 'Guía de TypeScript y Decoradores',
    contenido: 'Los decoradores en TypeScript son funciones de orden superior.',
    categoria: 'Programación',
    espacioId: 10,
    fechaCreacion: '2026-09-01T10:00:00.000Z',
    fechaActualizacion: '2026-09-01T10:00:00.000Z'
  };

  const mockNota2: Nota = {
    id: 2,
    titulo: 'Receta de Cocina',
    contenido: 'Ingredientes para pastel de chocolate.',
    categoria: 'Personal',
    espacioId: null,
    fechaCreacion: '2026-09-02T10:00:00.000Z',
    fechaActualizacion: '2026-09-02T10:00:00.000Z'
  };

  const mockTarea1: Tarea = {
    id: 101,
    titulo: 'Configurar linter de TypeScript',
    descripcion: 'Ajustar reglas de ESLint en el proyecto.',
    prioridad: 'Urgente',
    estado: 'Pendiente',
    categoria: 'DevOps',
    espacioId: 10,
    fechaLimite: '2026-10-01T12:00:00.000Z',
    fechaCreacion: '2026-09-03T10:00:00.000Z',
    fechaActualizacion: '2026-09-03T10:00:00.000Z'
  };

  const mockTarea2: Tarea = {
    id: 102,
    titulo: 'Comprar chocolate amargo',
    descripcion: 'Para la receta del fin de semana.',
    prioridad: 'Baja',
    estado: 'Completada',
    categoria: undefined,
    espacioId: null,
    fechaLimite: null,
    fechaCreacion: '2026-09-04T10:00:00.000Z',
    fechaActualizacion: '2026-09-04T10:00:00.000Z'
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [BusquedaService, DatabaseService]
    });

    service = TestBed.inject(BusquedaService);
    dbService = TestBed.inject(DatabaseService);

    await dbService.notas.clear();
    await dbService.tareas.clear();

    await dbService.notas.bulkAdd([mockNota1, mockNota2]);
    await dbService.tareas.bulkAdd([mockTarea1, mockTarea2]);
  });

  afterEach(async () => {
    await dbService.notas.clear();
    await dbService.tareas.clear();
  });

  it('debe crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('debe retornar lista vacía si query está vacío y sin filtros específicos', async () => {
    const res = await service.buscar('');
    expect(res).toEqual([]);
  });

  it('debe buscar en título y contenido de notas; título y descripción de tareas', async () => {
    // 'typescript' está en título de mockNota1 y mockTarea1, y en contenido de mockNota1
    const res = await service.buscar('typescript');
    expect(res.length).toBe(2);
    expect(res.some(r => r.tipo === 'nota' && r.id === 1)).toBeTrue();
    expect(res.some(r => r.tipo === 'tarea' && r.id === 101)).toBeTrue();

    // 'chocolate' está en contenido de mockNota2 y título de mockTarea2
    const resChoc = await service.buscar('chocolate');
    expect(resChoc.length).toBe(2);
    expect(resChoc.some(r => r.tipo === 'nota' && r.id === 2)).toBeTrue();
    expect(resChoc.some(r => r.tipo === 'tarea' && r.id === 102)).toBeTrue();
  });

  it('la búsqueda debe ser insensible a mayúsculas y minúsculas (case-insensitive)', async () => {
    const resUpper = await service.buscar('TYPESCRIPT');
    const resLower = await service.buscar('typescript');
    const resMixed = await service.buscar('TyPeScRiPt');

    expect(resUpper.length).toBe(2);
    expect(resLower.length).toBe(2);
    expect(resMixed.length).toBe(2);
  });

  it('debe devolver resultados tipados con información de tipo nota o tarea', async () => {
    const res = await service.buscar('linter');
    expect(res.length).toBe(1);
    expect(res[0].tipo).toBe('tarea');
    expect(res[0].titulo).toBe('Configurar linter de TypeScript');
    expect(res[0].estado).toBe('Pendiente');
    expect(res[0].prioridad).toBe('Urgente');
  });

  it('debe filtrar resultados por espacioId (específico o sin clasificar)', async () => {
    // Filtrar por espacio 10
    const porEspacio10 = await service.buscar('typescript', { espacioId: 10 });
    expect(porEspacio10.length).toBe(2);
    expect(porEspacio10.every(r => r.espacioId === 10)).toBeTrue();

    // Filtrar por huérfanos / sin clasificar (espacioId: null)
    const sinEspacio = await service.buscar('chocolate', { espacioId: null });
    expect(sinEspacio.length).toBe(2);
    expect(sinEspacio.every(r => r.espacioId === null)).toBeTrue();
  });

  it('debe filtrar resultados por categoría', async () => {
    const porCat = await service.buscar('typescript', { categoria: 'Programación' });
    expect(porCat.length).toBe(1);
    expect(porCat[0].tipo).toBe('nota');
    expect(porCat[0].id).toBe(1);
  });

  it('debe filtrar resultados por tipo (solo notas o solo tareas)', async () => {
    const soloNotas = await service.buscar('typescript', { tipo: 'nota' });
    expect(soloNotas.length).toBe(1);
    expect(soloNotas[0].tipo).toBe('nota');

    const soloTareas = await service.buscar('typescript', { tipo: 'tarea' });
    expect(soloTareas.length).toBe(1);
    expect(soloTareas[0].tipo).toBe('tarea');
  });

  it('debe obtener la lista de categorías disponibles sin duplicados', async () => {
    const cats = await service.getCategoriasDisponibles();
    expect(cats).toEqual(['DevOps', 'Personal', 'Programación']);
  });
});
