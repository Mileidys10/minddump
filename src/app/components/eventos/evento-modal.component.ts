import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ElementRef,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { Evento, Espacio } from '../../models';
import { EventoCreateDto } from '../../repositories/evento.repository';

function toLocalDatetimeString(date: Date): string {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function isoToLocalDatetime(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) {
      return '';
    }
    return toLocalDatetimeString(d);
  } catch {
    return '';
  }
}

function fechasCoherentesValidator(group: AbstractControl): ValidationErrors | null {
  const inicio = group.get('fechaInicio')?.value;
  const fin = group.get('fechaFin')?.value;
  if (!inicio || !fin) {
    return null;
  }
  const tInicio = new Date(inicio).getTime();
  const tFin = new Date(fin).getTime();
  if (isNaN(tInicio) || isNaN(tFin)) {
    return null;
  }
  if (tFin < tInicio) {
    return { fechaFinAnterior: true };
  }
  return null;
}

@Component({
  selector: 'app-evento-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    @if (visible) {
      <div class="modal-overlay" id="modal-evento-overlay">
        <button
          type="button"
          class="modal-backdrop-dismiss"
          (click)="onCancelar()"
          aria-label="Cerrar modal"
        ></button>
        <div
          class="modal-container glass"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-evento-title"
        >
          <header class="modal-header">
            <h2 id="modal-evento-title" class="modal-title">
              {{ isEditing ? '✏️ Editar Evento' : '📅 Nuevo Evento' }}
            </h2>
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
              <label for="evento-titulo">Título del Evento <span class="required">*</span></label>
              <input
                #tituloInput
                type="text"
                id="evento-titulo"
                formControlName="titulo"
                placeholder="Ej. Reunión de planeación, Cita médica..."
                class="form-control"
                [class.is-invalid]="form.get('titulo')?.touched && !isTituloValido()"
                autocomplete="off"
              />
              @if (form.get('titulo')?.touched && !isTituloValido()) {
                <span class="error-msg">El título es obligatorio y no puede estar vacío.</span>
              }
            </div>

            <!-- Fila de Fechas: Inicio y Fin -->
            <div class="form-row">
              <div class="form-group">
                <label for="evento-fecha-inicio">Fecha y Hora de Inicio <span class="required">*</span></label>
                <input
                  type="datetime-local"
                  id="evento-fecha-inicio"
                  formControlName="fechaInicio"
                  class="form-control"
                  [class.is-invalid]="form.get('fechaInicio')?.touched && form.get('fechaInicio')?.invalid"
                />
                @if (form.get('fechaInicio')?.touched && form.get('fechaInicio')?.invalid) {
                  <span class="error-msg">La fecha de inicio es requerida.</span>
                }
              </div>

              <div class="form-group">
                <label for="evento-fecha-fin">Fecha y Hora de Fin <span class="required">*</span></label>
                <input
                  type="datetime-local"
                  id="evento-fecha-fin"
                  formControlName="fechaFin"
                  class="form-control"
                  [class.is-invalid]="
                    (form.get('fechaFin')?.touched && form.get('fechaFin')?.invalid) ||
                    (form.touched && form.errors?.['fechaFinAnterior'])
                  "
                />
                @if (form.get('fechaFin')?.touched && form.get('fechaFin')?.invalid) {
                  <span class="error-msg">La fecha de fin es requerida.</span>
                }
              </div>
            </div>

            <!-- Error de Coherencia de Fechas (T-06.3) -->
            @if (form.touched && form.errors?.['fechaFinAnterior']) {
              <div class="alert alert-error">
                ⚠️ La fecha de fin no puede ser anterior a la fecha de inicio.
              </div>
            }

            <!-- Fila de Espacio y Categoría -->
            <div class="form-row">
              <div class="form-group">
                <label for="evento-espacio">Espacio</label>
                <select id="evento-espacio" formControlName="espacioId" class="form-control">
                  <option [ngValue]="null">🚫 Sin espacio (Sin clasificar)</option>
                  @for (esp of espacios; track esp.id) {
                    <option [ngValue]="esp.id">
                      {{ esp.esSistema ? '🛡️ ' : '📁 ' }}{{ esp.nombre }}
                    </option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label for="evento-categoria">Categoría (Opcional)</label>
                <input
                  type="text"
                  id="evento-categoria"
                  formControlName="categoria"
                  placeholder="Ej. Trabajo, Universidad, Personal..."
                  class="form-control"
                  autocomplete="off"
                />
              </div>
            </div>

            <!-- Descripción -->
            <div class="form-group">
              <label for="evento-descripcion">Descripción / Notas (Opcional)</label>
              <textarea
                id="evento-descripcion"
                formControlName="descripcion"
                rows="3"
                placeholder="Detalles, enlace a videollamada, recordatorios..."
                class="form-control"
              ></textarea>
            </div>

            <footer class="modal-footer">
              <button
                type="button"
                class="btn btn-secondary"
                id="btn-cancelar-evento"
                (click)="onCancelar()"
              >
                Cancelar
              </button>
              <button
                type="submit"
                class="btn btn-primary"
                id="btn-guardar-evento"
                [disabled]="form.invalid || !isTituloValido()"
              >
                {{ isEditing ? 'Guardar Cambios' : 'Crear Evento' }}
              </button>
            </footer>
          </form>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-overlay {
      position: fixed; inset: 0; z-index: 1050;
      display: flex; align-items: center; justify-content: center;
      padding: 16px; background: rgba(0, 0, 0, 0.65);
      backdrop-filter: blur(6px); animation: fadeIn 0.2s ease-out;
    }
    .modal-backdrop-dismiss {
      position: absolute; inset: 0; background: transparent;
      border: none; cursor: default; width: 100%; height: 100%;
    }
    .modal-container {
      position: relative; width: 100%; max-width: 540px;
      border-radius: var(--radius-lg, 16px);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
      display: flex; flex-direction: column; overflow: hidden;
      animation: scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      z-index: 1;
    }
    .modal-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 18px 22px; border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .modal-title { font-size: 1.25rem; font-weight: 700; color: var(--text-primary); margin: 0; }
    .btn-close {
      background: transparent; border: none; font-size: 1.2rem;
      color: var(--text-secondary); cursor: pointer; padding: 4px 8px;
      border-radius: 6px; transition: all 0.2s;
    }
    .btn-close:hover { background: rgba(255, 255, 255, 0.1); color: var(--text-primary); }
    .modal-form { padding: 20px 22px; display: flex; flex-direction: column; gap: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    @media (max-width: 520px) {
      .form-row { grid-template-columns: 1fr; }
    }
    label { font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); }
    .required { color: #f43f5e; }
    .form-control {
      width: 100%; padding: 10px 14px; border-radius: var(--radius-md, 8px);
      border: 1px solid rgba(255, 255, 255, 0.12); background: rgba(0, 0, 0, 0.25);
      color: var(--text-primary); font-size: 0.95rem; font-family: inherit;
      transition: all 0.2s; outline: none; box-sizing: border-box;
    }
    .form-control:focus {
      border-color: #22d3ee; box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.25);
      background: rgba(0, 0, 0, 0.35);
    }
    .form-control.is-invalid {
      border-color: #f43f5e; box-shadow: 0 0 0 2px rgba(244, 63, 94, 0.2);
    }
    textarea.form-control { resize: vertical; min-height: 75px; }
    .error-msg { font-size: 0.78rem; color: #fb7185; }
    .alert {
      padding: 10px 14px; border-radius: var(--radius-md, 8px);
      font-size: 0.85rem; display: flex; align-items: center; gap: 8px;
    }
    .alert-error {
      background: rgba(244, 63, 94, 0.15); border: 1px solid rgba(244, 63, 94, 0.3);
      color: #fda4af;
    }
    .modal-footer {
      display: flex; justify-content: flex-end; gap: 12px;
      padding-top: 10px; border-top: 1px solid rgba(255, 255, 255, 0.08); margin-top: 4px;
    }
    .btn {
      padding: 10px 18px; border-radius: var(--radius-md, 8px); font-weight: 600;
      font-size: 0.9rem; cursor: pointer; transition: all 0.2s; border: none;
    }
    .btn-secondary { background: rgba(255, 255, 255, 0.08); color: var(--text-secondary); }
    .btn-secondary:hover { background: rgba(255, 255, 255, 0.15); color: var(--text-primary); }
    .btn-primary { background: #0891b2; color: #fff; }
    .btn-primary:hover:not(:disabled) {
      background: #06b6d4; box-shadow: 0 4px 12px rgba(6, 182, 212, 0.35);
    }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  `]
})
export class EventoModalComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);

  @ViewChild('tituloInput') tituloInputRef?: ElementRef<HTMLInputElement>;

  @Input() visible = false;
  @Input() evento: Evento | null = null;
  @Input() espacios: Espacio[] = [];
  @Input() defaultEspacioId: number | null = null;

  @Output() guardar = new EventEmitter<EventoCreateDto | Partial<Evento>>();
  @Output() cancelar = new EventEmitter<void>();

  readonly form: FormGroup = this.fb.group(
    {
      titulo: ['', [Validators.required]],
      descripcion: [''],
      categoria: [''],
      fechaInicio: ['', [Validators.required]],
      fechaFin: ['', [Validators.required]],
      espacioId: [null]
    },
    { validators: fechasCoherentesValidator }
  );

  get isEditing(): boolean {
    return !!this.evento && !!this.evento.id;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.initForm();
      setTimeout(() => {
        this.tituloInputRef?.nativeElement.focus();
      }, 50);
    } else if (changes['evento'] && this.visible) {
      this.initForm();
    }
  }

  initForm(): void {
    if (this.evento) {
      this.form.reset({
        titulo: this.evento.titulo || '',
        descripcion: this.evento.descripcion || '',
        categoria: this.evento.categoria || '',
        fechaInicio: isoToLocalDatetime(this.evento.fechaInicio),
        fechaFin: isoToLocalDatetime(this.evento.fechaFin),
        espacioId: this.evento.espacioId ?? null
      });
    } else {
      // Default: hoy redondeado a la próxima hora, fin 1 hora después
      const now = new Date();
      now.setMinutes(0, 0, 0);
      now.setHours(now.getHours() + 1);
      const defInicio = toLocalDatetimeString(now);
      const defFin = toLocalDatetimeString(new Date(now.getTime() + 3600000));

      this.form.reset({
        titulo: '',
        descripcion: '',
        categoria: '',
        fechaInicio: defInicio,
        fechaFin: defFin,
        espacioId: this.defaultEspacioId ?? null
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

    const fechaInicioIso = new Date(value.fechaInicio).toISOString();
    const fechaFinIso = new Date(value.fechaFin).toISOString();

    const payload = {
      titulo: (value.titulo || '').trim(),
      descripcion: (value.descripcion || '').trim(),
      categoria: (value.categoria || '').trim() || undefined,
      fechaInicio: fechaInicioIso,
      fechaFin: fechaFinIso,
      espacioId: value.espacioId ?? null
    };

    this.guardar.emit(payload);
  }

  onCancelar(): void {
    this.cancelar.emit();
  }
}
