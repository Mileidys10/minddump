import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Nota, Espacio } from '../../models';

@Component({
  selector: 'app-nota-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="modal-backdrop" role="dialog" aria-modal="true" [attr.aria-label]="isEditMode ? 'Editar nota' : 'Nueva nota'">
      <button type="button" class="modal-overlay-dismiss" (click)="onCancel()" aria-label="Cerrar modal"></button>
      <div class="modal-card glass" id="nota-form-modal">
        <header class="modal-header">
          <div class="header-title">
            <span class="modal-icon">📝</span>
            <h3>{{ isEditMode ? 'Editar Nota' : 'Nueva Nota' }}</h3>
          </div>
          <button type="button" class="close-btn" (click)="onCancel()" aria-label="Cerrar modal">✕</button>
        </header>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="modal-form">
          <!-- Campo Título -->
          <div class="form-group">
            <label for="nota-titulo">
              Título de la Nota <span class="required">*</span>
            </label>
            <input
              id="nota-titulo"
              type="text"
              formControlName="titulo"
              placeholder="Ej: Resumen de arquitectura, Ideas de producto..."
              class="form-input"
              [class.has-error]="form.get('titulo')?.touched && form.get('titulo')?.invalid"
            />
            @if (form.get('titulo')?.touched && form.get('titulo')?.invalid) {
              <span class="error-text">El título es obligatorio y no puede estar vacío.</span>
            }
          </div>

          <!-- Selector de Espacio -->
          <div class="form-group">
            <label for="nota-espacio">
              Espacio Asignado
            </label>
            <select id="nota-espacio" formControlName="espacioId" class="form-select">
              <option [ngValue]="null">Sin espacio (Solo accesible vía Búsqueda Global)</option>
              @for (espacio of espacios; track espacio.id) {
                <option [ngValue]="espacio.id">
                  {{ espacio.nombre }} {{ espacio.esSistema ? '(Sistema)' : '' }}
                </option>
              }
            </select>
            @if (form.get('espacioId')?.value === null) {
              <small class="hint-text">ℹ️ Los elementos sin espacio quedan sin clasificar y solo se encuentran en la Búsqueda Global (R-07).</small>
            }
          </div>

          <!-- Campo Categoría -->
          <div class="form-group">
            <label for="nota-categoria">
              Categoría <small>(opcional)</small>
            </label>
            <input
              id="nota-categoria"
              type="text"
              formControlName="categoria"
              placeholder="Ej: Arquitectura, Personal, Lecturas..."
              class="form-input"
            />
          </div>

          <!-- Campo Contenido -->
          <div class="form-group">
            <label for="nota-contenido">
              Contenido <small>(opcional)</small>
            </label>
            <textarea
              id="nota-contenido"
              formControlName="contenido"
              rows="6"
              placeholder="Escribe aquí el contenido, reflexiones o detalles de tu nota..."
              class="form-textarea"
            ></textarea>
          </div>

          <!-- Botones de Acción -->
          <footer class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="onCancel()" id="btn-cancel-nota">
              Cancelar
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              [disabled]="form.invalid"
              id="btn-save-nota"
            >
              {{ isEditMode ? 'Guardar Cambios' : 'Crear Nota' }}
            </button>
          </footer>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center;
      padding: 16px; z-index: 400; animation: fadeIn 0.2s ease;
    }
    .modal-overlay-dismiss {
      position: absolute; inset: 0; background: transparent; border: none;
      width: 100%; height: 100%; cursor: pointer; z-index: 1;
    }
    .modal-card {
      position: relative; z-index: 2;
      width: 100%; max-width: 560px; background: var(--bg-surface);
      border-radius: var(--radius-lg); border: 1px solid var(--border-color);
      box-shadow: var(--shadow-md); display: flex; flex-direction: column;
      overflow: hidden; max-height: 90vh; animation: scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .modal-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 20px 24px; border-bottom: 1px solid var(--border-color);
    }
    .header-title { display: flex; align-items: center; gap: 10px; }
    .modal-icon { font-size: 1.4rem; }
    .header-title h3 { font-size: 1.25rem; font-weight: 600; color: var(--text-primary); }
    .close-btn { font-size: 1.1rem; color: var(--text-muted); padding: 4px 8px; border-radius: var(--radius-sm); }
    .close-btn:hover { color: var(--text-primary); }
    .modal-form {
      padding: 24px; display: flex; flex-direction: column; gap: 18px;
      overflow-y: auto;
    }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group label { font-size: 0.9rem; font-weight: 500; color: var(--text-secondary); }
    .required { color: var(--accent-rose); }
    .form-input, .form-textarea, .form-select {
      width: 100%; padding: 10px 14px; border-radius: var(--radius-md);
      background: var(--bg-surface-elevated); border: 1px solid var(--border-color);
      color: var(--text-primary); font-size: 0.95rem; outline: none;
      transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
    }
    .form-input:focus, .form-textarea:focus, .form-select:focus {
      border-color: var(--border-focus); box-shadow: var(--shadow-glow);
    }
    .form-input.has-error { border-color: var(--accent-rose); }
    .error-text { font-size: 0.8rem; color: var(--accent-rose); margin-top: 2px; }
    .hint-text { font-size: 0.8rem; color: #a78bfa; margin-top: 2px; line-height: 1.3; }
    .form-textarea { resize: vertical; min-height: 100px; font-family: inherit; }
    .modal-footer {
      display: flex; justify-content: flex-end; gap: 12px;
      padding-top: 12px; border-top: 1px solid var(--border-color);
    }
    .btn {
      padding: 10px 20px; border-radius: var(--radius-md); font-size: 0.92rem;
      font-weight: 600; transition: background var(--transition-fast);
    }
    .btn-secondary {
      background: rgba(255, 255, 255, 0.05); color: var(--text-secondary);
      border: 1px solid var(--border-color);
    }
    .btn-secondary:hover { background: rgba(255, 255, 255, 0.1); color: var(--text-primary); }
    .btn-primary {
      background: var(--primary); color: white; box-shadow: 0 2px 10px var(--primary-glow);
    }
    .btn-primary:hover:not(:disabled) { background: var(--primary-hover); }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes scaleUp { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
  `]
})
export class NotaModalComponent implements OnInit, OnChanges {
  @Input() notaToEdit?: Nota | null = null;
  @Input() defaultEspacioId: number | null = null;
  @Input() espacios: Espacio[] = [];

  @Output() saved = new EventEmitter<Omit<Nota, 'id' | 'fechaCreacion' | 'fechaActualizacion'> | Partial<Nota>>();
  @Output() cancelled = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);

  form!: FormGroup;
  isEditMode = false;

  ngOnInit(): void {
    this.buildForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['notaToEdit'] || changes['defaultEspacioId']) {
      this.buildForm();
    }
  }

  private buildForm(): void {
    this.isEditMode = !!(this.notaToEdit && this.notaToEdit.id);

    const initialEspacioId = this.isEditMode
      ? (this.notaToEdit?.espacioId ?? null)
      : (this.defaultEspacioId ?? null);

    this.form = this.fb.group({
      titulo: [
        this.notaToEdit?.titulo || '',
        [Validators.required, Validators.pattern(/^(?!\s*$).+/)]
      ],
      contenido: [this.notaToEdit?.contenido || ''],
      categoria: [this.notaToEdit?.categoria || ''],
      espacioId: [initialEspacioId]
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    const raw = this.form.getRawValue();
    const payload: Partial<Nota> = {
      titulo: raw.titulo.trim(),
      contenido: (raw.contenido || '').trim(),
      categoria: raw.categoria ? raw.categoria.trim() : undefined,
      espacioId: raw.espacioId ?? null
    };

    this.saved.emit(payload);
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
