import { TestBed, ComponentFixture } from '@angular/core/testing';
import { NotaDeleteModalComponent } from './nota-delete-modal.component';

describe('NotaDeleteModalComponent (T-04.4 Confirmación de Eliminación)', () => {
  let fixture: ComponentFixture<NotaDeleteModalComponent>;
  let component: NotaDeleteModalComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotaDeleteModalComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(NotaDeleteModalComponent);
    component = fixture.componentInstance;
    component.nota = {
      id: 8,
      titulo: 'Nota a suprimir',
      espacioId: 1,
      fechaCreacion: '',
      fechaActualizacion: ''
    };
    fixture.detectChanges();
  });

  it('debe advertir sobre la eliminación mostrando el título de la nota', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Nota a suprimir');
    expect(compiled.textContent).toContain('Esta acción no se puede deshacer');
  });

  it('debe emitir confirmed al pulsar confirmar eliminación', (done) => {
    component.confirmed.subscribe(() => {
      expect(true).toBeTrue();
      done();
    });

    const confirmBtn = fixture.nativeElement.querySelector('#btn-confirm-delete-nota') as HTMLButtonElement;
    confirmBtn.click();
  });

  it('debe emitir cancelled al pulsar cancelar', (done) => {
    component.cancelled.subscribe(() => {
      expect(true).toBeTrue();
      done();
    });

    const cancelBtn = fixture.nativeElement.querySelector('#btn-cancel-delete-nota') as HTMLButtonElement;
    cancelBtn.click();
  });
});
