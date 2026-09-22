import { TestBed } from '@angular/core/testing';
import { RecordatorioService } from './recordatorio.service';
import { RecordatorioRepository } from '../repositories/recordatorio.repository';
import { Recordatorio } from '../models';

describe('RecordatorioService (T-07.1)', () => {
  let service: RecordatorioService;
  let repositorySpy: jasmine.SpyObj<RecordatorioRepository>;

  const mockRecordatorio: Recordatorio = {
    id: 1,
    titulo: 'Revisar PR',
    fechaHora: '2026-10-01T10:00:00.000Z',
    tareaId: 10,
    eventoId: null,
    notificado: false
  };

  beforeEach(() => {
    const spy = jasmine.createSpyObj('RecordatorioRepository', [
      'getAll',
      'getById',
      'getByTarea',
      'getByEvento',
      'getAnterioresAHora',
      'getPendientesNotificar',
      'create',
      'update',
      'delete'
    ]);

    TestBed.configureTestingModule({
      providers: [
        RecordatorioService,
        { provide: RecordatorioRepository, useValue: spy }
      ]
    });

    service = TestBed.inject(RecordatorioService);
    repositorySpy = TestBed.inject(RecordatorioRepository) as jasmine.SpyObj<RecordatorioRepository>;

    repositorySpy.getAll.and.returnValue(Promise.resolve([mockRecordatorio]));
  });

  it('debe crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('debe cargar recordatorios y actualizar la señal reactiva', async () => {
    const res = await service.loadAll();
    expect(res.length).toBe(1);
    expect(service.recordatorios().length).toBe(1);
    expect(service.recordatorios()[0].titulo).toBe('Revisar PR');
  });

  it('debe crear un recordatorio y recargar la señal', async () => {
    repositorySpy.create.and.returnValue(Promise.resolve(mockRecordatorio));

    const nuevo = await service.create({
      titulo: 'Revisar PR',
      fechaHora: '2026-10-01T10:00:00.000Z',
      tareaId: 10
    });

    expect(nuevo.id).toBe(1);
    expect(repositorySpy.create).toHaveBeenCalled();
    expect(repositorySpy.getAll).toHaveBeenCalled();
  });

  it('debe actualizar un recordatorio y recargar la señal', async () => {
    const actualizado = { ...mockRecordatorio, titulo: 'Actualizado' };
    repositorySpy.update.and.returnValue(Promise.resolve(actualizado));

    const res = await service.update(1, { titulo: 'Actualizado' });
    expect(res.titulo).toBe('Actualizado');
    expect(repositorySpy.update).toHaveBeenCalledWith(1, { titulo: 'Actualizado' });
    expect(repositorySpy.getAll).toHaveBeenCalled();
  });

  it('debe marcar un recordatorio como notificado', async () => {
    const notificado = { ...mockRecordatorio, notificado: true };
    repositorySpy.update.and.returnValue(Promise.resolve(notificado));

    const res = await service.marcarNotificado(1);
    expect(res.notificado).toBeTrue();
    expect(repositorySpy.update).toHaveBeenCalledWith(1, { notificado: true });
  });

  it('debe eliminar un recordatorio y recargar la señal', async () => {
    repositorySpy.delete.and.returnValue(Promise.resolve());

    await service.delete(1);
    expect(repositorySpy.delete).toHaveBeenCalledWith(1);
    expect(repositorySpy.getAll).toHaveBeenCalled();
  });

  it('debe delegar getByTarea y getByEvento al repositorio', async () => {
    repositorySpy.getByTarea.and.returnValue(Promise.resolve([mockRecordatorio]));
    repositorySpy.getByEvento.and.returnValue(Promise.resolve([]));

    const porTarea = await service.getByTarea(10);
    const porEvento = await service.getByEvento(20);

    expect(porTarea.length).toBe(1);
    expect(porEvento.length).toBe(0);
    expect(repositorySpy.getByTarea).toHaveBeenCalledWith(10);
    expect(repositorySpy.getByEvento).toHaveBeenCalledWith(20);
  });
});
