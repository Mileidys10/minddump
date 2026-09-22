import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InboxItem, Espacio, PrioridadTarea, Nota } from '../../models';
import { TareaCreateDto } from '../../repositories/tarea.repository';

export type DestinoConversion = 'nota' | 'tarea';

@Component({
  selector: 'app-inbox-convert-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    @if (visible && item) {
      <div class="modal-overlay" id="modal-convert-overlay">
        <button
          type="button"
          class="modal-backdrop-dismiss"
          (click)="onCancelar()"
          aria-label="Cerrar modal de conversión"
        ></button>
        <div class="modal-container glass" role="dialog" aria-modal="true" aria-labelledby="modal-convert-title">
          <header class="modal-header">
            <div class="header-icon-title">
              <span class="header-badge-icon">🔄</span>
              <div>
                <h2 id="modal-convert-title">Convertir Captura</h2>
                <p class="modal-subtitle">Organiza este pensamiento transformándolo en nota o tarea.</p>
              </div>
            </div>
            <button
              type="button"
              class="btn-close"
              (click)="onCancelar()"
              aria-label="Cerrar"
            >
              ✕
            </button>
          </header>

          <form [formGroup]="form" (ngSubmit)="onConfirmar()" class="modal-form">
            <!-- Selector de Destino: Nota vs Tarea -->
            <div class="form-group">
              <span class="section-label">¿En qué deseas convertirlo?</span>
              <div class="type-selector">
                <button
                  type="button"
                  class="type-btn"
                  [class.active]="tipoDestino === 'nota'"
                  (click)="setTipoDestino('nota')"
                  id="btn-dest-nota"
                >
                  <span class="type-icon">📝</span>
                  <div class="type-info">
                    <strong>Nota</strong>
                    <small>Conocimiento y documentación</small>
                  </div>
                </button>

                <button
                  type="button"
                  class="type-btn"
                  [class.active]="tipoDestino === 'tarea'"
                  (click)="setTipoDestino('tarea')"
                  id="btn-dest-tarea"
                >
                  <span class="type-icon">✅</span>
                  <div class="type-info">
                    <strong>Tarea</strong>
                    <small>Acción pendiente con estado y prioridad</small>
                  </div>
                </button>
              </div>
            </div>

            <!-- Título mapeado desde la captura (D-03) -->
            <div class="form-group">
              <label for="convert-titulo">
                Título <span class="required">*</span>
              </label>
              <input
                type="text"
                id="convert-titulo"
                formControlName="titulo"
                class="form-control"
                [class.invalid]="form.get('titulo')?.invalid && form.get('titulo')?.touched"
                autocomplete="off"
              />
              @if (form.get('titulo')?.invalid && form.get('titulo')?.touched) {
                <span class="error-msg">El título es obligatorio.</span>
              }
            </div>

            <!-- Descripción/Contenido mapeado desde la captura (D-03) -->
            <div class="form-group">
              <label for="convert-contenido">
                {{ tipoDestino === 'nota' ? 'Contenido de la nota' : 'Descripción de la tarea' }}
              </label>
              <textarea
                id="convert-contenido"
                formControlName="contenido"
                rows="3"
                class="form-control textarea"
                placeholder="Detalles de la nota o tarea..."
              ></textarea>
            </div>

            <!-- Espacio Asignado (opcional) -->
            <div class="form-group">
              <label for="convert-espacio">Espacio Asignado (Opcional)</label>
              <select id="convert-espacio" formControlName="espacioId" class="form-control">
                <option [ngValue]="null">🚫 Sin espacio (Sin clasificar)</option>
                @for (esp of espacios; track esp.id) {
                  <option [ngValue]="esp.id">
                    {{ esp.esSistema ? '🛡️ ' : '📁 ' }}{{ esp.nombre }}
                  </option>
                }
              </select>

              <!-- Aclaración de comportamiento (R-06 / R-07) -->
              @if (form.get('espacioId')?.value === null) {
                <div class="info-alert" id="convert-alert-sin-espacio">
                  ℹ️ <strong>Elemento sin clasificar:</strong> Al crearse sin espacio, podrás consultarlo mediante la Búsqueda Global o asignarle un espacio más adelante.
                </div>
              }
            </div>

            <!-- Campos específicos para Tarea -->
            @if (tipoDestino === 'tarea') {
              <div class="form-row">
                <div class="form-group">
                  <label for="convert-prioridad">Prioridad</label>
                  <select id="convert-prioridad" formControlName="prioridad" class="form-control">
                    <option value="Urgente">🔴 Urgente</option>
                    <option value="Normal">🟡 Normal</option>
                    <option value="Baja">🟢 Baja</option>
                  </select>
                </div>

                <div class="form-group">
                  <label for="convert-fecha-limite">Fecha Límite (Opcional)</label>
                  <input
                    type="datetime-local"
                    id="convert-fecha-limite"
                    formControlName="fechaLimite"
                    class="form-control"
                  />
                </div>
              </div>
            }

            <!-- Categoría -->
            <div class="form-group">
              <label for="convert-categoria">Categoría (Opcional)</label>
              <input
                type="text"
                id="convert-categoria"
                formControlName="categoria"
                placeholder="Ej. Personal, Estudio, Ideas..."
                class="form-control"
                autocomplete="off"
              />
            </div>

            <footer class="modal-footer">
              <button
                type="button"
                class="btn btn-secondary"
                id="btn-cancelar-conversion"
                (click)="onCancelar()"
              >
                Cancelar
              </button>
              <button
                type="submit"
                class="btn btn-primary"
                id="btn-confirmar-conversion"
                [disabled]="form.invalid || !isTituloValido()"
              >
                Convertir en {{ tipoDestino === 'nota' ? 'Nota' : 'Tarea' }}
              </button>
            </footer>
          </form>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-overlay {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(10, 15, 29, 0.75); backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center;
      z-index: 1100; padding: 16px; animation: fadeIn 0.2s ease;
    }
    .modal-backdrop-dismiss {
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      background: transparent; border: none; cursor: default;
    }
    .modal-container {
      position: relative; width: 100%; max-width: 540px; max-height: 90vh;
      overflow-y: auto; border-radius: var(--radius-lg, 16px);
      padding: 24px; display: flex; flex-direction: column; gap: 18px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4); border: 1px solid var(--border-color);
      z-index: 1101; animation: scaleUp 0.2s ease;
    }
    .modal-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      border-bottom: 1px solid var(--border-color); padding-bottom: 12px;
    }
    .header-icon-title { display: flex; align-items: center; gap: 12px; }
    .header-badge-icon {
      font-size: 1.4rem; background: rgba(99, 102, 241, 0.15); padding: 8px;
      border-radius: 10px;
    }
    .modal-header h2 { font-size: 1.3rem; font-weight: 700; color: var(--text-primary); margin: 0; }
    .modal-subtitle { font-size: 0.85rem; color: var(--text-secondary); margin: 2px 0 0; }
    .btn-close {
      background: transparent; border: none; font-size: 1.25rem; color: var(--text-secondary);
      cursor: pointer; padding: 4px 8px; border-radius: 8px; transition: all 0.2s;
    }
    .btn-close:hover { background: rgba(255, 255, 255, 0.1); color: var(--text-primary); }
    .modal-form { display: flex; flex-direction: column; gap: 14px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    @media (max-width: 480px) { .form-row { grid-template-columns: 1fr; } }
    .section-label { font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); }
    .type-selector { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .type-btn {
      display: flex; align-items: center; gap: 10px; padding: 10px 14px;
      background: rgba(15, 23, 42, 0.5); border: 1px solid var(--border-color);
      border-radius: var(--radius-md, 10px); cursor: pointer; text-align: left;
      transition: all 0.2s; color: var(--text-secondary);
    }
    .type-btn:hover { background: rgba(255, 255, 255, 0.05); border-color: rgba(99, 102, 241, 0.4); }
    .type-btn.active {
      background: rgba(99, 102, 241, 0.15); border-color: var(--primary, #6366f1);
      color: var(--text-primary); box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.25);
    }
    .type-icon { font-size: 1.3rem; }
    .type-info { display: flex; flex-direction: column; }
    .type-info strong { font-size: 0.9rem; }
    .type-info small { font-size: 0.75rem; color: var(--text-muted, #94a3b8); }
    label { font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); }
    .required { color: #f43f5e; }
    .form-control {
      width: 100%; padding: 10px 14px; border-radius: var(--radius-md, 8px);
      background: rgba(15, 23, 42, 0.6); border: 1px solid var(--border-color);
      color: var(--text-primary); font-size: 0.95rem; font-family: inherit;
      box-sizing: border-box; transition: border-color 0.2s, box-shadow 0.2s;
    }
    .form-control:focus {
      outline: none; border-color: var(--primary, #6366f1);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25);
    }
    .form-control.invalid { border-color: #f43f5e; }
    .textarea { resize: vertical; min-height: 70px; }
    .error-msg { font-size: 0.8rem; color: #f43f5e; }
    .info-alert {
      background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.25);
      border-radius: 8px; padding: 8px 12px; font-size: 0.8rem; color: #a5b4fc;
      line-height: 1.4;
    }
    .modal-footer {
      display: flex; justify-content: flex-end; gap: 12px;
      border-top: 1px solid var(--border-color); padding-top: 14px; margin-top: 6px;
    }
    .btn {
      padding: 9px 18px; border-radius: var(--radius-md, 8px); font-weight: 600;
      font-size: 0.9rem; cursor: pointer; transition: all 0.2s; border: none;
    }
    .btn-secondary {
      background: rgba(255, 255, 255, 0.08); color: var(--text-secondary);
    }
    .btn-secondary:hover { background: rgba(255, 255, 255, 0.15); color: var(--text-primary); }
    .btn-primary {
      background: var(--primary, #6366f1); color: #fff;
    }
    .btn-primary:hover:not(:disabled) {
      background: #4f46e5; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
    }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  `]
})
export class InboxConvertModalComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() visible = false;
  @Input() item: InboxItem | null = null;
  @Input() espacios: Espacio[] = [];
  @Input() espacioActivoId: number | null = null;

  @Output() convertirNota = new EventEmitter<{
    itemId: number;
    nota: Omit<Nota, 'id' | 'fechaCreacion' | 'fechaActualizacion'>;
  }>();

  @Output() convertirTarea = new EventEmitter<{
    itemId: number;
    tarea: TareaCreateDto;
  }>();

  @Output() cancelar = new EventEmitter<void>();

  tipoDestino: DestinoConversion = 'nota';

  readonly form: FormGroup = this.fb.group({
    titulo: ['', [Validators.required]],
    contenido: [''],
    espacioId: [null],
    categoria: [''],
    prioridad: ['Normal'],
    fechaLimite: ['']
  });

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['visible'] && this.visible) || (changes['item'] && this.visible)) {
      this.initForm();
    }
  }

  setTipoDestino(tipo: DestinoConversion): void {
    this.tipoDestino = tipo;
  }

  initForm(): void {
    this.tipoDestino = 'nota';
    this.form.reset({
      titulo: this.item?.titulo || '',
      contenido: this.item?.descripcion || '',
      espacioId: this.espacioActivoId ?? null,
      categoria: '',
      prioridad: 'Normal',
      fechaLimite: ''
    });
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  isTituloValido(): boolean {
    const val = this.form.get('titulo')?.value;
    return typeof val === 'string' && val.trim().length > 0;
  }

  onConfirmar(): void {
    if (!this.item || !this.item.id || this.form.invalid || !this.isTituloValido()) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.value;
    const cleanTitulo = (value.titulo || '').trim();
    const cleanContenido = (value.contenido || '').trim();
    const cleanCategoria = value.categoria && value.categoria.trim().length > 0 ? value.categoria.trim() : undefined;
    const espacioId = value.espacioId ?? null;

    if (this.tipoDestino === 'nota') {
      this.convertirNota.emit({
        itemId: this.item.id,
        nota: {
          titulo: cleanTitulo,
          contenido: cleanContenido,
          categoria: cleanCategoria,
          espacioId
        }
      });
    } else {
      let fechaIso: string | null = null;
      if (value.fechaLimite && value.fechaLimite.trim().length > 0) {
        try {
          fechaIso = new Date(value.fechaLimite).toISOString();
        } catch {
          fechaIso = null;
        }
      }

      this.convertirTarea.emit({
        itemId: this.item.id,
        tarea: {
          titulo: cleanTitulo,
          descripcion: cleanContenido,
          prioridad: (value.prioridad || 'Normal') as PrioridadTarea,
          estado: 'Pendiente',
          fechaLimite: fechaIso,
          fechaLímite: fechaIso,
          categoria: cleanCategoria,
          espacioId
        }
      });
    }
  }

  onCancelar(): void {
    this.cancelar.emit();
  }
}
