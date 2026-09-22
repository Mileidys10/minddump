import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TareaDetalleModalComponent } from './tarea-detalle-modal.component';
import { Tarea, Espacio } from '../../models';

describe('TareaDetalleModalComponent', () => {
  let component: TareaDetalleModalComponent;
  let fixture: ComponentFixture<TareaDetalleModalComponent>;

  const mockTarea: Tarea = {
    id: 15,
    titulo: 'Configurar HTTPS y SSL',
    descripcion: 'Instalar certbot y renovar certificados Let\'s Encrypt.',
    prioridad: 'Urgente',
    estado: 'En progreso',
    fechaLimite: '2026-10-20T23:59:00.000Z',
    categoria: 'DevOps',
    espacioId: 1,
    fechaCreacion: '2026-09-01T10:00:00.000Z',
    fechaActualizacion: '2026-09-02T12:00:00.000Z'
  };

  const mockEspacio: Espacio = {
    id: 1,
    nombre: 'Infraestructura',
    color: '#3b82f6',
    esSistema: false,
    fechaCreacion: '2026-01-01'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TareaDetalleModalComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TareaDetalleModalComponent);
    component = fixture.componentInstance;
    component.tarea = mockTarea;
    component.espacio = mockEspacio;
    component.visible = true;
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe mostrar los datos completos de la tarea en modo lectura', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Configurar HTTPS y SSL');
    expect(compiled.textContent).toContain('Instalar certbot');
    expect(compiled.textContent).toContain('Urgente');
    expect(compiled.textContent).toContain('En progreso');
    expect(compiled.textContent).toContain('DevOps');
    expect(compiled.textContent).toContain('Infraestructura');
  });

  it('debe incluir sección dedicada de recordatorios (T-07.4)', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent?.toLowerCase()).toContain('recordatorios');
    expect(compiled.querySelector('app-recordatorios-seccion')).toBeTruthy();
  });

  it('debe emitir cambiarEstado al marcar completada o reabrir', () => {
    spyOn(component.cambiarEstado, 'emit');
    component.onCambiarEstado('Completada');
    expect(component.cambiarEstado.emit).toHaveBeenCalledWith({ id: 15, nuevoEstado: 'Completada' });
  });

  it('debe emitir editar con los datos de la tarea', () => {
    spyOn(component.editar, 'emit');
    component.onEditar();
    expect(component.editar.emit).toHaveBeenCalledWith(mockTarea);
  });

  it('debe emitir eliminar con la tarea seleccionada', () => {
    spyOn(component.eliminar, 'emit');
    component.onEliminar();
    expect(component.eliminar.emit).toHaveBeenCalledWith(mockTarea);
  });

  it('debe emitir cerrar al pulsar cerrar', () => {
    spyOn(component.cerrar, 'emit');
    component.onCerrar();
    expect(component.cerrar.emit).toHaveBeenCalled();
  });
});
