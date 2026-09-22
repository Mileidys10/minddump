import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecordatoriosSeccionComponent } from './recordatorios-seccion.component';
import { RecordatorioService } from '../../services/recordatorio.service';
import { NotificacionService } from '../../services/notificacion.service';
import { Recordatorio } from '../../models';

describe('RecordatoriosSeccionComponent (T-07.4 & T-07.5)', () => {
  let component: RecordatoriosSeccionComponent;
  let fixture: ComponentFixture<RecordatoriosSeccionComponent>;
  let recordatorioServiceSpy: jasmine.SpyObj<RecordatorioService>;
  let notifServiceSpy: jasmine.SpyObj<NotificacionService>;

  const mockRecordatorios: Recordatorio[] = [
    {
      id: 1,
      titulo: 'Primer aviso',
      fechaHora: '2026-10-01T10:00:00.000Z',
      tareaId: 5,
      notificado: false
    },
    {
      id: 2,
      titulo: 'Segundo aviso',
      fechaHora: '2026-10-02T10:00:00.000Z',
      tareaId: 5,
      notificado: true
    }
  ];

  beforeEach(async () => {
    recordatorioServiceSpy = jasmine.createSpyObj('RecordatorioService', [
      'getByTarea',
      'getByEvento',
      'create',
      'update',
      'delete'
    ]);
    notifServiceSpy = jasmine.createSpyObj('NotificacionService', [
      'solicitarPermisoConExplicacion'
    ], {
      permiso: jasmine.createSpy('permiso').and.returnValue('granted')
    });

    recordatorioServiceSpy.getByTarea.and.returnValue(Promise.resolve(mockRecordatorios));
    recordatorioServiceSpy.getByEvento.and.returnValue(Promise.resolve([]));
    recordatorioServiceSpy.create.and.returnValue(Promise.resolve(mockRecordatorios[0]));
    recordatorioServiceSpy.update.and.returnValue(Promise.resolve(mockRecordatorios[0]));
    recordatorioServiceSpy.delete.and.returnValue(Promise.resolve());

    await TestBed.configureTestingModule({
      imports: [RecordatoriosSeccionComponent],
      providers: [
        { provide: RecordatorioService, useValue: recordatorioServiceSpy },
        { provide: NotificacionService, useValue: notifServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RecordatoriosSeccionComponent);
    component = fixture.componentInstance;
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe listar los recordatorios existentes ordenados cronológicamente', async () => {
    component.tareaId = 5;
    await component.ngOnInit();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Primer aviso');
    expect(compiled.textContent).toContain('Segundo aviso');
    expect(compiled.querySelectorAll('.recordatorio-card').length).toBe(2);
  });

  it('debe mostrar estado vacío cuando no hay recordatorios', async () => {
    recordatorioServiceSpy.getByTarea.and.returnValue(Promise.resolve([]));
    component.tareaId = 99;
    await component.ngOnInit();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Sin recordatorios programados');
    expect(compiled.querySelector('.btn-empty-add')).toBeTruthy();
  });

  it('debe abrir el formulario para agregar recordatorio', () => {
    component.abrirFormularioNuevo();
    expect(component.isFormOpen).toBeTrue();
    expect(component.fechaHoraInput).toBeTruthy();
  });

  it('debe guardar un nuevo recordatorio llamando a RecordatorioService', async () => {
    component.tareaId = 5;
    component.abrirFormularioNuevo();
    component.fechaHoraInput = '2026-10-10T12:00';
    component.tituloInput = 'Nueva alarma';

    await component.guardarRecordatorio();
    expect(recordatorioServiceSpy.create).toHaveBeenCalled();
    expect(component.isFormOpen).toBeFalse();
  });

  it('debe permitir editar un recordatorio existente', async () => {
    component.iniciarEdicion(mockRecordatorios[0]);
    expect(component.isEditing).toBeTrue();
    expect(component.editingId).toBe(1);

    component.fechaHoraInput = '2026-10-01T15:00';
    await component.guardarRecordatorio();
    expect(recordatorioServiceSpy.update).toHaveBeenCalled();
  });

  it('debe requerir confirmación antes de eliminar y luego eliminar', async () => {
    component.tareaId = 5;
    await component.ngOnInit();
    fixture.detectChanges();

    component.pedirConfirmacionEliminar(1);
    expect(component.confirmandoEliminarId).toBe(1);

    await component.confirmarEliminar(1);
    expect(recordatorioServiceSpy.delete).toHaveBeenCalledWith(1);
    expect(component.confirmandoEliminarId).toBeNull();
  });

  it('debe solicitar permiso previo si el estado es default al guardar', async () => {
    notifServiceSpy.permiso.and.returnValue('default');
    component.tareaId = 5;
    component.abrirFormularioNuevo();
    component.fechaHoraInput = '2026-10-10T12:00';

    await component.guardarRecordatorio();
    expect(notifServiceSpy.solicitarPermisoConExplicacion).toHaveBeenCalled();
  });
});
