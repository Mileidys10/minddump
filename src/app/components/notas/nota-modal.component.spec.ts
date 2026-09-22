import { TestBed, ComponentFixture } from '@angular/core/testing';
import { NotaModalComponent } from './nota-modal.component';

describe('NotaModalComponent (T-04.3 Formulario Crear/Editar Nota)', () => {
  let fixture: ComponentFixture<NotaModalComponent>;
  let component: NotaModalComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotaModalComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(NotaModalComponent);
    component = fixture.componentInstance;
    component.espacios = [
      { id: 1, nombre: 'Útiles', color: '#6366f1', esSistema: true, fechaCreacion: '' },
      { id: 2, nombre: 'Proyectos', color: '#10b981', esSistema: false, fechaCreacion: '' }
    ];
    component.defaultEspacioId = 2;
    fixture.detectChanges();
  });

  it('debe inicializar el formulario con el espacio por defecto y título vacío', () => {
    expect(component.form.get('titulo')?.value).toBe('');
    expect(component.form.get('espacioId')?.value).toBe(2);
    expect(component.form.invalid).toBeTrue();
  });

  it('debe deshabilitar el botón Guardar si el título está vacío', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const saveBtn = compiled.querySelector('#btn-save-nota') as HTMLButtonElement;

    expect(saveBtn.disabled).toBeTrue();
  });

  it('debe habilitar el botón Guardar cuando el título es válido', () => {
    component.form.patchValue({ titulo: 'Nota válida' });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const saveBtn = compiled.querySelector('#btn-save-nota') as HTMLButtonElement;

    expect(component.form.valid).toBeTrue();
    expect(saveBtn.disabled).toBeFalse();
  });

  it('debe permitir asignar espacioId: null (Sin espacio per R-07)', () => {
    component.form.patchValue({ titulo: 'Nota suelta', espacioId: null });
    expect(component.form.valid).toBeTrue();
    expect(component.form.get('espacioId')?.value).toBeNull();
  });

  it('debe pre-rellenar datos en modo edición', () => {
    component.notaToEdit = {
      id: 10,
      titulo: 'Nota Existente',
      contenido: 'Contenido viejo',
      categoria: 'Ideas',
      espacioId: 1,
      fechaCreacion: '2026-09-01T00:00:00Z',
      fechaActualizacion: '2026-09-02T00:00:00Z'
    };

    component.ngOnChanges({
      notaToEdit: {
        currentValue: component.notaToEdit,
        previousValue: null,
        firstChange: true,
        isFirstChange: () => true
      }
    });
    fixture.detectChanges();

    expect(component.isEditMode).toBeTrue();
    expect(component.form.get('titulo')?.value).toBe('Nota Existente');
    expect(component.form.get('contenido')?.value).toBe('Contenido viejo');
    expect(component.form.get('categoria')?.value).toBe('Ideas');
    expect(component.form.get('espacioId')?.value).toBe(1);
  });

  it('debe emitir saved con datos formateados al enviar', (done) => {
    component.form.patchValue({
      titulo: '  Título con espacios  ',
      contenido: '  Contenido recortado  ',
      categoria: '  Dev  ',
      espacioId: 2
    });

    component.saved.subscribe((payload) => {
      expect(payload.titulo).toBe('Título con espacios');
      expect(payload.contenido).toBe('Contenido recortado');
      expect(payload.categoria).toBe('Dev');
      expect(payload.espacioId).toBe(2);
      done();
    });

    component.onSubmit();
  });

  it('debe emitir cancelled al cancelar', (done) => {
    component.cancelled.subscribe(() => {
      expect(true).toBeTrue();
      done();
    });

    component.onCancel();
  });
});
