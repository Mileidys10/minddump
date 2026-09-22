import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TareasComponent } from './tareas.component';
import { TareaService } from '../../services/tarea.service';
import { EspacioService } from '../../services/espacio.service';
import { DatabaseService } from '../../repositories/database.service';
import { AppInitService } from '../../services/init.service';

describe('TareasComponent (P-06)', () => {
  let component: TareasComponent;
  let fixture: ComponentFixture<TareasComponent>;
  let tareaService: TareaService;
  let espacioService: EspacioService;
  let dbService: DatabaseService;
  let appInitService: AppInitService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TareasComponent],
      providers: [TareaService, EspacioService, DatabaseService, AppInitService]
    }).compileComponents();

    dbService = TestBed.inject(DatabaseService);
    tareaService = TestBed.inject(TareaService);
    espacioService = TestBed.inject(EspacioService);
    appInitService = TestBed.inject(AppInitService);

    await dbService.espacios.clear();
    await dbService.tareas.clear();
    await dbService.recordatorios.clear();

    // Crear espacio Útiles y un espacio de usuario
    await appInitService.initUtilesSpace();
    await espacioService.create({
      nombre: 'Trabajo',
      color: '#10b981',
      descripcion: 'Espacio de oficina',
      esSistema: false,
      fechaCreacion: '2026-01-02'
    });

    fixture = TestBed.createComponent(TareasComponent);
    component = fixture.componentInstance;
  });

  afterEach(async () => {
    await dbService.espacios.clear();
    await dbService.tareas.clear();
    await dbService.recordatorios.clear();
  });

  it('debe crearse correctamente e inicializar el espacio activo', async () => {
    await component.ngOnInit();
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(component.espacioActivo()).toBeDefined();
  });

  it('debe mostrar únicamente las tareas del espacio activo (D-01) y excluir huérfanas (R-07)', async () => {
    const espacios = await espacioService.getAll();
    const esp1 = espacios[0];
    const esp2 = espacios[1];

    // Tareas en espacio 1
    await tareaService.create({
      titulo: 'Tarea en Espacio 1',
      prioridad: 'Normal',
      estado: 'Pendiente',
      espacioId: esp1.id!
    });

    // Tarea en espacio 2
    await tareaService.create({
      titulo: 'Tarea en Espacio 2',
      prioridad: 'Urgente',
      estado: 'Pendiente',
      espacioId: esp2.id!
    });

    // Tarea huérfana (espacioId: null) -> NO debe aparecer en P-06 per R-07
    await tareaService.create({
      titulo: 'Tarea Huérfana',
      prioridad: 'Baja',
      estado: 'Pendiente',
      espacioId: null
    });

    await component.ngOnInit();
    await component.onCambiarEspacio(esp1.id!);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Tarea en Espacio 1');
    expect(compiled.textContent).not.toContain('Tarea en Espacio 2');
    expect(compiled.textContent).not.toContain('Tarea Huérfana');
  });

  it('debe separar tareas activas y finalizadas con orden de prioridad correcto', async () => {
    const espacios = await espacioService.getAll();
    const espId = espacios[0].id!;

    await tareaService.create({
      titulo: 'Tarea Baja Activa',
      prioridad: 'Baja',
      estado: 'Pendiente',
      espacioId: espId
    });

    await tareaService.create({
      titulo: 'Tarea Urgente Activa',
      prioridad: 'Urgente',
      estado: 'En progreso',
      espacioId: espId
    });

    await tareaService.create({
      titulo: 'Tarea Completada',
      prioridad: 'Normal',
      estado: 'Completada',
      espacioId: espId
    });

    await component.ngOnInit();
    await component.onCambiarEspacio(espId);
    fixture.detectChanges();

    expect(tareaService.tareasActivas().length).toBe(2);
    expect(tareaService.tareasFinalizadas().length).toBe(1);

    // En activas, Urgente debe estar primero
    expect(tareaService.tareasActivas()[0].titulo).toBe('Tarea Urgente Activa');
    expect(tareaService.tareasActivas()[1].titulo).toBe('Tarea Baja Activa');

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Tareas Activas');
    expect(compiled.textContent).toContain('Tareas Finalizadas');
    expect(compiled.textContent).toContain('Tarea Completada');
  });

  it('debe cambiar el estado de una tarea rápidamente mediante el control de estado (T-05.4)', async () => {
    const espacios = await espacioService.getAll();
    const espId = espacios[0].id!;

    const tarea = await tareaService.create({
      titulo: 'Revisión rápida',
      prioridad: 'Normal',
      estado: 'Pendiente',
      espacioId: espId
    });

    await component.ngOnInit();
    await component.onCambiarEspacio(espId);
    fixture.detectChanges();

    expect(tareaService.tareasActivas().length).toBe(1);
    expect(tareaService.tareasFinalizadas().length).toBe(0);

    // Cambiar a Completada
    await component.onCambiarEstado(tarea, 'Completada');
    fixture.detectChanges();

    expect(tareaService.tareasActivas().length).toBe(0);
    expect(tareaService.tareasFinalizadas().length).toBe(1);
    expect(tareaService.tareasFinalizadas()[0].estado).toBe('Completada');
  });

  it('debe filtrar tareas por chips de categoría', async () => {
    const espacios = await espacioService.getAll();
    const espId = espacios[0].id!;

    await tareaService.create({
      titulo: 'Tarea Backend',
      prioridad: 'Normal',
      estado: 'Pendiente',
      categoria: 'Backend',
      espacioId: espId
    });

    await tareaService.create({
      titulo: 'Tarea Diseño',
      prioridad: 'Baja',
      estado: 'Pendiente',
      categoria: 'Diseño',
      espacioId: espId
    });

    await component.ngOnInit();
    await component.onCambiarEspacio(espId);
    fixture.detectChanges();

    expect(tareaService.categorias()).toEqual(['Backend', 'Diseño']);

    await component.onFiltrarCategoria('Diseño');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Tarea Diseño');
    expect(compiled.textContent).not.toContain('Tarea Backend');
  });

  it('debe abrir y cerrar los modales de creación, detalle, edición y eliminación', async () => {
    await component.ngOnInit();
    fixture.detectChanges();

    // Crear
    component.openCreateModal();
    expect(component.isModalOpen).toBeTrue();
    component.closeModal();
    expect(component.isModalOpen).toBeFalse();

    // Detalle
    const tareaDummy = {
      id: 99,
      titulo: 'Tarea Test',
      prioridad: 'Normal' as const,
      estado: 'Pendiente' as const,
      espacioId: 1,
      fechaCreacion: '2026-01-01',
      fechaActualizacion: '2026-01-01'
    };

    component.openDetailModal(tareaDummy);
    expect(component.isDetailOpen).toBeTrue();
    expect(component.selectedTarea).toEqual(tareaDummy);
    component.closeDetailModal();
    expect(component.isDetailOpen).toBeFalse();

    // Eliminar
    component.openDeleteModal(tareaDummy);
    expect(component.isDeleteOpen).toBeTrue();
    component.closeDeleteModal();
    expect(component.isDeleteOpen).toBeFalse();
  });
});
