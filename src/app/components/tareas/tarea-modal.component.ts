import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Tarea, Espacio, PrioridadTarea, EstadoTarea } from '../../models';
import { TareaCreateDto } from '../../repositories/tarea.repository';

@Component({
  selector: 'app-tarea-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    @if (visible) {
      <div class="modal-overlay" id="modal-tarea-overlay">
        <button
          type="button"
          class="modal-backdrop-dismiss"
          (click)="onCancelar()"
          aria-label="Cerrar modal"
        ></button>
        <div class="modal-container glass" role="dialog" aria-modal="true" [attr.aria-labelledby]="'modal-tarea-title'">
          <header class="modal-header">
            <h2 id="modal-tarea-title">{{ isEditing ? 'Editar Tarea' : 'Nueva Tarea' }}</h2>
            <button
              type="button"
              class="btn-close"
              (click)="onCancelar()"
              aria-label="Cerrar"
            >
              ✕
            </button>
          </header>

          <form [formGroup]="form" (ngSubmit)="onGuardar()" class="modal-form">
            <!-- Título -->
            <div class="form-group">
              <label for="tarea-titulo">Título <span class="required">*</span></label>
              <input
                type="text"
                id="tarea-titulo"
                formControlName="titulo"
                placeholder="Ej. Revisar informe de ventas..."
                class="form-control"
                [class.invalid]="form.get('titulo')?.invalid && form.get('titulo')?.touched"
                autocomplete="off"
              />
              @if (form.get('titulo')?.invalid && form.get('titulo')?.touched) {
                <span class="error-msg">El título de la tarea es obligatorio.</span>
              }
            </div>

            <!-- Fila de Estado y Prioridad -->
            <div class="form-row">
              <div class="form-group">
                <label for="tarea-prioridad">Prioridad <span class="required">*</span></label>
                <select id="tarea-prioridad" formControlName="prioridad" class="form-control">
                  <option value="Urgente">🔴 Urgente</option>
                  <option value="Normal">🟡 Normal</option>
                  <option value="Baja">🟢 Baja</option>
                </select>
              </div>

              <div class="form-group">
                <label for="tarea-estado">Estado <span class="required">*</span></label>
                <select id="tarea-estado" formControlName="estado" class="form-control">
                  <option value="Pendiente">⏳ Pendiente</option>
                  <option value="En progreso">⚡ En progreso</option>
                  <option value="Completada">✅ Completada</option>
                  <option value="Cancelada">❌ Cancelada</option>
                </select>
              </div>
            </div>

            <!-- Fila de Fecha Límite y Categoría -->
            <div class="form-row">
              <div class="form-group">
                <label for="tarea-fecha-limite">Fecha Límite (Opcional)</label>
                <input
                  type="datetime-local"
                  id="tarea-fecha-limite"
                  formControlName="fechaLimite"
                  class="form-control"
                />
              </div>

              <div class="form-group">
                <label for="tarea-categoria">Categoría (Opcional)</label>
                <input
                  type="text"
                  id="tarea-categoria"
                  formControlName="categoria"
                  placeholder="Ej. Backend, Finanzas..."
                  class="form-control"
                  autocomplete="off"
                />
              </div>
            </div>

            <!-- Espacio -->
            <div class="form-group">
              <label for="tarea-espacio">Espacio Asignado</label>
              <select id="tarea-espacio" formControlName="espacioId" class="form-control">
                <option [ngValue]="null">🚫 Sin espacio (Solo accesible en Búsqueda Global)</option>
                @for (esp of espacios; track esp.id) {
                  <option [ngValue]="esp.id">
                    {{ esp.esSistema ? '🛡️ ' : '📁 ' }}{{ esp.nombre }}
                  </option>
                }
              </select>
              <span class="help-text">
                Los elementos sin espacio solo pueden ser encontrados mediante la Búsqueda Global (R-07).
              </span>
            </div>

            <!-- Descripción -->
            <div class="form-group">
              <label for="tarea-descripcion">Descripción / Notas (Opcional)</label>
              <textarea
                id="tarea-descripcion"
                formControlName="descripcion"
                rows="4"
                placeholder="Detalles adicionales sobre lo que se debe hacer..."
                class="form-control textarea"
              ></textarea>
            </div>

            <footer class="modal-footer">
              <button
                type="button"
                class="btn btn-secondary"
                id="btn-cancelar-tarea"
                (click)="onCancelar()"
              >
                Cancelar
              </button>
              <button
                type="submit"
                class="btn btn-primary"
                id="btn-guardar-tarea"
                [disabled]="form.invalid || !isTituloValido()"
              >
                {{ isEditing ? 'Guardar Cambios' : 'Crear Tarea' }}
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
      z-index: 1000; padding: 16px; animation: fadeIn 0.2s ease;
    }
    .modal-backdrop-dismiss {
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      background: transparent; border: none; cursor: default;
    }
    .modal-container {
      position: relative; width: 100%; max-width: 560px; max-height: 90vh;
      overflow-y: auto; border-radius: var(--radius-lg, 16px);
      padding: 24px; display: flex; flex-direction: column; gap: 20px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4); border: 1px solid var(--border-color);
      z-index: 1001; animation: scaleUp 0.2s ease;
    }
    .modal-header {
      display: flex; align-items: center; justify-content: space-between;
      border-bottom: 1px solid var(--border-color); padding-bottom: 12px;
    }
    .modal-header h2 { font-size: 1.35rem; font-weight: 700; color: var(--text-primary); margin: 0; }
    .btn-close {
      background: transparent; border: none; font-size: 1.25rem; color: var(--text-secondary);
      cursor: pointer; padding: 4px 8px; border-radius: 8px; transition: all 0.2s;
    }
    .btn-close:hover { background: rgba(255, 255, 255, 0.1); color: var(--text-primary); }
    .modal-form { display: flex; flex-direction: column; gap: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    @media (max-width: 480px) { .form-row { grid-template-columns: 1fr; gap: 12px; } }
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
    .textarea { resize: vertical; min-height: 80px; }
    .error-msg { font-size: 0.8rem; color: #f43f5e; }
    .help-text { font-size: 0.75rem; color: var(--text-muted, #94a3b8); margin-top: 2px; }
    .modal-footer {
      display: flex; justify-content: flex-end; gap: 12px;
      border-top: 1px solid var(--border-color); padding-top: 16px; margin-top: 8px;
    }
    .btn {
      padding: 10px 18px; border-radius: var(--radius-md, 8px); font-weight: 600;
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
export class TareaModalComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() visible = false;
  @Input() tarea: Tarea | null = null;
  @Input() espacioActivoId: number | null = null;
  @Input() espacios: Espacio[] = [];

  @Output() guardar = new EventEmitter<TareaCreateDto | Partial<Tarea>>();
  @Output() cancelar = new EventEmitter<void>();

  readonly form: FormGroup = this.fb.group({
    titulo: ['', [Validators.required]],
    descripcion: [''],
    prioridad: ['Normal', [Validators.required]],
    estado: ['Pendiente', [Validators.required]],
    fechaLimite: [''],
    categoria: [''],
    espacioId: [null]
  });

  get isEditing(): boolean {
    return !!this.tarea && !!this.tarea.id;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.initForm();
    } else if (changes['tarea'] && this.visible) {
      this.initForm();
    }
  }

  initForm(): void {
    if (this.tarea) {
      // Formatear fecha límite a formato compatible con input datetime-local (YYYY-MM-DDTHH:mm)
      let fechaLocal = '';
      const rawFecha = this.tarea.fechaLimite ?? this.tarea.fechaLímite;
      if (rawFecha) {
        try {
          const d = new Date(rawFecha);
          if (!isNaN(d.getTime())) {
            // ISO slice up to minutes
            const offset = d.getTimezoneOffset() * 60000;
            const localIso = new Date(d.getTime() - offset).toISOString().slice(0, 16);
            fechaLocal = localIso;
          }
        } catch {
          fechaLocal = '';
        }
      }

      this.form.reset({
        titulo: this.tarea.titulo || '',
        descripcion: this.tarea.descripcion || '',
        prioridad: this.tarea.prioridad || 'Normal',
        estado: this.tarea.estado || 'Pendiente',
        fechaLimite: fechaLocal,
        categoria: this.tarea.categoria || '',
        espacioId: this.tarea.espacioId ?? null
      });
    } else {
      this.form.reset({
        titulo: '',
        descripcion: '',
        prioridad: 'Normal',
        estado: 'Pendiente',
        fechaLimite: '',
        categoria: '',
        espacioId: this.espacioActivoId ?? null
      });
    }
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  isTituloValido(): boolean {
    const val = this.form.get('titulo')?.value;
    return typeof val === 'string' && val.trim().length > 0;
  }

  onGuardar(): void {
    if (this.form.invalid || !this.isTituloValido()) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.value;
    let fechaIso: string | null = null;
    if (value.fechaLimite && value.fechaLimite.trim().length > 0) {
      try {
        fechaIso = new Date(value.fechaLimite).toISOString();
      } catch {
        fechaIso = null;
      }
    }

    const payload = {
      titulo: (value.titulo || '').trim(),
      descripcion: (value.descripcion || '').trim(),
      prioridad: (value.prioridad || 'Normal') as PrioridadTarea,
      estado: (value.estado || 'Pendiente') as EstadoTarea,
      fechaLimite: fechaIso,
      fechaLímite: fechaIso,
      categoria: value.categoria && value.categoria.trim().length > 0 ? value.categoria.trim() : undefined,
      espacioId: value.espacioId ?? null
    };

    this.guardar.emit(payload);
  }

  onCancelar(): void {
    this.cancelar.emit();
  }
}
