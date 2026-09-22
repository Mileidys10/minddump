import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Espacio } from '../../models';

export const PALETA_COLORES_ESPACIOS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Violeta
  '#ec4899', // Rosa
  '#f43f5e', // Carmín
  '#ef4444', // Rojo
  '#f97316', // Naranja
  '#f59e0b', // Ámbar
  '#10b981', // Esmeralda
  '#06b6d4', // Cian
  '#3b82f6', // Azul
  '#64748b'  // Pizarra
];

@Component({
  selector: 'app-espacio-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="modal-backdrop" role="dialog" aria-modal="true" [attr.aria-label]="isEditMode ? 'Editar espacio' : 'Crear espacio'">
      <button type="button" class="modal-overlay-dismiss" (click)="onCancel()" aria-label="Cerrar modal"></button>
      <div class="modal-card glass" id="espacio-form-modal">
        <header class="modal-header">
          <div class="header-title">
            <span class="color-preview" [style.background-color]="form.get('color')?.value"></span>
            <h3>{{ isEditMode ? 'Editar Espacio' : 'Nuevo Espacio' }}</h3>
          </div>
          <button type="button" class="close-btn" (click)="onCancel()" aria-label="Cerrar modal">✕</button>
        </header>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="modal-form">
          <!-- Campo Nombre -->
          <div class="form-group">
            <label for="espacio-nombre">
              Nombre del Espacio <span class="required">*</span>
            </label>
            <input
              id="espacio-nombre"
              type="text"
              formControlName="nombre"
              placeholder="Ej: Finanzas, Universidad, Salud..."
              class="form-input"
              [class.has-error]="form.get('nombre')?.touched && form.get('nombre')?.invalid"
            />
            @if (form.get('nombre')?.touched && form.get('nombre')?.invalid) {
              <span class="error-text">El nombre es obligatorio y no puede estar vacío.</span>
            }
            @if (isSistemaSpace) {
              <small class="system-note">⚠️ El nombre de los espacios del sistema no puede ser modificado.</small>
            }
          </div>

          <!-- Campo Descripción -->
          <div class="form-group">
            <label for="espacio-descripcion">Descripción <small>(opcional)</small></label>
            <textarea
              id="espacio-descripcion"
              formControlName="descripcion"
              rows="3"
              placeholder="¿Qué temas o proyectos contiene este espacio?"
              class="form-textarea"
            ></textarea>
          </div>

          <!-- Campo Selector de Color -->
          <div class="form-group">
            <span class="group-label">Color Identificador <span class="required">*</span></span>
            <div class="color-palette">
              @for (color of paletaColores; track color) {
                <button
                  type="button"
                  class="color-swatch"
                  [style.background-color]="color"
                  [class.is-selected]="form.get('color')?.value === color"
                  (click)="selectColor(color)"
                  [attr.aria-label]="'Color ' + color"
                >
                  @if (form.get('color')?.value === color) {
                    <span class="swatch-check">✓</span>
                  }
                </button>
              }
            </div>
          </div>

          <!-- Botones de Acción -->
          <footer class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="onCancel()" id="btn-cancel-espacio">
              Cancelar
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              [disabled]="form.invalid"
              id="btn-save-espacio"
            >
              {{ isEditMode ? 'Guardar Cambios' : 'Crear Espacio' }}
            </button>
          </footer>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(0, 0, 0, 0.7);
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
      width: 100%; max-width: 480px; background: var(--bg-surface);
      border-radius: var(--radius-lg); border: 1px solid var(--border-color);
      box-shadow: var(--shadow-md); display: flex; flex-direction: column;
      overflow: hidden; animation: scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .modal-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 20px 24px; border-bottom: 1px solid var(--border-color);
    }
    .header-title { display: flex; align-items: center; gap: 12px; }
    .header-title h3 { font-size: 1.2rem; font-weight: 600; color: var(--text-primary); }
    .color-preview { width: 16px; height: 16px; border-radius: 50%; display: inline-block; }
    .close-btn { font-size: 1.1rem; color: var(--text-muted); padding: 4px 8px; border-radius: var(--radius-sm); }
    .close-btn:hover { color: var(--text-primary); }
    .modal-form { padding: 24px; display: flex; flex-direction: column; gap: 18px; }
    .form-group { display: flex; flex-direction: column; gap: 8px; }
    .form-group label, .group-label { font-size: 0.9rem; font-weight: 500; color: var(--text-secondary); }
    .required { color: var(--accent-rose); }
    .form-input, .form-textarea {
      width: 100%; padding: 10px 14px; border-radius: var(--radius-md);
      background: var(--bg-surface-elevated); border: 1px solid var(--border-color);
      color: var(--text-primary); font-size: 0.95rem; outline: none;
      transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
    }
    .form-input:focus, .form-textarea:focus {
      border-color: var(--border-focus); box-shadow: var(--shadow-glow);
    }
    .form-input.has-error { border-color: var(--accent-rose); }
    .error-text { font-size: 0.8rem; color: var(--accent-rose); margin-top: 2px; }
    .system-note { font-size: 0.8rem; color: var(--accent-amber); margin-top: 2px; }
    .form-textarea { resize: vertical; min-height: 70px; }
    .color-palette { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 4px; }
    .color-swatch {
      width: 32px; height: 32px; border-radius: 50%; display: flex;
      align-items: center; justify-content: center; transition: transform var(--transition-fast);
    }
    .color-swatch:hover { transform: scale(1.15); }
    .color-swatch.is-selected { transform: scale(1.15); box-shadow: 0 0 0 3px var(--bg-surface), 0 0 0 5px var(--primary); }
    .swatch-check { color: white; font-weight: bold; font-size: 0.85rem; text-shadow: 0 1px 2px rgba(0,0,0,0.6); }
    .modal-footer {
      display: flex; justify-content: flex-end; gap: 12px;
      padding-top: 10px; border-top: 1px solid var(--border-color);
    }
    .btn {
      padding: 10px 18px; border-radius: var(--radius-md); font-size: 0.92rem;
      font-weight: 600; transition: background var(--transition-fast), opacity var(--transition-fast);
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
export class EspacioModalComponent implements OnInit, OnChanges {
  @Input() espacioToEdit?: Espacio | null = null;
  @Output() saved = new EventEmitter<Omit<Espacio, 'id'> | Partial<Espacio>>();
  @Output() cancelled = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  readonly paletaColores = PALETA_COLORES_ESPACIOS;

  form!: FormGroup;
  isEditMode = false;
  isSistemaSpace = false;

  ngOnInit(): void {
    this.buildForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['espacioToEdit']) {
      this.buildForm();
    }
  }

  private buildForm(): void {
    this.isEditMode = !!(this.espacioToEdit && this.espacioToEdit.id);
    this.isSistemaSpace = !!(this.espacioToEdit && this.espacioToEdit.esSistema);

    this.form = this.fb.group({
      nombre: [
        { value: this.espacioToEdit?.nombre || '', disabled: this.isSistemaSpace },
        [Validators.required, Validators.pattern(/^(?!\s*$).+/)]
      ],
      descripcion: [this.espacioToEdit?.descripcion || ''],
      color: [this.espacioToEdit?.color || this.paletaColores[0], Validators.required]
    });
  }

  selectColor(color: string): void {
    this.form.patchValue({ color });
    this.form.get('color')?.markAsDirty();
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    const raw = this.form.getRawValue();
    const payload: Partial<Espacio> = {
      nombre: raw.nombre.trim(),
      descripcion: (raw.descripcion || '').trim(),
      color: raw.color
    };

    this.saved.emit(payload);
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
