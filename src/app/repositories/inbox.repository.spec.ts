import { TestBed } from '@angular/core/testing';
import { InboxRepository } from './inbox.repository';
import { DatabaseService } from './database.service';

describe('InboxRepository', () => {
  let repository: InboxRepository;
  let dbService: DatabaseService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [InboxRepository, DatabaseService]
    });

    repository = TestBed.inject(InboxRepository);
    dbService = TestBed.inject(DatabaseService);

    await dbService.inbox.clear();
  });

  afterEach(async () => {
    await dbService.inbox.clear();
  });

  it('debe crearse correctamente', () => {
    expect(repository).toBeTruthy();
  });

  it('debe crear una captura recién creada con organizado: false por defecto', async () => {
    const creada = await repository.create({
      titulo: 'Comprar bombillas',
      descripcion: 'LED de luz cálida'
    });

    expect(creada.id).toBeDefined();
    expect(creada.titulo).toBe('Comprar bombillas');
    expect(creada.descripcion).toBe('LED de luz cálida');
    expect(creada.organizado).toBeFalse();
    expect(creada.fechaCreacion).toBeDefined();

    const enDb = await repository.getById(creada.id!);
    expect(enDb?.organizado).toBeFalse();
  });

  it('debe retornar solo capturas pendientes en getPendientes() ordenadas por fecha reciente', async () => {
    const item1 = await repository.create({ titulo: 'Primera idea' });
    // Pequeño delay para timestamps distintos
    await new Promise(resolve => setTimeout(resolve, 10));
    const item2 = await repository.create({ titulo: 'Segunda idea' });
    await new Promise(resolve => setTimeout(resolve, 10));
    const item3 = await repository.create({ titulo: 'Tercera idea (organizada)', organizado: true });

    const pendientes = await repository.getPendientes();
    expect(pendientes.length).toBe(2);
    // Más reciente primero
    expect(pendientes[0].id).toBe(item2.id);
    expect(pendientes[1].id).toBe(item1.id);
    expect(pendientes.some(i => i.id === item3.id)).toBeFalse();

    const todas = await repository.getAll();
    expect(todas.length).toBe(3);
  });

  it('debe marcar como organizado mediante marcarOrganizado() sin borrar el registro', async () => {
    const item = await repository.create({ titulo: 'Idea a procesar' });
    expect(item.organizado).toBeFalse();

    await repository.marcarOrganizado(item.id!);

    const enDb = await repository.getById(item.id!);
    expect(enDb).toBeDefined();
    expect(enDb?.organizado).toBeTrue();

    const pendientes = await repository.getPendientes();
    expect(pendientes.length).toBe(0);
  });

  it('debe actualizar y eliminar capturas', async () => {
    const item = await repository.create({ titulo: 'Original', descripcion: 'Desc 1' });

    await repository.update(item.id!, { titulo: 'Modificado', descripcion: 'Desc 2' });
    let enDb = await repository.getById(item.id!);
    expect(enDb?.titulo).toBe('Modificado');
    expect(enDb?.descripcion).toBe('Desc 2');

    await repository.delete(item.id!);
    enDb = await repository.getById(item.id!);
    expect(enDb).toBeUndefined();
  });
});
