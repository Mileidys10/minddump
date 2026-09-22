import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { EventoModalComponent } from './evento-modal.component';
import { Evento, Espacio } from '../../models';

describe('EventoModalComponent (T-06.3)', () => {
  let component: EventoModalComponent;
  let fixture: ComponentFixture<EventoModalComponent>;

  const mockEspacios: Espacio[] = [
    { id: 1, nombre: 'Trabajo', color: '#3b82f6', esSistema: false, fechaCreacion: '' },
    { id: 2, nombre: 'Útiles', color: '#10b981', esSistema: true, fechaCreacion: '' }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventoModalComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(EventoModalComponent);
    component = fixture.componentInstance;
    component.espacios = mockEspacios;
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe validar que el título no esté vacío ni sean solo espacios', () => {
    component.visible = true;
    component.ngOnChanges({
      visible: new SimpleChange(false, true, true)
    });
    fixture.detectChanges();

    component.form.patchValue({
      titulo: '   ',
      fechaInicio: '2026-10-01T10:00',
      fechaFin: '2026-10-01T11:00'
    });

    expect(component.isTituloValido()).toBeFalse();
  });

  it('debe invalidar el formulario si fechaFin es anterior a fechaInicio (T-06.3)', () => {
    component.visible = true;
    component.ngOnChanges({
      visible: new SimpleChange(false, true, true)
    });
    fixture.detectChanges();

    component.form.patchValue({
      titulo: 'Evento Test',
      fechaInicio: '2026-10-01T15:00',
      fechaFin: '2026-10-01T14:00'
    });
    component.form.markAllAsTouched();
    fixture.detectChanges();

    expect(component.form.errors?.['fechaFinAnterior']).toBeTrue();
    expect(component.form.invalid).toBeTrue();
  });

  it('debe ser válido si fechaFin es igual o posterior a fechaInicio', () => {
    component.visible = true;
    component.ngOnChanges({
      visible: new SimpleChange(false, true, true)
    });
    fixture.detectChanges();

    component.form.patchValue({
      titulo: 'Evento Válido',
      fechaInicio: '2026-10-01T10:00',
      fechaFin: '2026-10-01T11:00',
      espacioId: 1
    });

    expect(component.form.valid).toBeTrue();
  });

  it('debe pre-rellenar datos al editar un evento existente', () => {
    const eventoExistente: Evento = {
      id: 99,
      titulo: 'Reunión Existente',
      descripcion: 'Notas importantes',
      categoria: 'Reuniones',
      fechaInicio: '2026-10-01T10:00:00.000Z',
      fechaFin: '2026-10-01T11:30:00.000Z',
      espacioId: 1,
      fechaCreacion: '2026-09-20T00:00:00.000Z'
    };

    component.visible = true;
    component.evento = eventoExistente;
    component.ngOnChanges({
      visible: new SimpleChange(false, true, true),
      evento: new SimpleChange(null, eventoExistente, true)
    });
    fixture.detectChanges();

    expect(component.isEditing).toBeTrue();
    expect(component.form.get('titulo')?.value).toBe('Reunión Existente');
    expect(component.form.get('descripcion')?.value).toBe('Notas importantes');
    expect(component.form.get('categoria')?.value).toBe('Reuniones');
    expect(component.form.get('espacioId')?.value).toBe(1);
    expect(component.form.get('fechaInicio')?.value).toBeTruthy();
    expect(component.form.get('fechaFin')?.value).toBeTruthy();
  });

  it('debe emitir guardar con fechas convertidas a ISO string al enviar formulario válido', () => {
    spyOn(component.guardar, 'emit');

    component.visible = true;
    component.ngOnChanges({
      visible: new SimpleChange(false, true, true)
    });
    fixture.detectChanges();

    component.form.patchValue({
      titulo: '  Nueva Cita  ',
      descripcion: '  Llevar documentos  ',
      categoria: 'Salud',
      fechaInicio: '2026-10-05T09:00',
      fechaFin: '2026-10-05T10:00',
      espacioId: null
    });

    component.onGuardar();

    expect(component.guardar.emit).toHaveBeenCalledWith(
      jasmine.objectContaining({
        titulo: 'Nueva Cita',
        descripcion: 'Llevar documentos',
        categoria: 'Salud',
        espacioId: null
      })
    );
  });

  it('debe emitir cancelar al pulsar cancelar', () => {
    spyOn(component.cancelar, 'emit');
    component.onCancelar();
    expect(component.cancelar.emit).toHaveBeenCalled();
  });
});
