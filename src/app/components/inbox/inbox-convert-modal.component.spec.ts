import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InboxConvertModalComponent } from './inbox-convert-modal.component';
import { SimpleChange } from '@angular/core';
import { InboxItem, Espacio } from '../../models';

describe('InboxConvertModalComponent (T-03.5)', () => {
  let component: InboxConvertModalComponent;
  let fixture: ComponentFixture<InboxConvertModalComponent>;

  const mockItem: InboxItem = {
    id: 7,
    titulo: 'Llamar al dentista para turno',
    descripcion: 'Horario preferido por la tarde',
    fechaCreacion: '2026-09-01T10:00:00.000Z',
    organizado: false
  };

  const mockEspacios: Espacio[] = [
    { id: 1, nombre: 'Salud', color: '#10b981', esSistema: false, fechaCreacion: '2026-01-01' },
    { id: 2, nombre: 'Útiles', color: '#6366f1', esSistema: true, fechaCreacion: '2026-01-01' }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InboxConvertModalComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(InboxConvertModalComponent);
    component = fixture.componentInstance;
    component.espacios = mockEspacios;
    component.item = mockItem;
    component.visible = true;
    component.ngOnChanges({
      visible: new SimpleChange(false, true, true),
      item: new SimpleChange(null, mockItem, true)
    });
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe mapear el título de la captura al título y la descripción al contenido (D-03)', () => {
    expect(component.form.get('titulo')?.value).toBe('Llamar al dentista para turno');
    expect(component.form.get('contenido')?.value).toBe('Horario preferido por la tarde');
  });

  it('debe alternar entre destino Nota y Tarea', () => {
    expect(component.tipoDestino).toBe('nota');

    component.setTipoDestino('tarea');
    fixture.detectChanges();
    expect(component.tipoDestino).toBe('tarea');

    component.setTipoDestino('nota');
    fixture.detectChanges();
    expect(component.tipoDestino).toBe('nota');
  });

  it('debe mostrar mensaje informativo al seleccionar Sin Espacio (R-06)', () => {
    component.form.patchValue({ espacioId: null });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('#convert-alert-sin-espacio')).toBeTruthy();
    expect(compiled.textContent).toContain('Elemento sin clasificar');
  });

  it('debe emitir convertirNota con los datos mapeados al confirmar destino Nota', () => {
    spyOn(component.convertirNota, 'emit');

    component.setTipoDestino('nota');
    component.form.patchValue({
      titulo: 'Llamar al dentista',
      contenido: 'Horario tarde',
      espacioId: 1,
      categoria: 'Citas'
    });

    component.onConfirmar();

    expect(component.convertirNota.emit).toHaveBeenCalledWith({
      itemId: 7,
      nota: {
        titulo: 'Llamar al dentista',
        contenido: 'Horario tarde',
        categoria: 'Citas',
        espacioId: 1
      }
    });
  });

  it('debe emitir convertirTarea con los datos mapeados al confirmar destino Tarea', () => {
    spyOn(component.convertirTarea, 'emit');

    component.setTipoDestino('tarea');
    component.form.patchValue({
      titulo: 'Turno dentista',
      contenido: 'Recordar llevar carnet',
      prioridad: 'Urgente',
      fechaLimite: '2026-10-15T16:00',
      espacioId: 1,
      categoria: 'Salud'
    });

    component.onConfirmar();

    expect(component.convertirTarea.emit).toHaveBeenCalledWith(jasmine.objectContaining({
      itemId: 7,
      tarea: jasmine.objectContaining({
        titulo: 'Turno dentista',
        descripcion: 'Recordar llevar carnet',
        prioridad: 'Urgente',
        estado: 'Pendiente',
        categoria: 'Salud',
        espacioId: 1
      })
    }));
  });

  it('debe emitir cancelar al pulsar el botón de cancelar', () => {
    spyOn(component.cancelar, 'emit');
    component.onCancelar();
    expect(component.cancelar.emit).toHaveBeenCalled();
  });
});
