import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CapturaModalComponent } from './captura-modal.component';
import { SimpleChange } from '@angular/core';
import { InboxItem } from '../../models';

describe('CapturaModalComponent (T-03.2 & T-03.4)', () => {
  let component: CapturaModalComponent;
  let fixture: ComponentFixture<CapturaModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CapturaModalComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CapturaModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe validar que el título no esté vacío ni contenga solo espacios', () => {
    component.visible = true;
    component.ngOnChanges({ visible: new SimpleChange(false, true, true) });
    fixture.detectChanges();

    component.form.patchValue({ titulo: '' });
    expect(component.isTituloValido()).toBeFalse();

    component.form.patchValue({ titulo: '    ' });
    expect(component.isTituloValido()).toBeFalse();

    component.form.patchValue({ titulo: 'Llamar al médico' });
    expect(component.isTituloValido()).toBeTrue();
  });

  it('debe pre-rellenar los datos en modo edición', () => {
    const itemExistente: InboxItem = {
      id: 5,
      titulo: 'Idea de negocio',
      descripcion: 'Detalle de la propuesta',
      fechaCreacion: '2026-09-01T10:00:00.000Z',
      organizado: false
    };

    component.visible = true;
    component.item = itemExistente;
    component.ngOnChanges({
      visible: new SimpleChange(false, true, true),
      item: new SimpleChange(null, itemExistente, true)
    });
    fixture.detectChanges();

    expect(component.isEditing).toBeTrue();
    expect(component.form.get('titulo')?.value).toBe('Idea de negocio');
    expect(component.form.get('descripcion')?.value).toBe('Detalle de la propuesta');
  });

  it('debe emitir guardar con campos recortados al enviar formulario válido', () => {
    component.visible = true;
    component.ngOnChanges({ visible: new SimpleChange(false, true, true) });
    fixture.detectChanges();

    spyOn(component.guardar, 'emit');

    component.form.patchValue({
      titulo: '  Comprar teclado mecánico  ',
      descripcion: '  Switch red silencioso  '
    });

    component.onGuardar();

    expect(component.guardar.emit).toHaveBeenCalledWith({
      titulo: 'Comprar teclado mecánico',
      descripcion: 'Switch red silencioso'
    });
  });

  it('debe emitir cancelar al abortar', () => {
    spyOn(component.cancelar, 'emit');
    component.onCancelar();
    expect(component.cancelar.emit).toHaveBeenCalled();
  });
});
