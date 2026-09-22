import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PermisoNotificacionModalComponent } from './permiso-notificacion-modal.component';

describe('PermisoNotificacionModalComponent (T-07.2)', () => {
  let component: PermisoNotificacionModalComponent;
  let fixture: ComponentFixture<PermisoNotificacionModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PermisoNotificacionModalComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PermisoNotificacionModalComponent);
    component = fixture.componentInstance;
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('no debe renderizar contenido si visible es false', () => {
    component.visible = false;
    fixture.detectChanges();
    const modal = fixture.nativeElement.querySelector('.modal-overlay');
    expect(modal).toBeNull();
  });

  it('debe mostrar la explicación previa y la limitación R-08 si visible es true', () => {
    component.visible = true;
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('¿Activar notificaciones?');
    expect(compiled.textContent).toContain('Limitación del MVP (Regla R-08)');
    expect(compiled.textContent).toContain('Las notificaciones locales funcionan mientras la aplicación esté abierta');
    expect(compiled.textContent).toContain('Activar notificaciones');
  });

  it('debe emitir confirmar al pulsar Activar notificaciones', () => {
    spyOn(component.confirmar, 'emit');
    component.visible = true;
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('#btn-permiso-confirmar') as HTMLButtonElement;
    btn.click();

    expect(component.confirmar.emit).toHaveBeenCalled();
  });

  it('debe emitir cancelar al pulsar Ahora no', () => {
    spyOn(component.cancelar, 'emit');
    component.visible = true;
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('#btn-permiso-cancelar') as HTMLButtonElement;
    btn.click();

    expect(component.cancelar.emit).toHaveBeenCalled();
  });
});
