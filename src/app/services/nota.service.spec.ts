import { TestBed } from '@angular/core/testing';
import { NotaService } from './nota.service';
import { NotaRepository } from '../repositories/nota.repository';
import { EspacioService } from './espacio.service';
import { EspacioRepository } from '../repositories/espacio.repository';
import { DatabaseService } from '../repositories/database.service';

describe('NotaService (T-04.1 Dominio y Estado Reactivo de Notas)', () => {
  let service: NotaService;
  let dbService: DatabaseService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        NotaService,
        NotaRepository,
        EspacioService,
        EspacioRepository,
        DatabaseService
      ]
    });

    service = TestBed.inject(NotaService);
    dbService = TestBed.inject(DatabaseService);

    await dbService.notas.clear();
    await dbService.espacios.clear();
  });

  afterAll(async () => {
    await dbService.db.close();
  });

  it('debe rechazar la creación de una nota con título vacío', async () => {
    await expectAsync(service.create({
      titulo: '   ',
      contenido: 'Texto',
      espacioId: 1
    })).toBeRejectedWithError('El título de la nota es obligatorio');
  });

  it('debe actualizar la señal notas cuando se crea una nota en el espacio activo', async () => {
    await service.setEspacioActivo(1);
    expect(service.notas().length).toBe(0);

    await service.create({
      titulo: 'Nota 1',
      contenido: 'Contenido 1',
      espacioId: 1
    });

    expect(service.notas().length).toBe(1);
    expect(service.notas()[0].titulo).toBe('Nota 1');
  });

  it('no debe incluir en la señal notas del espacio activo aquellas de otro espacio', async () => {
    await service.setEspacioActivo(1);

    await service.create({
      titulo: 'Nota Espacio 2',
      contenido: 'Contenido',
      espacioId: 2
    });

    expect(service.notas().length).toBe(0);
  });

  it('debe filtrar reactivamente por categoría en el espacio activo', async () => {
    await service.setEspacioActivo(1);

    await service.create({ titulo: 'Nota Trabajo', categoria: 'Trabajo', espacioId: 1 });
    await service.create({ titulo: 'Nota Ocio', categoria: 'Ocio', espacioId: 1 });

    expect(service.notas().length).toBe(2);

    await service.setCategoriaFiltro('Trabajo');
    expect(service.notas().length).toBe(1);
    expect(service.notas()[0].titulo).toBe('Nota Trabajo');

    await service.setCategoriaFiltro(null);
    expect(service.notas().length).toBe(2);
  });

  it('debe actualizar una nota y reflejarlo en la señal', async () => {
    await service.setEspacioActivo(1);
    const nota = await service.create({ titulo: 'Original', espacioId: 1 });

    await service.update(nota.id!, { titulo: 'Actualizada' });
    expect(service.notas()[0].titulo).toBe('Actualizada');
  });

  it('debe eliminar una nota y removerla de la señal', async () => {
    await service.setEspacioActivo(1);
    const nota = await service.create({ titulo: 'A borrar', espacioId: 1 });
    expect(service.notas().length).toBe(1);

    await service.delete(nota.id!);
    expect(service.notas().length).toBe(0);
  });
});
