import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventoDeleteModalComponent } from './evento-delete-modal.component';
import { Evento } from '../../models';

describe('EventoDeleteModalComponent (T-06.4)', () => {
  let component: EventoDeleteModalComponent;
  let fixture: ComponentFixture<EventoDeleteModalComponent>;

  const eventoMock: Evento = {
    id: 12,
    titulo: 'Reunión Presupuesto',
    descripcion: 'Revisión anual',
    fechaInicio: '2026-10-01T10:00:00Z',
    fechaFin: '2026-10-01T11:00:00Z',
    espacioId: 1,
    fechaCreacion: '2026-09-21T00:00:00Z'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventoDeleteModalComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(EventoDeleteModalComponent);
    component = fixture.componentInstance;
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe mostrar el título del evento y la advertencia de recordatorios en cascada', () => {
    component.visible = true;
    component.evento = eventoMock;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Reunión Presupuesto');
    expect(compiled.textContent).toContain('recordatorios y notificaciones');
  });

  it('debe emitir confirmar con el ID del evento al pulsar botón de confirmar', () => {
    spyOn(component.confirmar, 'emit');

    component.visible = true;
    component.evento = eventoMock;
    fixture.detectChanges();

    component.onConfirmar();
    expect(component.confirmar.emit).toHaveBeenCalledWith(12);
  });

  it('debe emitir cancelar al pulsar botón de cancelar', () => {
    spyOn(component.cancelar, 'emit');

    component.visible = true;
    component.evento = eventoMock;
    fixture.detectChanges();

    component.onCancelar();
    expect(component.cancelar.emit).toHaveBeenCalled();
  });
});
