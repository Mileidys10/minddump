import { TestBed } from '@angular/core/testing';
import { RecordatorioRepository } from './recordatorio.repository';
import { DatabaseService } from './database.service';

describe('RecordatorioRepository (T-07.1)', () => {
  let repository: RecordatorioRepository;
  let dbService: DatabaseService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [RecordatorioRepository, DatabaseService]
    });

    repository = TestBed.inject(RecordatorioRepository);
    dbService = TestBed.inject(DatabaseService);

    await dbService.recordatorios.clear();
  });

  afterEach(async () => {
    await dbService.recordatorios.clear();
  });

  it('debe crearse correctamente', () => {
    expect(repository).toBeTruthy();
  });

  describe('validación de exclusividad (tareaId XOR eventoId)', () => {
    it('debe fallar si no tiene tareaId ni eventoId', async () => {
      await expectAsync(
        repository.create({
          titulo: 'Recordatorio sin asociación',
          fechaHora: '2026-10-01T10:00:00.000Z'
        })
      ).toBeRejectedWithError(/Un recordatorio debe estar asociado a una tarea o a un evento/);
    });

    it('debe fallar si tiene simultáneamente tareaId y eventoId', async () => {
      await expectAsync(
        repository.create({
          titulo: 'Recordatorio con doble asociación',
          fechaHora: '2026-10-01T10:00:00.000Z',
          tareaId: 1,
          eventoId: 2
        })
      ).toBeRejectedWithError(/simultáneamente a una tarea y a un evento/);
    });

    it('debe fallar si fechaHora es inválida o vacía', async () => {
      await expectAsync(
        repository.create({
          titulo: 'Recordatorio fecha inválida',
          fechaHora: 'fecha-invalida',
          tareaId: 1
        })
      ).toBeRejectedWithError(/Fecha y hora inválida/);
    });
  });

  describe('creación y persistencia', () => {
    it('debe crear un recordatorio para una tarea con ID generado automáticamente', async () => {
      const creado = await repository.create({
        titulo: 'Revisar informe de gastos',
        descripcion: 'Verificar recibos adjuntos',
        fechaHora: '2026-10-15T09:00:00.000Z',
        tareaId: 10
      });

      expect(creado.id).toBeDefined();
      expect(creado.id).toBeGreaterThan(0);
      expect(creado.tareaId).toBe(10);
      expect(creado.eventoId).toBeNull();
      expect(creado.notificado).toBeFalse();

      const enBd = await repository.getById(creado.id!);
      expect(enBd).toBeDefined();
      expect(enBd?.titulo).toBe('Revisar informe de gastos');
    });

    it('debe crear un recordatorio para un evento con ID generado automáticamente', async () => {
      const creado = await repository.create({
        titulo: 'Alarma de inicio de reunión',
        fechaHora: '2026-10-15T15:00:00.000Z',
        eventoId: 20
      });

      expect(creado.id).toBeDefined();
      expect(creado.eventoId).toBe(20);
      expect(creado.tareaId).toBeNull();
    });
  });

  describe('consultas y filtros', () => {
    beforeEach(async () => {
      await repository.create({
        titulo: 'Tarea Rec 1',
        fechaHora: '2026-10-01T10:00:00.000Z',
        tareaId: 100
      });
      await repository.create({
        titulo: 'Tarea Rec 2',
        fechaHora: '2026-10-02T10:00:00.000Z',
        tareaId: 100
      });
      await repository.create({
        titulo: 'Otra Tarea Rec',
        fechaHora: '2026-10-03T10:00:00.000Z',
        tareaId: 101
      });
      await repository.create({
        titulo: 'Evento Rec 1',
        fechaHora: '2026-10-01T12:00:00.000Z',
        eventoId: 200
      });
    });

    it('debe obtener recordatorios por tareaId ordenados cronológicamente', async () => {
      const lista = await repository.getByTarea(100);
      expect(lista.length).toBe(2);
      expect(lista[0].titulo).toBe('Tarea Rec 1');
      expect(lista[1].titulo).toBe('Tarea Rec 2');
    });

    it('debe obtener recordatorios por eventoId', async () => {
      const lista = await repository.getByEvento(200);
      expect(lista.length).toBe(1);
      expect(lista[0].titulo).toBe('Evento Rec 1');
    });

    it('debe retornar lista vacía si tarea no tiene recordatorios', async () => {
      const lista = await repository.getByTarea(999);
      expect(lista).toEqual([]);
    });

    it('debe recuperar todos los recordatorios con fechaHora anterior a una fecha de referencia', async () => {
      const debidos = await repository.getAnterioresAHora('2026-10-01T11:00:00.000Z');
      expect(debidos.length).toBe(1);
      expect(debidos[0].titulo).toBe('Tarea Rec 1');
    });

    it('debe recuperar recordatorios pendientes de notificar', async () => {
      const pendientes = await repository.getPendientesNotificar('2026-10-01T15:00:00.000Z');
      expect(pendientes.length).toBe(2); // Tarea Rec 1 y Evento Rec 1
      expect(pendientes.every(r => !r.notificado)).toBeTrue();
    });
  });

  describe('actualización y eliminación', () => {
    it('debe actualizar la fechaHora y campos del recordatorio', async () => {
      const creado = await repository.create({
        titulo: 'Original',
        fechaHora: '2026-10-01T10:00:00.000Z',
        tareaId: 50
      });

      const actualizado = await repository.update(creado.id!, {
        titulo: 'Modificado',
        fechaHora: '2026-10-01T11:00:00.000Z',
        notificado: true
      });

      expect(actualizado.titulo).toBe('Modificado');
      expect(actualizado.fechaHora).toBe('2026-10-01T11:00:00.000Z');
      expect(actualizado.notificado).toBeTrue();
    });

    it('debe rechazar actualizar a un estado no exclusivo', async () => {
      const creado = await repository.create({
        titulo: 'Original',
        fechaHora: '2026-10-01T10:00:00.000Z',
        tareaId: 50
      });

      await expectAsync(
        repository.update(creado.id!, {
          eventoId: 60 // ahora tendría tareaId: 50 y eventoId: 60
        })
      ).toBeRejectedWithError(/simultáneamente a una tarea y a un evento/);
    });

    it('debe eliminar un recordatorio existente', async () => {
      const creado = await repository.create({
        titulo: 'A eliminar',
        fechaHora: '2026-10-01T10:00:00.000Z',
        tareaId: 50
      });

      await repository.delete(creado.id!);
      const buscando = await repository.getById(creado.id!);
      expect(buscando).toBeUndefined();
    });
  });
});
