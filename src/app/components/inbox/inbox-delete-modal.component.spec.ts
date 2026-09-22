import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InboxDeleteModalComponent } from './inbox-delete-modal.component';
import { InboxItem } from '../../models';

describe('InboxDeleteModalComponent (T-03.4)', () => {
  let component: InboxDeleteModalComponent;
  let fixture: ComponentFixture<InboxDeleteModalComponent>;

  const mockItem: InboxItem = {
    id: 12,
    titulo: 'Idea descartada sobre criptomonedas',
    fechaCreacion: '2026-09-01T10:00:00.000Z',
    organizado: false
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InboxDeleteModalComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(InboxDeleteModalComponent);
    component = fixture.componentInstance;
    component.item = mockItem;
    component.visible = true;
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe mostrar el título de la captura en el diálogo de confirmación', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Idea descartada sobre criptomonedas');
    expect(compiled.textContent).toContain('Esta acción no se puede deshacer');
  });

  it('debe emitir confirmar con el ID de la captura', () => {
    spyOn(component.confirmar, 'emit');
    component.onConfirmar();
    expect(component.confirmar.emit).toHaveBeenCalledWith(12);
  });

  it('debe emitir cancelar al pulsar el botón de cancelar', () => {
    spyOn(component.cancelar, 'emit');
    component.onCancelar();
    expect(component.cancelar.emit).toHaveBeenCalled();
  });
});
