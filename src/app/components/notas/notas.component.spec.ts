import { TestBed, ComponentFixture } from '@angular/core/testing';
import { NotasComponent } from './notas.component';
import { NotaService } from '../../services/nota.service';
import { NotaRepository } from '../../repositories/nota.repository';
import { EspacioService } from '../../services/espacio.service';
import { EspacioRepository } from '../../repositories/espacio.repository';
import { DatabaseService } from '../../repositories/database.service';
import { Espacio } from '../../models';

describe('NotasComponent (T-04.2, T-04.3, T-04.4, T-04.5)', () => {
  let fixture: ComponentFixture<NotasComponent>;
  let component: NotasComponent;
  let notaService: NotaService;
  let espacioService: EspacioService;
  let dbService: DatabaseService;

  let espacio1: Espacio;
  let espacio2: Espacio;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotasComponent],
      providers: [
        NotaService,
        NotaRepository,
        EspacioService,
        EspacioRepository,
        DatabaseService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NotasComponent);
    component = fixture.componentInstance;
    notaService = TestBed.inject(NotaService);
    espacioService = TestBed.inject(EspacioService);
    dbService = TestBed.inject(DatabaseService);

    await dbService.notas.clear();
    await dbService.espacios.clear();

    espacio1 = await espacioService.create({
      nombre: 'Trabajo',
      color: '#3b82f6',
      esSistema: false,
      fechaCreacion: new Date().toISOString()
    });

    espacio2 = await espacioService.create({
      nombre: 'Personal',
      color: '#10b981',
      esSistema: false,
      fechaCreacion: new Date().toISOString()
    });

    // Iniciar contexto en espacio 1
    await espacioService.getAll();
    await notaService.setEspacioActivo(espacio1.id!);
    fixture.detectChanges();
  });

  afterAll(async () => {
    await dbService.db.close();
  });

  it('T-04.2: debe mostrar únicamente las notas del espacio activo e indicar el espacio activo', async () => {
    await notaService.create({ titulo: 'Nota Trabajo 1', espacioId: espacio1.id! });
    await notaService.create({ titulo: 'Nota Trabajo 2', espacioId: espacio1.id! });
    await notaService.create({ titulo: 'Nota Personal', espacioId: espacio2.id! });
    // Nota sin espacio asignado (R-07)
    await dbService.notas.add({
      titulo: 'Nota Huerfana',
      espacioId: null,
      fechaCreacion: new Date().toISOString(),
      fechaActualizacion: new Date().toISOString()
    });

    await notaService.refresh();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const cards = compiled.querySelectorAll('.nota-card');

    expect(cards.length).toBe(2);
    expect(compiled.textContent).toContain('Nota Trabajo 1');
    expect(compiled.textContent).toContain('Nota Trabajo 2');
    expect(compiled.textContent).not.toContain('Nota Personal');
    expect(compiled.textContent).not.toContain('Nota Huerfana'); // R-07 cumplido

    // Selector muestra el espacio activo
    const dropdown = compiled.querySelector('#select-espacio-activo') as HTMLSelectElement;
    expect(dropdown.value).toBe(String(espacio1.id));
  });

  it('T-04.2: debe filtrar por categoría dentro del espacio activo', async () => {
    await notaService.create({ titulo: 'Guía Angular', categoria: 'Dev', espacioId: espacio1.id! });
    await notaService.create({ titulo: 'Guía Docker', categoria: 'Dev', espacioId: espacio1.id! });
    await notaService.create({ titulo: 'Minuta Reunión', categoria: 'Reuniones', espacioId: espacio1.id! });

    await notaService.refresh();
    fixture.detectChanges();

    expect(component.notas().length).toBe(3);
    expect(component.categorias()).toEqual(['Dev', 'Reuniones']);

    // Filtrar por Dev
    await component.onSelectCategoria('Dev');
    fixture.detectChanges();

    expect(component.notas().length).toBe(2);
    expect(component.notas()[0].titulo).toBe('Guía Angular');

    // Restablecer todas
    await component.onSelectCategoria(null);
    fixture.detectChanges();
    expect(component.notas().length).toBe(3);
  });

  it('T-04.3: debe abrir el modal de creación y guardar una nueva nota', async () => {
    component.openCreateModal();
    fixture.detectChanges();
    expect(component.isFormModalOpen()).toBeTrue();

    await component.onSaveNota({
      titulo: 'Nueva Nota Test',
      contenido: 'Detalle de prueba',
      categoria: 'General',
      espacioId: espacio1.id
    });
    fixture.detectChanges();

    expect(component.isFormModalOpen()).toBeFalse();
    expect(component.notas().length).toBe(1);
    expect(component.notas()[0].titulo).toBe('Nueva Nota Test');
  });

  it('T-04.3: debe abrir el modal de edición y actualizar la nota existente', async () => {
    const nota = await notaService.create({
      titulo: 'Borrador',
      contenido: 'Texto viejo',
      espacioId: espacio1.id!
    });

    component.openEditModal(nota);
    fixture.detectChanges();

    expect(component.isFormModalOpen()).toBeTrue();
    expect(component.notaToEdit()?.id).toBe(nota.id);

    await component.onSaveNota({
      titulo: 'Publicado',
      contenido: 'Texto final'
    });
    fixture.detectChanges();

    expect(component.isFormModalOpen()).toBeFalse();
    expect(component.notas()[0].titulo).toBe('Publicado');
  });

  it('T-04.4: debe abrir el modal de confirmación y eliminar la nota', async () => {
    const nota = await notaService.create({
      titulo: 'Nota a borrar',
      espacioId: espacio1.id!
    });

    expect(component.notas().length).toBe(1);

    component.openDeleteModal(nota);
    fixture.detectChanges();
    expect(component.isDeleteModalOpen()).toBeTrue();
    expect(component.notaToDelete()?.id).toBe(nota.id);

    await component.onConfirmDelete();
    fixture.detectChanges();

    expect(component.isDeleteModalOpen()).toBeFalse();
    expect(component.notas().length).toBe(0);

    const enDb = await dbService.notas.get(nota.id!);
    expect(enDb).toBeUndefined();
  });

  it('T-04.5: debe abrir y cerrar la vista de detalle de nota en modo lectura', async () => {
    const nota = await notaService.create({
      titulo: 'Nota para Detalle',
      contenido: 'Texto completo de la nota',
      categoria: 'Docs',
      espacioId: espacio1.id!
    });

    component.openDetalleModal(nota);
    fixture.detectChanges();

    expect(component.isDetalleModalOpen()).toBeTrue();
    expect(component.notaInDetalle()?.id).toBe(nota.id);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('#nota-detalle-modal')).toBeTruthy();
    expect(compiled.textContent).toContain('Texto completo de la nota');

    component.closeDetalleModal();
    fixture.detectChanges();
    expect(component.isDetalleModalOpen()).toBeFalse();
  });

  it('T-04.5: desde la vista detalle se puede pasar a modo edición', async () => {
    const nota = await notaService.create({
      titulo: 'Editar desde detalle',
      espacioId: espacio1.id!
    });

    component.openDetalleModal(nota);
    fixture.detectChanges();

    component.openEditFromDetalle();
    fixture.detectChanges();

    expect(component.isDetalleModalOpen()).toBeFalse();
    expect(component.isFormModalOpen()).toBeTrue();
    expect(component.notaToEdit()?.id).toBe(nota.id);
  });
});
