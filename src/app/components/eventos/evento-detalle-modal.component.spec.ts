import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventoDetalleModalComponent } from './evento-detalle-modal.component';
import { IcsService } from '../../services/ics.service';
import { Evento, Espacio } from '../../models';

describe('EventoDetalleModalComponent (T-06.5, T-07.5 & T-09.2)', () => {
  let component: EventoDetalleModalComponent;
  let fixture: ComponentFixture<EventoDetalleModalComponent>;
  let icsServiceSpy: jasmine.SpyObj<IcsService>;

  const mockEvento: Evento = {
    id: 15,
    titulo: 'Reunión de Sincronización',
    descripcion: 'Discutir arquitectura del backend\nRevisar PRs pendientes',
    categoria: 'Desarrollo',
    fechaInicio: '2026-10-01T14:00:00.000Z',
    fechaFin: '2026-10-01T15:30:00.000Z',
    espacioId: 1,
    fechaCreacion: '2026-09-20T00:00:00.000Z'
  };

  const mockEspacio: Espacio = {
    id: 1,
    nombre: 'Tecnología',
    color: '#06b6d4',
    esSistema: false,
    fechaCreacion: ''
  };

  beforeEach(async () => {
    icsServiceSpy = jasmine.createSpyObj('IcsService', ['generarIcs', 'descargarIcs']);

    await TestBed.configureTestingModule({
      imports: [EventoDetalleModalComponent],
      providers: [
        { provide: IcsService, useValue: icsServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EventoDetalleModalComponent);
    component = fixture.componentInstance;
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe mostrar título, descripción, categoría, fechas y píldora de espacio', () => {
    component.visible = true;
    component.evento = mockEvento;
    component.espacio = mockEspacio;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Reunión de Sincronización');
    expect(compiled.textContent).toContain('Discutir arquitectura del backend');
    expect(compiled.textContent).toContain('Desarrollo');
    expect(compiled.textContent).toContain('Tecnología');
    expect(compiled.querySelector('.horario-highlight')?.textContent).toBeTruthy();
  });

  it('debe mostrar "Sin clasificar" si el evento no tiene espacio asignado', () => {
    component.visible = true;
    component.evento = { ...mockEvento, espacioId: null };
    component.espacio = null;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Sin clasificar');
  });

  it('debe incluir sección de recordatorios (T-07.5)', () => {
    component.visible = true;
    component.evento = mockEvento;
    component.espacio = mockEspacio;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Recordatorios');
    expect(compiled.querySelector('app-recordatorios-seccion')).toBeTruthy();
  });

  describe('Exportación iCalendar .ics (T-09.2)', () => {
    it('debe mostrar el botón de exportación al calendario (.ics)', () => {
      component.visible = true;
      component.evento = mockEvento;
      fixture.detectChanges();

      const btn = fixture.nativeElement.querySelector('#btn-exportar-ics') as HTMLButtonElement;
      expect(btn).toBeTruthy();
      expect(btn.textContent).toContain('Exportar al calendario');
      expect(btn.disabled).toBeFalse();
    });

    it('al pulsar el botón debe invocar la descarga del archivo .ics', () => {
      component.visible = true;
      component.evento = mockEvento;
      fixture.detectChanges();

      const btn = fixture.nativeElement.querySelector('#btn-exportar-ics') as HTMLButtonElement;
      btn.click();

      expect(icsServiceSpy.descargarIcs).toHaveBeenCalledWith(mockEvento);
    });

    it('debe estar deshabilitado si el evento no tiene fechaFin', () => {
      component.visible = true;
      component.evento = { ...mockEvento, fechaFin: '' };
      fixture.detectChanges();

      const btn = fixture.nativeElement.querySelector('#btn-exportar-ics') as HTMLButtonElement;
      expect(btn.disabled).toBeTrue();
    });
  });

  it('debe emitir editar con el evento al pulsar botón de editar', () => {
    spyOn(component.editar, 'emit');

    component.visible = true;
    component.evento = mockEvento;
    fixture.detectChanges();

    component.onEditar();
    expect(component.editar.emit).toHaveBeenCalledWith(mockEvento);
  });

  it('debe emitir eliminar con el evento al pulsar botón de eliminar', () => {
    spyOn(component.eliminar, 'emit');

    component.visible = true;
    component.evento = mockEvento;
    fixture.detectChanges();

    component.onEliminar();
    expect(component.eliminar.emit).toHaveBeenCalledWith(mockEvento);
  });

  it('debe emitir cerrar al pulsar botón de cerrar', () => {
    spyOn(component.cerrar, 'emit');

    component.visible = true;
    component.evento = mockEvento;
    fixture.detectChanges();

    component.onCerrar();
    expect(component.cerrar.emit).toHaveBeenCalled();
  });
});
