import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InboxComponent } from './inbox.component';
import { InboxService } from '../../services/inbox.service';
import { NotaService } from '../../services/nota.service';
import { TareaService } from '../../services/tarea.service';
import { EspacioService } from '../../services/espacio.service';
import { DatabaseService } from '../../repositories/database.service';

describe('InboxComponent (P-02, T-03.3, T-03.4, T-03.5)', () => {
  let component: InboxComponent;
  let fixture: ComponentFixture<InboxComponent>;
  let inboxService: InboxService;
  let notaService: NotaService;
  let tareaService: TareaService;
  let espacioService: EspacioService;
  let dbService: DatabaseService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InboxComponent],
      providers: [InboxService, NotaService, TareaService, EspacioService, DatabaseService]
    }).compileComponents();

    dbService = TestBed.inject(DatabaseService);
    inboxService = TestBed.inject(InboxService);
    notaService = TestBed.inject(NotaService);
    tareaService = TestBed.inject(TareaService);
    espacioService = TestBed.inject(EspacioService);

    await dbService.inbox.clear();
    await dbService.notas.clear();
    await dbService.tareas.clear();
    await dbService.espacios.clear();

    await espacioService.create({
      nombre: 'Personal',
      color: '#6366f1',
      descripcion: 'Cosas personales',
      esSistema: false,
      fechaCreacion: '2026-01-01'
    });

    fixture = TestBed.createComponent(InboxComponent);
    component = fixture.componentInstance;
  });

  afterEach(async () => {
    await dbService.inbox.clear();
    await dbService.notas.clear();
    await dbService.tareas.clear();
    await dbService.espacios.clear();
  });

  it('debe crearse correctamente e inicializar el listado', async () => {
    await component.ngOnInit();
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(inboxService.totalPendientes()).toBe(0);
  });

  it('debe listar solo capturas pendientes (organizado: false) y omitir organizadas', async () => {
    await inboxService.create({ titulo: 'Idea pendiente 1', descripcion: 'Detalle 1' });
    await inboxService.create({ titulo: 'Idea pendiente 2' });

    // Crear captura ya organizada directamente
    await dbService.inbox.add({
      titulo: 'Idea ya organizada',
      fechaCreacion: new Date().toISOString(),
      organizado: true
    });

    await component.ngOnInit();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Idea pendiente 1');
    expect(compiled.textContent).toContain('Idea pendiente 2');
    expect(compiled.textContent).not.toContain('Idea ya organizada');
    expect(inboxService.totalPendientes()).toBe(2);
  });

  it('debe mostrar estado vacío cuando no hay capturas pendientes', async () => {
    await component.ngOnInit();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('#inbox-empty-state')).toBeTruthy();
    expect(compiled.textContent).toContain('Inbox limpio y al día');
  });

  it('debe abrir y cerrar modales de captura, edición, eliminación y conversión', async () => {
    await component.ngOnInit();
    fixture.detectChanges();

    component.openCreateModal();
    expect(component.isModalOpen).toBeTrue();
    component.closeModal();
    expect(component.isModalOpen).toBeFalse();

    const dummyItem = { id: 1, titulo: 'Test', fechaCreacion: '2026-01-01', organizado: false };

    component.openEditModal(dummyItem);
    expect(component.isModalOpen).toBeTrue();
    expect(component.selectedItem).toEqual(dummyItem);
    component.closeModal();

    component.openConvertModal(dummyItem);
    expect(component.isConvertOpen).toBeTrue();
    component.closeConvertModal();

    component.openDeleteModal(dummyItem);
    expect(component.isDeleteOpen).toBeTrue();
    component.closeDeleteModal();
  });

  it('debe eliminar una captura tras confirmación (T-03.4)', async () => {
    const item = await inboxService.create({ titulo: 'Captura a eliminar' });
    await component.ngOnInit();
    fixture.detectChanges();

    expect(inboxService.pendientes().length).toBe(1);

    await component.onConfirmarEliminar(item.id!);
    fixture.detectChanges();

    expect(inboxService.pendientes().length).toBe(0);
  });

  it('debe convertir una captura en Nota, marcarla organizada y retirarla del Inbox (T-03.5)', async () => {
    const item = await inboxService.create({
      titulo: 'Arquitectura de agentes',
      descripcion: 'Explorar patrones reactivos'
    });

    await component.ngOnInit();
    fixture.detectChanges();
    expect(inboxService.pendientes().length).toBe(1);

    await component.onConfirmarConvertirNota({
      itemId: item.id!,
      nota: {
        titulo: 'Arquitectura de agentes',
        contenido: 'Explorar patrones reactivos',
        categoria: 'Arquitectura',
        espacioId: 1
      }
    });

    fixture.detectChanges();

    // 1. Debe haber desaparecido del Inbox
    expect(inboxService.pendientes().length).toBe(0);

    // 2. En la base de datos debe seguir existiendo pero marcado como organizado: true
    const itemDb = await inboxService.getById(item.id!);
    expect(itemDb).toBeDefined();
    expect(itemDb?.organizado).toBeTrue();

    // 3. Debe haberse creado la Nota correspondiente
    const notas = await notaService.getAll();
    expect(notas.length).toBe(1);
    expect(notas[0].titulo).toBe('Arquitectura de agentes');
    expect(notas[0].contenido).toBe('Explorar patrones reactivos');
  });

  it('debe convertir una captura en Tarea, marcarla organizada y retirarla del Inbox (T-03.5)', async () => {
    const item = await inboxService.create({
      titulo: 'Comprar regalo de cumpleaños',
      descripcion: 'Buscar en tienda online'
    });

    await component.ngOnInit();
    fixture.detectChanges();
    expect(inboxService.pendientes().length).toBe(1);

    await component.onConfirmarConvertirTarea({
      itemId: item.id!,
      tarea: {
        titulo: 'Comprar regalo de cumpleaños',
        descripcion: 'Buscar en tienda online',
        prioridad: 'Urgente',
        estado: 'Pendiente',
        categoria: 'Personal',
        espacioId: 1
      }
    });

    fixture.detectChanges();

    // 1. Debe haber desaparecido del Inbox
    expect(inboxService.pendientes().length).toBe(0);

    // 2. Debe ser organizado: true
    const itemDb = await inboxService.getById(item.id!);
    expect(itemDb?.organizado).toBeTrue();

    // 3. Debe haberse creado la Tarea en el sistema
    const tareas = await tareaService.getAll();
    expect(tareas.length).toBe(1);
    expect(tareas[0].titulo).toBe('Comprar regalo de cumpleaños');
    expect(tareas[0].prioridad).toBe('Urgente');
  });
});
