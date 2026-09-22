import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EspaciosComponent } from './espacios.component';
import { EspacioService } from '../../services/espacio.service';
import { EspacioRepository } from '../../repositories/espacio.repository';
import { DatabaseService } from '../../repositories/database.service';
import { UTILES_ESPACIO_NOMBRE } from '../../services/init.service';
import { Espacio } from '../../models';

describe('EspaciosComponent (T-02.2, T-02.3, T-02.4)', () => {
  let fixture: ComponentFixture<EspaciosComponent>;
  let component: EspaciosComponent;
  let espacioService: EspacioService;
  let dbService: DatabaseService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EspaciosComponent],
      providers: [provideRouter([]), EspacioService, EspacioRepository, DatabaseService]
    }).compileComponents();

    fixture = TestBed.createComponent(EspaciosComponent);
    component = fixture.componentInstance;
    espacioService = TestBed.inject(EspacioService);
    dbService = TestBed.inject(DatabaseService);

    await dbService.espacios.clear();
    await dbService.notas.clear();
    await dbService.tareas.clear();
    await dbService.eventos.clear();

    // Crear espacio del sistema Útiles (D-05)
    await dbService.espacios.add({
      nombre: UTILES_ESPACIO_NOMBRE,
      titulo: UTILES_ESPACIO_NOMBRE,
      descripcion: 'Espacio predeterminado del sistema',
      color: '#6366f1',
      esSistema: true,
      fechaCreacion: new Date().toISOString()
    });

    await espacioService.getAll();
    fixture.detectChanges();
  });

  afterAll(async () => {
    await dbService.db.close();
  });

  it('T-02.2: debe listar el espacio Útiles identificado visualmente como espacio de sistema (D-05)', async () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    const utilesCard = compiled.querySelector('.system-space');
    expect(utilesCard).toBeTruthy();
    expect(utilesCard?.textContent).toContain(UTILES_ESPACIO_NOMBRE);

    const systemBadge = compiled.querySelector('#system-badge-utiles');
    expect(systemBadge).toBeTruthy();
    expect(systemBadge?.textContent).toContain('Sistema');
  });

  it('T-02.4: el espacio Útiles NO debe mostrar opción o botón de eliminar', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    const utiles = component.espacios().find(e => e.esSistema);
    expect(utiles).toBeDefined();

    const deleteBtn = compiled.querySelector(`#btn-delete-espacio-${utiles?.id}`);
    expect(deleteBtn).toBeNull();
    expect(component.canDelete(utiles!)).toBeFalse();
  });

  it('T-02.2: debe mostrar aviso de invitación a crear espacios si solo existe Útiles', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    const notice = compiled.querySelector('#empty-user-spaces-notice');
    expect(notice).toBeTruthy();
    expect(notice?.textContent).toContain('Crea tus propios espacios');
  });

  it('T-02.3: debe abrir el modal de creación y guardar un nuevo espacio', async () => {
    component.openCreateModal();
    fixture.detectChanges();
    expect(component.isFormModalOpen()).toBeTrue();

    await component.onSaveEspacio({
      nombre: 'Proyectos 2026',
      descripcion: 'Metas y tareas del año',
      color: '#10b981'
    });
    fixture.detectChanges();

    expect(component.isFormModalOpen()).toBeFalse();
    expect(component.espacios().length).toBe(2);

    const nuevo = component.espacios().find(e => e.nombre === 'Proyectos 2026');
    expect(nuevo).toBeDefined();
    expect(nuevo?.color).toBe('#10b981');

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector(`#space-card-${nuevo?.id}`)).toBeTruthy();
  });

  it('T-02.3: debe permitir editar un espacio existente y actualizar la lista reactivamente', async () => {
    const regular = await espacioService.create({
      nombre: 'Personal',
      descripcion: 'Cosas mías',
      color: '#f59e0b',
      esSistema: false,
      fechaCreacion: new Date().toISOString()
    });

    component.openEditModal(regular);
    fixture.detectChanges();

    expect(component.isFormModalOpen()).toBeTrue();
    expect(component.espacioToEdit()?.id).toBe(regular.id);

    await component.onSaveEspacio({
      nombre: 'Vida Personal',
      descripcion: 'Bienestar y hobbies',
      color: '#ec4899'
    });
    fixture.detectChanges();

    const actualizado = component.espacios().find(e => e.id === regular.id);
    expect(actualizado?.nombre).toBe('Vida Personal');
    expect(actualizado?.color).toBe('#ec4899');
  });

  it('T-02.4: debe abrir el modal de confirmación y eliminar un espacio regular desvinculando huérfanos', async () => {
    const space = await espacioService.create({
      nombre: 'A eliminar',
      color: '#ef4444',
      esSistema: false,
      fechaCreacion: new Date().toISOString()
    });

    const notaId = await dbService.notas.add({
      titulo: 'Nota en espacio a eliminar',
      espacioId: space.id!,
      fechaCreacion: new Date().toISOString(),
      fechaActualizacion: new Date().toISOString()
    });

    component.openDeleteModal(space);
    fixture.detectChanges();

    expect(component.isDeleteModalOpen()).toBeTrue();
    expect(component.espacioToDelete()?.id).toBe(space.id);

    await component.onConfirmDelete();
    fixture.detectChanges();

    expect(component.isDeleteModalOpen()).toBeFalse();
    expect(component.espacios().find(e => e.id === space.id)).toBeUndefined();

    // Comprobar que la nota quedó con espacioId: null
    const nota = await dbService.notas.get(notaId);
    expect(nota?.espacioId).toBeNull();
  });

  it('T-02.4: cancelar la confirmación de eliminación no modifica nada', () => {
    const space: Espacio = { id: 999, nombre: 'No borrar', color: '#6366f1', esSistema: false, fechaCreacion: '2026-09-01T00:00:00Z' };
    component.openDeleteModal(space);
    expect(component.isDeleteModalOpen()).toBeTrue();

    component.closeDeleteModal();
    expect(component.isDeleteModalOpen()).toBeFalse();
    expect(component.espacioToDelete()).toBeNull();
  });
});
