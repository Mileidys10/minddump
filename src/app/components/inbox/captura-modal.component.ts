import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ElementRef,
  AfterViewInit,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InboxItem } from '../../models';

@Component({
  selector: 'app-captura-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    @if (visible) {
      <div class="modal-overlay" id="modal-captura-overlay">
        <button
          type="button"
          class="modal-backdrop-dismiss"
          (click)="onCancelar()"
          aria-label="Cerrar modal de captura"
        ></button>
        <div class="modal-container glass" role="dialog" aria-modal="true" aria-labelledby="modal-captura-title">
          <header class="modal-header">
            <div class="header-icon-title">
              <span class="header-badge-icon">📥</span>
              <h2 id="modal-captura-title">{{ isEditing ? 'Editar Captura' : 'Captura Rápida' }}</h2>
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

          <form [formGroup]="form" (ngSubmit)="onGuardar()" class="modal-form">
            <!-- Título / Idea Principal -->
            <div class="form-group">
              <label for="captura-titulo">
                ¿Qué tienes en mente? <span class="required">*</span>
              </label>
              <input
                #tituloInput
                type="text"
                id="captura-titulo"
                formControlName="titulo"
                placeholder="Ej. Comprar libros de diseño, Idea para nueva app..."
                class="form-control"
                [class.invalid]="form.get('titulo')?.invalid && form.get('titulo')?.touched"
                autocomplete="off"
              />
              @if (form.get('titulo')?.invalid && form.get('titulo')?.touched) {
                <span class="error-msg">El título de la captura es obligatorio.</span>
              }
            </div>

            <!-- Descripción Opcional -->
            <div class="form-group">
              <label for="captura-descripcion">Detalles / Notas (Opcional)</label>
              <textarea
                id="captura-descripcion"
                formControlName="descripcion"
                rows="3"
                placeholder="Agrega contexto rápido si lo necesitas..."
                class="form-control textarea"
              ></textarea>
            </div>

            <footer class="modal-footer">
              <button
                type="button"
                class="btn btn-secondary"
                id="btn-cancelar-captura"
                (click)="onCancelar()"
              >
                Cancelar
              </button>
              <button
                type="submit"
                class="btn btn-primary"
                id="btn-guardar-captura"
                [disabled]="form.invalid || !isTituloValido()"
              >
                {{ isEditing ? 'Guardar Cambios' : 'Guardar en Inbox' }}
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
      position: relative; width: 100%; max-width: 480px; border-radius: var(--radius-lg, 16px);
      padding: 24px; display: flex; flex-direction: column; gap: 18px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4); border: 1px solid var(--border-color);
      z-index: 1101; animation: scaleUp 0.2s ease;
    }
    .modal-header {
      display: flex; align-items: center; justify-content: space-between;
      border-bottom: 1px solid var(--border-color); padding-bottom: 12px;
    }
    .header-icon-title { display: flex; align-items: center; gap: 10px; }
    .header-badge-icon {
      font-size: 1.25rem; background: rgba(99, 102, 241, 0.15); padding: 6px;
      border-radius: 8px;
    }
    .modal-header h2 { font-size: 1.25rem; font-weight: 700; color: var(--text-primary); margin: 0; }
    .btn-close {
      background: transparent; border: none; font-size: 1.25rem; color: var(--text-secondary);
      cursor: pointer; padding: 4px 8px; border-radius: 8px; transition: all 0.2s;
    }
    .btn-close:hover { background: rgba(255, 255, 255, 0.1); color: var(--text-primary); }
    .modal-form { display: flex; flex-direction: column; gap: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
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
    .modal-footer {
      display: flex; justify-content: flex-end; gap: 12px;
      border-top: 1px solid var(--border-color); padding-top: 14px; margin-top: 4px;
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
export class CapturaModalComponent implements OnChanges, AfterViewInit {
  private readonly fb = inject(FormBuilder);

  @Input() visible = false;
  @Input() item: InboxItem | null = null;

  @Output() guardar = new EventEmitter<{ titulo: string; descripcion?: string }>();
  @Output() cancelar = new EventEmitter<void>();

  @ViewChild('tituloInput') tituloInput?: ElementRef<HTMLInputElement>;

  readonly form: FormGroup = this.fb.group({
    titulo: ['', [Validators.required]],
    descripcion: ['']
  });

  get isEditing(): boolean {
    return !!this.item && !!this.item.id;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['visible'] && this.visible) || (changes['item'] && this.visible)) {
      this.initForm();
      setTimeout(() => this.focusInput(), 50);
    }
  }

  ngAfterViewInit(): void {
    if (this.visible) {
      this.focusInput();
    }
  }

  private focusInput(): void {
    if (this.tituloInput && this.tituloInput.nativeElement) {
      this.tituloInput.nativeElement.focus();
    }
  }

  initForm(): void {
    if (this.item) {
      this.form.reset({
        titulo: this.item.titulo || '',
        descripcion: this.item.descripcion || ''
      });
    } else {
      this.form.reset({
        titulo: '',
        descripcion: ''
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
    this.guardar.emit({
      titulo: (value.titulo || '').trim(),
      descripcion: (value.descripcion || '').trim() || undefined
    });
  }

  onCancelar(): void {
    this.cancelar.emit();
  }
}
