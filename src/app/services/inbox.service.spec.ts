import { TestBed } from '@angular/core/testing';
import { InboxService } from './inbox.service';
import { InboxRepository } from '../repositories/inbox.repository';
import { DatabaseService } from '../repositories/database.service';

describe('InboxService', () => {
  let service: InboxService;
  let dbService: DatabaseService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [InboxService, InboxRepository, DatabaseService]
    });

    service = TestBed.inject(InboxService);
    dbService = TestBed.inject(DatabaseService);

    await dbService.inbox.clear();
  });

  afterEach(async () => {
    await dbService.inbox.clear();
  });

  it('debe inicializarse correctamente', () => {
    expect(service).toBeTruthy();
    expect(service.pendientes()).toEqual([]);
    expect(service.totalPendientes()).toBe(0);
  });

  it('debe rechazar la creación de captura con título vacío o solo espacios', async () => {
    await expectAsync(
      service.create({ titulo: '   ' })
    ).toBeRejectedWithError('El título de la captura es obligatorio');
  });

  it('debe crear una captura y refrescar la señal reactiva pendientes', async () => {
    const creada = await service.create({
      titulo: 'Idea brillante',
      descripcion: 'Detalle de la idea'
    });

    expect(creada.id).toBeDefined();
    expect(service.pendientes().length).toBe(1);
    expect(service.totalPendientes()).toBe(1);
    expect(service.pendientes()[0].titulo).toBe('Idea brillante');
  });

  it('debe marcar como organizado y remover de pendientes reactivamente', async () => {
    const item = await service.create({ titulo: 'Idea 1' });
    expect(service.pendientes().length).toBe(1);

    await service.marcarOrganizado(item.id!);
    expect(service.pendientes().length).toBe(0);
    expect(service.totalPendientes()).toBe(0);
  });

  it('debe eliminar la captura y remover de pendientes', async () => {
    const item = await service.create({ titulo: 'Idea descartada' });
    expect(service.pendientes().length).toBe(1);

    await service.delete(item.id!);
    expect(service.pendientes().length).toBe(0);
  });
});
