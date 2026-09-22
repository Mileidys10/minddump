import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TareaModalComponent } from './tarea-modal.component';
import { SimpleChange } from '@angular/core';
import { Tarea, Espacio } from '../../models';

describe('TareaModalComponent', () => {
  let component: TareaModalComponent;
  let fixture: ComponentFixture<TareaModalComponent>;

  const mockEspacios: Espacio[] = [
    { id: 1, nombre: 'Útiles', color: '#6366f1', esSistema: true, fechaCreacion: '2026-01-01' },
    { id: 2, nombre: 'Trabajo', color: '#10b981', esSistema: false, fechaCreacion: '2026-01-02' }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TareaModalComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TareaModalComponent);
    component = fixture.componentInstance;
    component.espacios = mockEspacios;
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe tener los valores por defecto requeridos al crear (Pendiente, Normal)', () => {
    component.visible = true;
    component.espacioActivoId = 1;
    component.tarea = null;
    component.ngOnChanges({
      visible: new SimpleChange(false, true, true)
    });
    fixture.detectChanges();

    expect(component.form.get('estado')?.value).toBe('Pendiente');
    expect(component.form.get('prioridad')?.value).toBe('Normal');
    expect(component.form.get('espacioId')?.value).toBe(1);
    expect(component.form.get('titulo')?.value).toBe('');
  });

  it('debe invalidar el formulario si el título está vacío o contiene solo espacios', () => {
    component.visible = true;
    component.ngOnChanges({ visible: new SimpleChange(false, true, true) });
    fixture.detectChanges();

    component.form.patchValue({ titulo: '' });
    expect(component.isTituloValido()).toBeFalse();

    component.form.patchValue({ titulo: '    ' });
    expect(component.isTituloValido()).toBeFalse();

    component.form.patchValue({ titulo: 'Revisar PR' });
    expect(component.isTituloValido()).toBeTrue();
  });

  it('debe pre-rellenar los datos en modo edición', () => {
    const tareaExistente: Tarea = {
      id: 42,
      titulo: 'Auditoría de seguridad',
      descripcion: 'Revisar certificados TLS y tokens',
      prioridad: 'Urgente',
      estado: 'En progreso',
      fechaLimite: '2026-10-15T18:00:00.000Z',
      categoria: 'Seguridad',
      espacioId: 2,
      fechaCreacion: '2026-09-01T10:00:00.000Z',
      fechaActualizacion: '2026-09-02T11:00:00.000Z'
    };

    component.visible = true;
    component.tarea = tareaExistente;
    component.ngOnChanges({
      visible: new SimpleChange(false, true, true),
      tarea: new SimpleChange(null, tareaExistente, true)
    });
    fixture.detectChanges();

    expect(component.isEditing).toBeTrue();
    expect(component.form.get('titulo')?.value).toBe('Auditoría de seguridad');
    expect(component.form.get('prioridad')?.value).toBe('Urgente');
    expect(component.form.get('estado')?.value).toBe('En progreso');
    expect(component.form.get('categoria')?.value).toBe('Seguridad');
    expect(component.form.get('espacioId')?.value).toBe(2);
  });

  it('debe emitir guardar con el payload formateado al confirmar', () => {
    component.visible = true;
    component.ngOnChanges({ visible: new SimpleChange(false, true, true) });
    fixture.detectChanges();

    spyOn(component.guardar, 'emit');

    component.form.patchValue({
      titulo: '  Preparar demo Sprint 4  ',
      descripcion: '  Detalles de la demo  ',
      prioridad: 'Urgente',
      estado: 'Pendiente',
      fechaLimite: '2026-10-10T15:30',
      categoria: '  Demos  ',
      espacioId: null
    });

    component.onGuardar();

    expect(component.guardar.emit).toHaveBeenCalledWith(jasmine.objectContaining({
      titulo: 'Preparar demo Sprint 4',
      descripcion: 'Detalles de la demo',
      prioridad: 'Urgente',
      estado: 'Pendiente',
      categoria: 'Demos',
      espacioId: null
    }));
  });

  it('debe emitir cancelar al cerrar', () => {
    spyOn(component.cancelar, 'emit');
    component.onCancelar();
    expect(component.cancelar.emit).toHaveBeenCalled();
  });
});
