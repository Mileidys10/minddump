import { TestBed, ComponentFixture } from '@angular/core/testing';
import { EspacioModalComponent } from './espacio-modal.component';

describe('EspacioModalComponent (T-02.3 Formulario de Crear y Editar)', () => {
  let fixture: ComponentFixture<EspacioModalComponent>;
  let component: EspacioModalComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EspacioModalComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(EspacioModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe inicializar el formulario con nombre vacío y color por defecto', () => {
    expect(component.form.get('nombre')?.value).toBe('');
    expect(component.form.get('color')?.value).toBe('#6366f1');
    expect(component.form.invalid).toBeTrue();
  });

  it('debe deshabilitar el botón Guardar cuando el nombre está vacío', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const saveBtn = compiled.querySelector('#btn-save-espacio') as HTMLButtonElement;

    expect(saveBtn.disabled).toBeTrue();
  });

  it('debe habilitar el botón Guardar cuando el formulario es válido', () => {
    component.form.patchValue({ nombre: 'Nuevo Espacio' });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const saveBtn = compiled.querySelector('#btn-save-espacio') as HTMLButtonElement;

    expect(component.form.valid).toBeTrue();
    expect(saveBtn.disabled).toBeFalse();
  });

  it('debe permitir seleccionar un color de la paleta', () => {
    component.selectColor('#10b981');
    expect(component.form.get('color')?.value).toBe('#10b981');
  });

  it('debe pre-rellenar los datos en modo edición', () => {
    component.espacioToEdit = {
      id: 5,
      nombre: 'Espacio Existente',
      descripcion: 'Detalle existente',
      color: '#f59e0b',
      esSistema: false,
      fechaCreacion: '2026-09-01T10:00:00Z'
    };

    component.ngOnChanges({
      espacioToEdit: {
        currentValue: component.espacioToEdit,
        previousValue: null,
        firstChange: true,
        isFirstChange: () => true
      }
    });
    fixture.detectChanges();

    expect(component.isEditMode).toBeTrue();
    expect(component.form.get('nombre')?.value).toBe('Espacio Existente');
    expect(component.form.get('descripcion')?.value).toBe('Detalle existente');
    expect(component.form.get('color')?.value).toBe('#f59e0b');
  });

  it('debe deshabilitar el campo nombre si el espacio es del sistema', () => {
    component.espacioToEdit = {
      id: 1,
      nombre: 'Útiles',
      color: '#6366f1',
      esSistema: true,
      fechaCreacion: '2026-09-01T10:00:00Z'
    };

    component.ngOnChanges({
      espacioToEdit: {
        currentValue: component.espacioToEdit,
        previousValue: null,
        firstChange: true,
        isFirstChange: () => true
      }
    });
    fixture.detectChanges();

    expect(component.isSistemaSpace).toBeTrue();
    expect(component.form.get('nombre')?.disabled).toBeTrue();
  });

  it('debe emitir el evento saved con los datos recortados al enviar', (done) => {
    component.form.patchValue({
      nombre: '  Espacio Trimmed  ',
      descripcion: '  Descripción Trimmed  ',
      color: '#06b6d4'
    });

    component.saved.subscribe((payload) => {
      expect(payload.nombre).toBe('Espacio Trimmed');
      expect(payload.descripcion).toBe('Descripción Trimmed');
      expect(payload.color).toBe('#06b6d4');
      done();
    });

    component.onSubmit();
  });

  it('debe emitir el evento cancelled al presionar cancelar', (done) => {
    component.cancelled.subscribe(() => {
      expect(true).toBeTrue();
      done();
    });

    component.onCancel();
  });
});
