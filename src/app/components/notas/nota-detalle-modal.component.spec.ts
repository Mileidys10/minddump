import { TestBed, ComponentFixture } from '@angular/core/testing';
import { NotaDetalleModalComponent } from './nota-detalle-modal.component';

describe('NotaDetalleModalComponent (T-04.5 Vista Detalle Modo Lectura)', () => {
  let fixture: ComponentFixture<NotaDetalleModalComponent>;
  let component: NotaDetalleModalComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotaDetalleModalComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(NotaDetalleModalComponent);
    component = fixture.componentInstance;
    component.nota = {
      id: 7,
      titulo: 'Estrategia PWA',
      contenido: 'El Service Worker cacheará assets en background.',
      categoria: 'Arquitectura',
      espacioId: 1,
      fechaCreacion: '2026-09-20T10:00:00Z',
      fechaActualizacion: '2026-09-21T12:00:00Z'
    };
    component.espacio = {
      id: 1,
      nombre: 'Útiles',
      color: '#6366f1',
      esSistema: true,
      fechaCreacion: ''
    };
    fixture.detectChanges();
  });

  it('debe mostrar el título, contenido, categoría y nombre del espacio', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('#detalle-nota-titulo')?.textContent).toContain('Estrategia PWA');
    expect(compiled.querySelector('#detalle-nota-contenido')?.textContent).toContain('El Service Worker cacheará assets');
    expect(compiled.textContent).toContain('Arquitectura');
    expect(compiled.textContent).toContain('Útiles');
  });

  it('debe emitir edit al presionar el botón Editar', (done) => {
    component.edit.subscribe(() => {
      expect(true).toBeTrue();
      done();
    });

    const editBtn = fixture.nativeElement.querySelector('#btn-edit-from-detalle') as HTMLButtonElement;
    editBtn.click();
  });

  it('debe emitir delete al presionar el botón Eliminar', (done) => {
    component.delete.subscribe(() => {
      expect(true).toBeTrue();
      done();
    });

    const deleteBtn = fixture.nativeElement.querySelector('#btn-delete-from-detalle') as HTMLButtonElement;
    deleteBtn.click();
  });

  it('debe emitir closed al presionar el botón Cerrar', (done) => {
    component.closed.subscribe(() => {
      expect(true).toBeTrue();
      done();
    });

    const closeBtn = fixture.nativeElement.querySelector('#btn-close-detalle') as HTMLButtonElement;
    closeBtn.click();
  });
});
