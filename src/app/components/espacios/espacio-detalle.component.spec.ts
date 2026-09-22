import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { signal } from '@angular/core';
import { EspacioDetalleComponent } from './espacio-detalle.component';
import { EspacioService } from '../../services/espacio.service';
import { NotaRepository } from '../../repositories/nota.repository';
import { TareaRepository } from '../../repositories/tarea.repository';
import { EventoRepository } from '../../repositories/evento.repository';
import { Espacio, Nota, Tarea, Evento } from '../../models';

describe('EspacioDetalleComponent (P-04 / T-02.5)', () => {
  let component: EspacioDetalleComponent;
  let fixture: ComponentFixture<EspacioDetalleComponent>;

  let mockEspacioService: jasmine.SpyObj<EspacioService>;
  let mockNotaRepo: jasmine.SpyObj<NotaRepository>;
  let mockTareaRepo: jasmine.SpyObj<TareaRepository>;
  let mockEventoRepo: jasmine.SpyObj<EventoRepository>;

  const espacioMock: Espacio = {
    id: 5,
    nombre: 'Proyecto MindDump',
    color: '#6366f1',
    descripcion: 'Espacio de trabajo del segundo cerebro',
    esSistema: false,
    fechaCreacion: '2026-09-20T00:00:00Z'
  };

  const notasMock: Nota[] = [
    {
      id: 101,
      titulo: 'Nota de Arquitectura',
      contenido: 'Capas: Componentes, Servicios, Repositorios',
      espacioId: 5,
      categoria: 'Ingeniería',
      fechaCreacion: '2026-09-21T10:00:00Z',
      fechaActualizacion: '2026-09-21T10:00:00Z'
    },
    {
      id: 102,
      titulo: 'Nota Rápida',
      contenido: 'Sin clasificar categoría',
      espacioId: 5,
      fechaCreacion: '2026-09-21T11:00:00Z',
      fechaActualizacion: '2026-09-21T11:00:00Z'
    }
  ];

  const tareasMock: Tarea[] = [
    {
      id: 201,
      titulo: 'Implementar P-04',
      descripcion: 'Detalle de espacio completo',
      prioridad: 'Urgente',
      estado: 'En progreso',
      espacioId: 5,
      categoria: 'Ingeniería',
      fechaCreacion: '2026-09-21T10:00:00Z',
      fechaActualizacion: '2026-09-21T10:00:00Z'
    }
  ];

  const eventosMock: Evento[] = [
    {
      id: 301,
      titulo: 'Demo Sprint 7',
      descripcion: 'Presentación de avance',
      fechaInicio: '2026-10-01T17:00:00Z',
      fechaFin: '2026-10-01T18:00:00Z',
      espacioId: 5,
      categoria: 'Reunión',
      fechaCreacion: '2026-09-21T10:00:00Z'
    }
  ];

  beforeEach(async () => {
    mockEspacioService = jasmine.createSpyObj<EspacioService>('EspacioService', [
      'loadAll',
      'getById',
      'update'
    ], {
      espacios: signal<Espacio[]>([espacioMock])
    });

    mockNotaRepo = jasmine.createSpyObj<NotaRepository>('NotaRepository', [
      'getByEspacio',
      'create',
      'update',
      'delete'
    ]);

    mockTareaRepo = jasmine.createSpyObj<TareaRepository>('TareaRepository', [
      'getByEspacio',
      'create',
      'update',
      'delete',
      'cambiarEstado'
    ]);

    mockEventoRepo = jasmine.createSpyObj<EventoRepository>('EventoRepository', [
      'getByEspacio',
      'create',
      'update',
      'delete'
    ]);

    mockEspacioService.loadAll.and.resolveTo();
    mockEspacioService.getById.and.resolveTo(espacioMock);
    mockNotaRepo.getByEspacio.and.resolveTo([...notasMock]);
    mockTareaRepo.getByEspacio.and.resolveTo([...tareasMock]);
    mockEventoRepo.getByEspacio.and.resolveTo([...eventosMock]);

    await TestBed.configureTestingModule({
      imports: [EspacioDetalleComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ id: '5' }))
          }
        },
        { provide: EspacioService, useValue: mockEspacioService },
        { provide: NotaRepository, useValue: mockNotaRepo },
        { provide: TareaRepository, useValue: mockTareaRepo },
        { provide: EventoRepository, useValue: mockEventoRepo }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EspacioDetalleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('debe crearse correctamente e inicializar el espacio y sus elementos', () => {
    expect(component).toBeTruthy();
    expect(component.espacio()?.nombre).toBe('Proyecto MindDump');
    expect(component.notas().length).toBe(2);
    expect(component.tareas().length).toBe(1);
    expect(component.eventos().length).toBe(1);
  });

  it('debe mostrar el nombre, descripción y color del espacio en el encabezado (T-02.5)', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    const nombreEl = compiled.querySelector('#espacio-detalle-nombre');
    expect(nombreEl?.textContent).toContain('Proyecto MindDump');

    const descEl = compiled.querySelector('#espacio-detalle-desc');
    expect(descEl?.textContent).toContain('Espacio de trabajo del segundo cerebro');
  });

  it('debe listar notas, tareas y eventos asociados al espacio (T-02.5)', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Nota de Arquitectura');
    expect(compiled.textContent).toContain('Implementar P-04');
    expect(compiled.textContent).toContain('Demo Sprint 7');
  });

  it('debe permitir cambiar de pestañas para filtrar por tipo (T-02.5)', () => {
    // Pestaña notas
    component.tabActiva.set('notas');
    fixture.detectChanges();
    let compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('#section-notas')).toBeTruthy();
    expect(compiled.querySelector('#section-tareas')).toBeNull();
    expect(compiled.querySelector('#section-eventos')).toBeNull();

    // Pestaña tareas
    component.tabActiva.set('tareas');
    fixture.detectChanges();
    compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('#section-tareas')).toBeTruthy();
    expect(compiled.querySelector('#section-notas')).toBeNull();

    // Pestaña eventos
    component.tabActiva.set('eventos');
    fixture.detectChanges();
    compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('#section-eventos')).toBeTruthy();
  });

  it('debe filtrar el contenido por categoría (T-02.5)', () => {
    component.categoriaFiltro.set('Ingeniería');
    fixture.detectChanges();

    expect(component.notasFiltradas().length).toBe(1);
    expect(component.notasFiltradas()[0].titulo).toBe('Nota de Arquitectura');
    expect(component.tareasFiltradas().length).toBe(1);
    expect(component.tareasFiltradas()[0].titulo).toBe('Implementar P-04');
    expect(component.eventosFiltradas().length).toBe(0);
  });

  it('los elementos sin categoría deben aparecer correctamente (T-02.5)', () => {
    expect(component.tieneElementosSinCategoria()).toBeTrue();

    // Bajo Todas
    component.categoriaFiltro.set(null);
    expect(component.notasFiltradas().some(n => n.titulo === 'Nota Rápida')).toBeTrue();

    // Filtrando por Sin categoría
    component.categoriaFiltro.set('__sin_cat__');
    fixture.detectChanges();
    expect(component.notasFiltradas().length).toBe(1);
    expect(component.notasFiltradas()[0].titulo).toBe('Nota Rápida');
  });

  it('debe mostrar estado vacío con acciones para crear si el espacio no tiene contenido (T-02.5)', async () => {
    mockNotaRepo.getByEspacio.and.resolveTo([]);
    mockTareaRepo.getByEspacio.and.resolveTo([]);
    mockEventoRepo.getByEspacio.and.resolveTo([]);

    await component.cargarDatos(5);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('#espacio-empty-state')).toBeTruthy();
    expect(compiled.textContent).toContain('Este espacio aún no tiene contenido');
    expect(compiled.querySelector('#btn-empty-crear-nota')).toBeTruthy();
    expect(compiled.querySelector('#btn-empty-crear-tarea')).toBeTruthy();
    expect(compiled.querySelector('#btn-empty-crear-evento')).toBeTruthy();
  });

  it('debe acceder al formulario de edición del espacio desde el encabezado (T-02.5)', () => {
    expect(component.isEditEspacioModalOpen).toBeFalse();
    component.abrirModalEditarEspacio();
    expect(component.isEditEspacioModalOpen).toBeTrue();
  });
});
