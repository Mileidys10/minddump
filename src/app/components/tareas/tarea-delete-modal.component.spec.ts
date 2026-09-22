import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TareaDeleteModalComponent } from './tarea-delete-modal.component';
import { Tarea } from '../../models';

describe('TareaDeleteModalComponent', () => {
  let component: TareaDeleteModalComponent;
  let fixture: ComponentFixture<TareaDeleteModalComponent>;

  const mockTarea: Tarea = {
    id: 10,
    titulo: 'Eliminar base legacy',
    prioridad: 'Urgente',
    estado: 'Pendiente',
    espacioId: 1,
    fechaCreacion: '2026-09-01T10:00:00.000Z',
    fechaActualizacion: '2026-09-01T10:00:00.000Z'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TareaDeleteModalComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TareaDeleteModalComponent);
    component = fixture.componentInstance;
    component.tarea = mockTarea;
    component.visible = true;
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe mostrar el título de la tarea y la advertencia de recordatorios', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Eliminar base legacy');
    expect(compiled.textContent).toContain('recordatorios asociados a esta tarea también se eliminarán');
  });

  it('debe emitir confirmar con el ID de la tarea al pulsar el botón de confirmación', () => {
    spyOn(component.confirmar, 'emit');
    component.onConfirmar();
    expect(component.confirmar.emit).toHaveBeenCalledWith(10);
  });

  it('debe emitir cancelar al abortar', () => {
    spyOn(component.cancelar, 'emit');
    component.onCancelar();
    expect(component.cancelar.emit).toHaveBeenCalled();
  });
});
