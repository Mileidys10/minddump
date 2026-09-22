import { TestBed } from '@angular/core/testing';
import { NotaRepository } from './nota.repository';
import { DatabaseService } from './database.service';

describe('NotaRepository (T-04.1 CRUD & Consultas por Espacio y Categoría)', () => {
  let repository: NotaRepository;
  let dbService: DatabaseService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [NotaRepository, DatabaseService]
    });

    repository = TestBed.inject(NotaRepository);
    dbService = TestBed.inject(DatabaseService);

    await dbService.notas.clear();
    await dbService.espacios.clear();
  });

  afterAll(async () => {
    await dbService.db.close();
  });

  it('debe exponer getAll, getByEspacio, getById, create, update, delete y getCategorias', () => {
    expect(repository.getAll).toBeDefined();
    expect(repository.getByEspacio).toBeDefined();
    expect(repository.getById).toBeDefined();
    expect(repository.create).toBeDefined();
    expect(repository.update).toBeDefined();
    expect(repository.delete).toBeDefined();
    expect(repository.getCategorias).toBeDefined();
  });

  it('create debe generar automáticamente id, fechaCreacion y fechaActualizacion', async () => {
    const creada = await repository.create({
      titulo: 'Primera Nota',
      contenido: 'Contenido de prueba',
      espacioId: 1
    });

    expect(creada.id).toBeDefined();
    expect(creada.fechaCreacion).toBeDefined();
    expect(creada.fechaActualizacion).toBeDefined();
    expect(creada.fechaCreacion).toBe(creada.fechaActualizacion);

    const enDb = await repository.getById(creada.id!);
    expect(enDb?.titulo).toBe('Primera Nota');
  });

  it('update debe actualizar automáticamente fechaActualizacion manteniendo fechaCreacion', async () => {
    const creada = await repository.create({
      titulo: 'Nota Original',
      contenido: 'Texto original',
      espacioId: 1
    });

    // Pequeña pausa para asegurar diferencia de timestamp
    await new Promise(resolve => setTimeout(resolve, 50));

    await repository.update(creada.id!, { titulo: 'Nota Modificada' });

    const actualizada = await repository.getById(creada.id!);
    expect(actualizada?.titulo).toBe('Nota Modificada');
    expect(actualizada?.fechaCreacion).toBe(creada.fechaCreacion);
    expect(Date.parse(actualizada!.fechaActualizacion)).toBeGreaterThanOrEqual(Date.parse(creada.fechaActualizacion));
  });

  it('getAll debe incluir notas con espacioId: null (sin clasificar)', async () => {
    await repository.create({
      titulo: 'Nota sin espacio',
      espacioId: null
    });

    await repository.create({
      titulo: 'Nota con espacio',
      espacioId: 2
    });

    const todas = await repository.getAll();
    expect(todas.length).toBe(2);

    const sinEspacio = todas.find(n => n.espacioId === null);
    expect(sinEspacio).toBeDefined();
    expect(sinEspacio?.titulo).toBe('Nota sin espacio');
  });

  it('getByEspacio debe filtrar estrictamente por espacioId excluyendo las notas sin espacio', async () => {
    await repository.create({ titulo: 'Nota Espacio 1', espacioId: 1 });
    await repository.create({ titulo: 'Nota Espacio 2', espacioId: 2 });
    await repository.create({ titulo: 'Nota Huerfana', espacioId: null });

    const notasEspacio1 = await repository.getByEspacio(1);
    expect(notasEspacio1.length).toBe(1);
    expect(notasEspacio1[0].titulo).toBe('Nota Espacio 1');

    const notasEspacio2 = await repository.getByEspacio(2);
    expect(notasEspacio2.length).toBe(1);
    expect(notasEspacio2[0].titulo).toBe('Nota Espacio 2');
  });

  it('debe filtrar por categoría en queries tanto globales como por espacio', async () => {
    await repository.create({ titulo: 'Nota A', categoria: 'Trabajo', espacioId: 1 });
    await repository.create({ titulo: 'Nota B', categoria: 'Salud', espacioId: 1 });
    await repository.create({ titulo: 'Nota C', categoria: 'Trabajo', espacioId: 2 });

    const trabajoEspacio1 = await repository.getByEspacio(1, 'Trabajo');
    expect(trabajoEspacio1.length).toBe(1);
    expect(trabajoEspacio1[0].titulo).toBe('Nota A');

    const todasSalud = await repository.getAll('Salud');
    expect(todasSalud.length).toBe(1);
    expect(todasSalud[0].titulo).toBe('Nota B');

    const categorias = await repository.getCategorias(1);
    expect(categorias).toEqual(['Salud', 'Trabajo']);
  });

  it('delete debe eliminar la nota de IndexedDB', async () => {
    const nota = await repository.create({ titulo: 'Por borrar', espacioId: 1 });
    await repository.delete(nota.id!);

    const postDelete = await repository.getById(nota.id!);
    expect(postDelete).toBeUndefined();
  });
});
