import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { BusquedaComponent } from './busqueda.component';
import { BusquedaService, ResultadoBusqueda } from '../../services/busqueda.service';
import { EspacioService } from '../../services/espacio.service';
import { NotaService } from '../../services/nota.service';
import { TareaService } from '../../services/tarea.service';
import { Nota, Tarea, Espacio } from '../../models';

describe('BusquedaComponent (T-08.2 & T-08.3)', () => {
  let component: BusquedaComponent;
  let fixture: ComponentFixture<BusquedaComponent>;
  let busquedaServiceSpy: jasmine.SpyObj<BusquedaService>;
  let espacioServiceSpy: jasmine.SpyObj<EspacioService>;
  let notaServiceSpy: jasmine.SpyObj<NotaService>;
  let tareaServiceSpy: jasmine.SpyObj<TareaService>;

  const mockNota: Nota = {
    id: 1,
    titulo: 'Arquitectura de Software',
    contenido: 'Patrones de diseño hexagonal y DDD.',
    categoria: 'Ingeniería',
    espacioId: 10,
    fechaCreacion: '2026-09-01T10:00:00.000Z',
    fechaActualizacion: '2026-09-01T10:00:00.000Z'
  };

  const mockTarea: Tarea = {
    id: 101,
    titulo: 'Revisar pull request de arquitectura',
    descripcion: 'Verificar contratos de interfaz y tipos.',
    prioridad: 'Urgente',
    estado: 'Pendiente',
    categoria: 'DevOps',
    espacioId: 10,
    fechaCreacion: '2026-09-02T10:00:00.000Z',
    fechaActualizacion: '2026-09-02T10:00:00.000Z'
  };

  const mockResultados: ResultadoBusqueda[] = [
    {
      id: 1,
      tipo: 'nota',
      titulo: 'Arquitectura de Software',
      contenido: 'Patrones de diseño hexagonal y DDD.',
      categoria: 'Ingeniería',
      espacioId: 10,
      fechaCreacion: '2026-09-01T10:00:00.000Z',
      notaOriginal: mockNota
    },
    {
      id: 101,
      tipo: 'tarea',
      titulo: 'Revisar pull request de arquitectura',
      contenido: 'Verificar contratos de interfaz y tipos.',
      categoria: 'DevOps',
      espacioId: 10,
      prioridad: 'Urgente',
      estado: 'Pendiente',
      fechaCreacion: '2026-09-02T10:00:00.000Z',
      tareaOriginal: mockTarea
    }
  ];

  const mockEspacios: Espacio[] = [
    {
      id: 10,
      nombre: 'Tecnología',
      color: '#6366f1',
      esSistema: false,
      fechaCreacion: '2026-01-01'
    }
  ];

  beforeEach(async () => {
    busquedaServiceSpy = jasmine.createSpyObj('BusquedaService', [
      'buscar',
      'getCategoriasDisponibles'
    ]);
    espacioServiceSpy = jasmine.createSpyObj('EspacioService', ['loadAll'], {
      espacios: jasmine.createSpy('espacios').and.returnValue(mockEspacios)
    });
    notaServiceSpy = jasmine.createSpyObj('NotaService', ['update', 'delete']);
    tareaServiceSpy = jasmine.createSpyObj('TareaService', ['update', 'delete', 'cambiarEstado']);

    busquedaServiceSpy.buscar.and.returnValue(Promise.resolve(mockResultados));
    busquedaServiceSpy.getCategoriasDisponibles.and.returnValue(Promise.resolve(['Ingeniería', 'DevOps']));
    espacioServiceSpy.loadAll.and.returnValue(Promise.resolve(mockEspacios));

    await TestBed.configureTestingModule({
      imports: [BusquedaComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({})
          }
        },
        { provide: BusquedaService, useValue: busquedaServiceSpy },
        { provide: EspacioService, useValue: espacioServiceSpy },
        { provide: NotaService, useValue: notaServiceSpy },
        { provide: TareaService, useValue: tareaServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BusquedaComponent);
    component = fixture.componentInstance;
    await component.ngOnInit();
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  describe('Pantalla de Búsqueda y Filtros (T-08.2)', () => {
    it('debe mostrar el estado inicial cuando no hay búsqueda activa', () => {
      component.query.set('');
      component.tipoFiltro.set('all');
      component.espacioFiltro.set('all');
      component.categoriaFiltro.set('all');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('#search-empty-initial')).toBeTruthy();
      expect(compiled.textContent).toContain('Escribe para comenzar a buscar');
    });

    it('debe actualizar los resultados cuando el usuario escribe en el input', async () => {
      component.onQueryChange('arquitectura');
      await component.ejecutarBusqueda();
      fixture.detectChanges();

      expect(busquedaServiceSpy.buscar).toHaveBeenCalled();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('2 resultados encontrados');
      expect(compiled.textContent).toContain('Arquitectura de Software');
      expect(compiled.textContent).toContain('Revisar pull request');
    });

    it('cada resultado debe mostrar su tipo (nota/tarea), título, espacio y categoría', async () => {
      component.onQueryChange('arquitectura');
      await component.ejecutarBusqueda();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('📝 Nota');
      expect(compiled.textContent).toContain('✅ Tarea');
      expect(compiled.textContent).toContain('Tecnología');
      expect(compiled.textContent).toContain('Ingeniería');
      expect(compiled.textContent).toContain('DevOps');
    });

    it('debe permitir filtrar por tipo usando las pestañas (Todo / Notas / Tareas)', async () => {
      component.onQueryChange('arquitectura');
      await component.ejecutarBusqueda();
      fixture.detectChanges();

      // Solo notas
      component.setTipoFiltro('nota');
      fixture.detectChanges();
      expect(component.resultadosFiltrados().length).toBe(1);
      expect(component.resultadosFiltrados()[0].tipo).toBe('nota');

      // Solo tareas
      component.setTipoFiltro('tarea');
      fixture.detectChanges();
      expect(component.resultadosFiltrados().length).toBe(1);
      expect(component.resultadosFiltrados()[0].tipo).toBe('tarea');
    });

    it('debe mostrar estado sin resultados cuando la búsqueda no coincide', async () => {
      busquedaServiceSpy.buscar.and.returnValue(Promise.resolve([]));
      component.onQueryChange('termino-inexistente');
      await component.ejecutarBusqueda();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('#search-empty-no-results')).toBeTruthy();
      expect(compiled.textContent).toContain('Sin resultados');
      expect(compiled.textContent).toContain('termino-inexistente');
    });
  });

  describe('Navegación al Detalle desde Resultados (T-08.3)', () => {
    it('al tocar un resultado de tipo nota, abre el detalle de esa nota', async () => {
      component.onQueryChange('arquitectura');
      await component.ejecutarBusqueda();
      fixture.detectChanges();

      component.onVerDetalle(mockResultados[0]); // Tipo nota
      fixture.detectChanges();

      expect(component.notaSeleccionada).toBe(mockNota);
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('app-nota-detalle-modal')).toBeTruthy();
    });

    it('al tocar un resultado de tipo tarea, abre el detalle de esa tarea', async () => {
      component.onQueryChange('arquitectura');
      await component.ejecutarBusqueda();
      fixture.detectChanges();

      component.onVerDetalle(mockResultados[1]); // Tipo tarea
      fixture.detectChanges();

      expect(component.tareaSeleccionada).toBe(mockTarea);
      expect(component.isDetalleTareaModalOpen).toBeTrue();
    });

    it('al cerrar el modal de detalle, regresa a los resultados de búsqueda intactos', async () => {
      component.onQueryChange('arquitectura');
      await component.ejecutarBusqueda();
      component.onVerDetalle(mockResultados[0]);

      // Cerrar detalle
      component.cerrarDetalleNota();
      fixture.detectChanges();

      expect(component.notaSeleccionada).toBeNull();
      expect(component.query()).toBe('arquitectura');
      expect(component.resultadosFiltrados().length).toBe(2);
    });
  });
});
