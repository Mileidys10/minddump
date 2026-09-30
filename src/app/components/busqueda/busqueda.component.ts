import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BusquedaService, ResultadoBusqueda } from '../../services/busqueda.service';
import { EspacioService } from '../../services/espacio.service';
import { NotaService } from '../../services/nota.service';
import { TareaService } from '../../services/tarea.service';
import { Espacio, Nota, Tarea, EstadoTarea } from '../../models';
import { NotaDetalleModalComponent } from '../notas/nota-detalle-modal.component';
import { NotaModalComponent } from '../notas/nota-modal.component';
import { TareaDetalleModalComponent } from '../tareas/tarea-detalle-modal.component';
import { TareaModalComponent } from '../tareas/tarea-modal.component';
import { TareaCreateDto } from '../../repositories/tarea.repository';

@Component({
  selector: 'app-busqueda',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NotaDetalleModalComponent,
    NotaModalComponent,
    TareaDetalleModalComponent,
    TareaModalComponent
  ],
  template: `
    <div class="view-container" id="view-busqueda">
      <header class="view-header">
        <div>
          <span class="badge">Omnipresente (P-08)</span>
          <h1 class="view-title">Búsqueda Global</h1>
          <p class="view-subtitle">Encuentra notas, tareas y elementos sin clasificar en todo tu segundo cerebro.</p>
        </div>
      </header>

      <!-- Barra de Búsqueda -->
      <div class="search-box glass">
        
        <input
          type="search"
          placeholder="Buscar por título, contenido o etiqueta..."
          class="search-input"
          id="global-search-input"
          [ngModel]="query()"
          (ngModelChange)="onQueryChange($event)"
          autocomplete="off"
        />
        @if (query().length > 0) {
          <button
            type="button"
            class="btn-clear"
            id="btn-clear-search"
            (click)="limpiarQuery()"
            aria-label="Borrar búsqueda"
          >
            ✕
          </button>
        }
      </div>

      <!-- Filtros por Pestañas de Tipo (Todo / Notas / Tareas) -->
      <div class="filter-bar">
        <div class="tipo-tabs">
          <button
            type="button"
            class="tipo-tab"
            [class.active]="tipoFiltro() === 'all'"
            (click)="setTipoFiltro('all')"
          >
            Todos ({{ conteoTotal() }})
          </button>
          <button
            type="button"
            class="tipo-tab"
            [class.active]="tipoFiltro() === 'nota'"
            (click)="setTipoFiltro('nota')"
          >
            Notas ({{ conteoNotas() }})
          </button>
          <button
            type="button"
            class="tipo-tab"
            [class.active]="tipoFiltro() === 'tarea'"
            (click)="setTipoFiltro('tarea')"
          >
            Tareas ({{ conteoTareas() }})
          </button>
        </div>
      </div>

      <!-- Filtro Horizontal por Espacio -->
      <div class="filter-section">
        <span class="filter-label">Espacio:</span>
        <div class="chips-scroll">
          <button
            type="button"
            class="chip"
            [class.active]="espacioFiltro() === 'all'"
            (click)="setEspacioFiltro('all')"
          >
            Todos los espacios
          </button>
          <button
            type="button"
            class="chip"
            [class.active]="espacioFiltro() === null"
            (click)="setEspacioFiltro(null)"
          >
            Sin clasificar
          </button>
          @for (esp of espacios(); track esp.id) {
            <button
              type="button"
              class="chip"
              [class.active]="espacioFiltro() === esp.id"
              (click)="setEspacioFiltro(esp.id!)"
            >
              <span class="dot" [style.background-color]="esp.color"></span>
              {{ esp.nombre }}
            </button>
          }
        </div>
      </div>

      <!-- Filtro Horizontal por Categoría -->
      @if (categorias().length > 0) {
        <div class="filter-section">
          <span class="filter-label">Categoría:</span>
          <div class="chips-scroll">
            <button
              type="button"
              class="chip"
              [class.active]="categoriaFiltro() === 'all'"
              (click)="setCategoriaFiltro('all')"
            >
              🏷️ Todas las categorías
            </button>
            @for (cat of categorias(); track cat) {
              <button
                type="button"
                class="chip"
                [class.active]="categoriaFiltro() === cat"
                (click)="setCategoriaFiltro(cat)"
              >
                🏷️ {{ cat }}
              </button>
            }
          </div>
        </div>
      }

      <!-- Resultados o Estados Vacíos -->
      @if (hayBusquedaActiva()) {
        @if (resultadosFiltrados().length > 0) {
          <div class="results-header">
            <span class="results-count">
              {{ resultadosFiltrados().length }} {{ resultadosFiltrados().length === 1 ? 'resultado encontrado' : 'resultados encontrados' }}
            </span>
          </div>

          <div class="results-grid" id="search-results-list">
            @for (res of resultadosFiltrados(); track res.tipo + '-' + res.id) {
              <article
                class="result-card glass"
                [class.result-nota]="res.tipo === 'nota'"
                [class.result-tarea]="res.tipo === 'tarea'"
                (click)="onVerDetalle(res)"
                tabindex="0"
                role="button"
                [attr.aria-label]="'Abrir detalle de ' + res.tipo + ': ' + res.titulo"
              >
                <header class="card-header">
                  <div class="header-badges">
                    <span class="badge-tipo" [class]="res.tipo">
                      {{ res.tipo === 'nota' ? '📝 Nota' : '✅ Tarea' }}
                    </span>

                    @if (res.tipo === 'tarea' && res.prioridad) {
                      <span class="badge-prio" [class]="'prio-' + res.prioridad.toLowerCase()">
                        {{ res.prioridad }}
                      </span>
                    }

                    @if (res.tipo === 'tarea' && res.estado) {
                      <span class="badge-estado">
                        {{ res.estado }}
                      </span>
                    }

                    @if (res.categoria) {
                      <span class="badge-cat">🏷️ {{ res.categoria }}</span>
                    }
                  </div>

                  <!-- Badge de Espacio -->
                  <div class="space-badge">
                    @if (getEspacio(res.espacioId); as esp) {
                      <span class="esp-pill">
                        <span class="dot" [style.background-color]="esp.color"></span>
                        {{ esp.nombre }}
                      </span>
                    } @else {
                      <span class="esp-pill sin-clasificar">
                        Sin clasificar
                      </span>
                    }
                  </div>
                </header>

                <h3 class="card-title">{{ res.titulo }}</h3>

                @if (res.contenido) {
                  <p class="card-snippet">{{ recortarTexto(res.contenido, 180) }}</p>
                }

                <footer class="card-footer">
                  <span class="date-tag">
                    📅 {{ formatFecha(res.fechaActualizacion || res.fechaCreacion) }}
                  </span>
                  <span class="click-hint">Ver detalle →</span>
                </footer>
              </article>
            }
          </div>
        } @else {
          <!-- Estado Sin Resultados -->
          <div class="empty-state glass" id="search-empty-no-results">
            <div class="empty-icon">🔍</div>
            <h3>Sin resultados</h3>
            <p>
              No se encontraron notas ni tareas que coincidan con <strong>"{{ query() }}"</strong>
              @if (espacioFiltro() !== 'all' || categoriaFiltro() !== 'all' || tipoFiltro() !== 'all') {
                <span> y los filtros actuales</span>.
              }
            </p>
            <button
              type="button"
              class="btn-reset-filters"
              (click)="limpiarFiltros()"
            >
              Restablecer filtros
            </button>
          </div>
        }
      } @else {
        <!-- Estado Inicial (Sin Búsqueda) -->
        <div class="empty-state glass" id="search-empty-initial">
          <div class="empty-icon">💡</div>
          <h3>Escribe para comenzar a buscar</h3>
          <p>Busca en todas tus notas, tareas y capturas simultáneamente, incluyendo elementos sin espacio asignado.</p>
        </div>
      }

      <!-- Modales para Ver/Editar Detalle desde Búsqueda (T-08.3) -->
      @if (notaSeleccionada) {
        <app-nota-detalle-modal
          [nota]="notaSeleccionada"
          [espacio]="getEspacio(notaSeleccionada.espacioId)"
          (closed)="cerrarDetalleNota()"
          (edit)="abrirEditarNota()"
          (delete)="eliminarNotaDesdeBusqueda()"
        ></app-nota-detalle-modal>
      }

      @if (isEditarNotaModalOpen && notaParaEditar) {
        <app-nota-modal
          [notaToEdit]="notaParaEditar"
          [espacios]="espacios()"
          (saved)="onNotaGuardada($event)"
          (cancelled)="cerrarEditarNota()"
        ></app-nota-modal>
      }

      <app-tarea-detalle-modal
        [visible]="isDetalleTareaModalOpen"
        [tarea]="tareaSeleccionada"
        [espacio]="getEspacio(tareaSeleccionada?.espacioId)"
        (cerrar)="cerrarDetalleTarea()"
        (editar)="abrirEditarTarea($event)"
        (eliminar)="eliminarTareaDesdeBusqueda($event)"
        (cambiarEstado)="onCambiarEstadoTarea($event)"
      ></app-tarea-detalle-modal>

      <app-tarea-modal
        [visible]="isEditarTareaModalOpen"
        [tarea]="tareaParaEditar"
        [espacios]="espacios()"
        (guardar)="onTareaGuardada($event)"
        (cancelar)="cerrarEditarTarea()"
      ></app-tarea-modal>
    </div>
  `,
  styles: [`
    .view-container { display: flex; flex-direction: column; gap: 20px; animation: fadeIn 0.3s ease; }
    .badge {
      display: inline-block; font-size: 0.75rem; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.05em; padding: 4px 10px; border-radius: var(--radius-full);
      background: rgba(139, 92, 246, 0.15); color: #a78bfa; margin-bottom: 8px;
    }
    .view-title { font-size: 2rem; font-weight: 700; color: var(--text-primary); margin: 0; }
    .view-subtitle { color: var(--text-secondary); margin-top: 6px; font-size: 0.95rem; }
    .search-box {
      display: flex; align-items: center; gap: 12px; padding: 14px 18px; border-radius: var(--radius-lg);
      border: 1px solid var(--border-color); background: var(--bg-surface-elevated);
      transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
    }
    .search-box:focus-within {
      border-color: var(--primary, #6366f1); box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
    }
    .search-icon { font-size: 1.25rem; color: var(--text-muted); }
    .search-input {
      flex: 1; border: none; background: transparent; font-size: 1.05rem;
      outline: none; color: var(--text-primary);
    }
    .search-input::placeholder { color: var(--text-muted); }
    .btn-clear {
      background: transparent; border: none; font-size: 1.1rem; color: var(--text-muted);
      cursor: pointer; padding: 2px 6px; border-radius: 4px;
    }
    .btn-clear:hover { color: var(--text-primary); }
    .filter-bar { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
    .tipo-tabs {
      display: flex; gap: 6px; background: rgba(15, 23, 42, 0.4); padding: 4px; border-radius: 10px;
      border: 1px solid var(--border-color);
    }
    .tipo-tab {
      padding: 6px 14px; border-radius: 6px; font-size: 0.85rem; font-weight: 600;
      border: none; background: transparent; color: var(--text-secondary); cursor: pointer;
      transition: all 0.2s;
    }
    .tipo-tab.active {
      background: var(--primary, #6366f1); color: #fff; box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
    }
    .filter-section { display: flex; align-items: center; gap: 10px; overflow: hidden; }
    .filter-label { font-size: 0.8rem; font-weight: 600; color: var(--text-muted); white-space: nowrap; }
    .chips-scroll {
      display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: thin;
    }
    .chip {
      display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 999px;
      font-size: 0.8rem; font-weight: 500; border: 1px solid var(--border-color);
      background: rgba(255, 255, 255, 0.04); color: var(--text-secondary); cursor: pointer;
      white-space: nowrap; transition: all 0.2s;
    }
    .chip:hover { background: rgba(255, 255, 255, 0.08); color: var(--text-primary); }
    .chip.active {
      background: rgba(99, 102, 241, 0.2); border-color: rgba(99, 102, 241, 0.4);
      color: #818cf8; font-weight: 600;
    }
    .dot { width: 8px; height: 8px; border-radius: 50%; }
    .results-header { margin-top: 4px; }
    .results-count { font-size: 0.85rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
    .results-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
    .result-card {
      padding: 16px; border-radius: var(--radius-md, 12px); border: 1px solid var(--border-color);
      display: flex; flex-direction: column; gap: 10px; cursor: pointer; transition: all 0.2s;
    }
    .result-card:hover {
      transform: translateY(-2px); border-color: var(--primary, #6366f1);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    }
    .card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
    .header-badges { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
    .badge-tipo {
      font-size: 0.72rem; font-weight: 700; padding: 2px 7px; border-radius: 4px; text-transform: uppercase;
    }
    .badge-tipo.nota { background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }
    .badge-tipo.tarea { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
    .badge-prio { font-size: 0.7rem; font-weight: 600; padding: 2px 6px; border-radius: 4px; }
    .badge-prio.prio-urgente { background: rgba(244, 63, 94, 0.2); color: #fb7185; }
    .badge-prio.prio-normal { background: rgba(234, 179, 8, 0.2); color: #facc15; }
    .badge-prio.prio-baja { background: rgba(16, 185, 129, 0.2); color: #34d399; }
    .badge-estado { font-size: 0.7rem; color: var(--text-muted); padding: 2px 6px; background: rgba(255, 255, 255, 0.06); border-radius: 4px; }
    .badge-cat { font-size: 0.72rem; color: var(--text-muted); }
    .space-badge { font-size: 0.75rem; }
    .esp-pill { display: inline-flex; align-items: center; gap: 5px; color: var(--text-secondary); }
    .esp-pill.sin-clasificar { color: var(--text-muted); font-style: italic; }
    .card-title { font-size: 1.1rem; font-weight: 600; color: var(--text-primary); margin: 0; line-height: 1.3; }
    .card-snippet {
      font-size: 0.85rem; color: var(--text-secondary); margin: 0; line-height: 1.4;
      display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
    }
    .card-footer {
      display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem;
      color: var(--text-muted); padding-top: 8px; border-top: 1px solid rgba(255, 255, 255, 0.05);
      margin-top: auto;
    }
    .click-hint { color: #818cf8; font-weight: 600; opacity: 0.9; }
    .empty-state {
      padding: 60px 24px; text-align: center; border-radius: var(--radius-lg);
      display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px;
    }
    .empty-icon { font-size: 3rem; margin-bottom: 4px; }
    .empty-state h3 { font-size: 1.25rem; font-weight: 600; margin: 0; }
    .empty-state p { color: var(--text-secondary); max-width: 420px; font-size: 0.92rem; margin: 0; }
    .btn-reset-filters {
      margin-top: 8px; padding: 7px 16px; border-radius: 8px; font-size: 0.85rem; font-weight: 600;
      background: rgba(99, 102, 241, 0.15); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.3);
      cursor: pointer;
    }
    .btn-reset-filters:hover { background: rgba(99, 102, 241, 0.25); }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class BusquedaComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly busquedaService = inject(BusquedaService);
  private readonly espacioService = inject(EspacioService);
  private readonly notaService = inject(NotaService);
  private readonly tareaService = inject(TareaService);

  readonly query = signal<string>('');
  readonly tipoFiltro = signal<'all' | 'nota' | 'tarea'>('all');
  readonly espacioFiltro = signal<number | null | 'all'>('all');
  readonly categoriaFiltro = signal<string | null | 'all'>('all');

  readonly todosLosResultados = signal<ResultadoBusqueda[]>([]);
  readonly categorias = signal<string[]>([]);
  readonly espacios = this.espacioService.espacios;

  // Modales de detalle (T-08.3)
  notaSeleccionada: Nota | null = null;
  notaParaEditar: Nota | null = null;
  isEditarNotaModalOpen = false;

  tareaSeleccionada: Tarea | null = null;
  tareaParaEditar: Tarea | null = null;
  isDetalleTareaModalOpen = false;
  isEditarTareaModalOpen = false;

  readonly hayBusquedaActiva = computed(() => {
    return (
      this.query().trim().length > 0 ||
      this.tipoFiltro() !== 'all' ||
      this.espacioFiltro() !== 'all' ||
      this.categoriaFiltro() !== 'all'
    );
  });

  readonly conteoTotal = computed(() => this.todosLosResultados().length);
  readonly conteoNotas = computed(
    () => this.todosLosResultados().filter(r => r.tipo === 'nota').length
  );
  readonly conteoTareas = computed(
    () => this.todosLosResultados().filter(r => r.tipo === 'tarea').length
  );

  readonly resultadosFiltrados = computed(() => {
    const tipo = this.tipoFiltro();
    const todos = this.todosLosResultados();
    if (tipo === 'all') return todos;
    return todos.filter(r => r.tipo === tipo);
  });

  async ngOnInit(): Promise<void> {
    await this.espacioService.loadAll();
    const cats = await this.busquedaService.getCategoriasDisponibles();
    this.categorias.set(cats);

    // Leer parámetros de la URL para preservar la búsqueda al navegar hacia atrás (T-08.3)
    this.route.queryParams.subscribe(async params => {
      let huboCambio = false;

      if (params['q'] !== undefined && params['q'] !== this.query()) {
        this.query.set(params['q']);
        huboCambio = true;
      }
      if (params['tipo'] !== undefined && params['tipo'] !== this.tipoFiltro()) {
        this.tipoFiltro.set(params['tipo'] as 'all' | 'nota' | 'tarea');
        huboCambio = true;
      }
      if (params['espacioId'] !== undefined) {
        const espParam = params['espacioId'];
        const nuevoEsp = espParam === 'null' ? null : espParam === 'all' ? 'all' : Number(espParam);
        if (nuevoEsp !== this.espacioFiltro()) {
          this.espacioFiltro.set(nuevoEsp);
          huboCambio = true;
        }
      }
      if (params['categoria'] !== undefined && params['categoria'] !== this.categoriaFiltro()) {
        this.categoriaFiltro.set(params['categoria']);
        huboCambio = true;
      }

      if (huboCambio || this.hayBusquedaActiva()) {
        await this.ejecutarBusqueda();
      }
    });
  }

  onQueryChange(nuevoTexto: string): void {
    this.query.set(nuevoTexto);
    this.actualizarUrl();
    void this.ejecutarBusqueda();
  }

  limpiarQuery(): void {
    this.query.set('');
    this.actualizarUrl();
    void this.ejecutarBusqueda();
  }

  setTipoFiltro(tipo: 'all' | 'nota' | 'tarea'): void {
    this.tipoFiltro.set(tipo);
    this.actualizarUrl();
  }

  setEspacioFiltro(espacio: number | null | 'all'): void {
    this.espacioFiltro.set(espacio);
    this.actualizarUrl();
    void this.ejecutarBusqueda();
  }

  setCategoriaFiltro(categoria: string | null | 'all'): void {
    this.categoriaFiltro.set(categoria);
    this.actualizarUrl();
    void this.ejecutarBusqueda();
  }

  limpiarFiltros(): void {
    this.tipoFiltro.set('all');
    this.espacioFiltro.set('all');
    this.categoriaFiltro.set('all');
    this.actualizarUrl();
    void this.ejecutarBusqueda();
  }

  private actualizarUrl(): void {
    const queryParams: Record<string, string | number | null> = {};
    if (this.query()) queryParams['q'] = this.query();
    if (this.tipoFiltro() !== 'all') queryParams['tipo'] = this.tipoFiltro();
    if (this.espacioFiltro() !== 'all') {
      queryParams['espacioId'] = this.espacioFiltro() === null ? 'null' : this.espacioFiltro();
    }
    if (this.categoriaFiltro() !== 'all') queryParams['categoria'] = this.categoriaFiltro();

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      replaceUrl: true
    });
  }

  async ejecutarBusqueda(): Promise<void> {
    if (!this.hayBusquedaActiva()) {
      this.todosLosResultados.set([]);
      return;
    }

    const items = await this.busquedaService.buscar(this.query(), {
      espacioId: this.espacioFiltro(),
      categoria: this.categoriaFiltro()
    });

    this.todosLosResultados.set(items);
  }

  getEspacio(id?: number | null): Espacio | null {
    if (!id) return null;
    return this.espacios().find(e => e.id === id) || null;
  }

  recortarTexto(texto: string, maxLen: number): string {
    if (!texto) return '';
    return texto.length > maxLen ? `${texto.slice(0, maxLen)}...` : texto;
  }

  formatFecha(fechaIso?: string): string {
    if (!fechaIso) return '';
    try {
      const d = new Date(fechaIso);
      return isNaN(d.getTime()) ? '' : d.toLocaleDateString('es-ES');
    } catch {
      return '';
    }
  }

  // ==========================================
  // Navegación / Detalle de Resultados (T-08.3)
  // ==========================================

  onVerDetalle(resultado: ResultadoBusqueda): void {
    if (resultado.tipo === 'nota' && resultado.notaOriginal) {
      this.notaSeleccionada = resultado.notaOriginal;
    } else if (resultado.tipo === 'tarea' && resultado.tareaOriginal) {
      this.tareaSeleccionada = resultado.tareaOriginal;
      this.isDetalleTareaModalOpen = true;
    }
  }

  cerrarDetalleNota(): void {
    this.notaSeleccionada = null;
  }

  abrirEditarNota(nota?: Nota): void {
    const target = nota || this.notaSeleccionada;
    this.notaSeleccionada = null;
    this.notaParaEditar = target;
    this.isEditarNotaModalOpen = true;
  }

  cerrarEditarNota(): void {
    this.notaParaEditar = null;
    this.isEditarNotaModalOpen = false;
  }

  async onNotaGuardada(datos: Partial<Nota>): Promise<void> {
    if (this.notaParaEditar?.id) {
      await this.notaService.update(this.notaParaEditar.id, datos);
      this.cerrarEditarNota();
      await this.ejecutarBusqueda();
    }
  }

  async eliminarNotaDesdeBusqueda(nota?: Nota): Promise<void> {
    const target = nota || this.notaSeleccionada;
    if (target?.id) {
      await this.notaService.delete(target.id);
      this.cerrarDetalleNota();
      await this.ejecutarBusqueda();
    }
  }

  cerrarDetalleTarea(): void {
    this.isDetalleTareaModalOpen = false;
    this.tareaSeleccionada = null;
  }

  abrirEditarTarea(tarea: Tarea): void {
    this.isDetalleTareaModalOpen = false;
    this.tareaParaEditar = tarea;
    this.isEditarTareaModalOpen = true;
  }

  cerrarEditarTarea(): void {
    this.tareaParaEditar = null;
    this.isEditarTareaModalOpen = false;
  }

  async onTareaGuardada(datos: TareaCreateDto | Partial<Tarea>): Promise<void> {
    if (this.tareaParaEditar?.id) {
      await this.tareaService.update(this.tareaParaEditar.id, datos);
      this.cerrarEditarTarea();
      await this.ejecutarBusqueda();
    }
  }

  async eliminarTareaDesdeBusqueda(tarea: Tarea): Promise<void> {
    if (tarea.id) {
      await this.tareaService.delete(tarea.id);
      this.cerrarDetalleTarea();
      await this.ejecutarBusqueda();
    }
  }

  async onCambiarEstadoTarea(evento: { id: number; nuevoEstado: EstadoTarea }): Promise<void> {
    await this.tareaService.cambiarEstado(evento.id, evento.nuevoEstado);
    if (this.tareaSeleccionada && this.tareaSeleccionada.id === evento.id) {
      this.tareaSeleccionada = { ...this.tareaSeleccionada, estado: evento.nuevoEstado };
    }
    await this.ejecutarBusqueda();
  }
}
