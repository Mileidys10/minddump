import { TestBed, ComponentFixture } from '@angular/core/testing';
import { EspacioDeleteModalComponent } from './espacio-delete-modal.component';

describe('EspacioDeleteModalComponent (T-02.4 Confirmación de Eliminación)', () => {
  let fixture: ComponentFixture<EspacioDeleteModalComponent>;
  let component: EspacioDeleteModalComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EspacioDeleteModalComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(EspacioDeleteModalComponent);
    component = fixture.componentInstance;
    component.espacio = {
      id: 10,
      nombre: 'Área 51',
      color: '#f43f5e',
      esSistema: false,
      fechaCreacion: '2026-09-01T00:00:00Z'
    };
    fixture.detectChanges();
  });

  it('debe mostrar el nombre del espacio a eliminar y la advertencia de huérfanos', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Área 51');
    expect(compiled.textContent).toContain('NO se eliminarán');
    expect(compiled.textContent).toContain('espacioId: null');
  });

  it('debe emitir confirmed al pulsar el botón de confirmación', (done) => {
    component.confirmed.subscribe(() => {
      expect(true).toBeTrue();
      done();
    });

    const compiled = fixture.nativeElement as HTMLElement;
    const confirmBtn = compiled.querySelector('#btn-confirm-delete') as HTMLButtonElement;
    confirmBtn.click();
  });

  it('debe emitir cancelled al pulsar el botón de cancelar', (done) => {
    component.cancelled.subscribe(() => {
      expect(true).toBeTrue();
      done();
    });

    const compiled = fixture.nativeElement as HTMLElement;
    const cancelBtn = compiled.querySelector('#btn-cancel-delete') as HTMLButtonElement;
    cancelBtn.click();
  });
});
