import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BorrarDatosModalComponent } from './borrar-datos-modal.component';
import { FormsModule } from '@angular/forms';

describe('BorrarDatosModalComponent (T-11.1 Doble Confirmación)', () => {
  let component: BorrarDatosModalComponent;
  let fixture: ComponentFixture<BorrarDatosModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BorrarDatosModalComponent, FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(BorrarDatosModalComponent);
    component = fixture.componentInstance;
    component.visible = true;
    fixture.detectChanges();
  });

  it('debe crearse e iniciar en el Paso 1', () => {
    expect(component).toBeTruthy();
    expect(component.pasoActual()).toBe(1);
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Paso 1 de 2');
  });

  it('debe avanzar al Paso 2 al pulsar continuar', () => {
    const btnContinuar = fixture.nativeElement.querySelector('#btn-continuar-paso-2') as HTMLButtonElement;
    expect(btnContinuar).toBeTruthy();

    btnContinuar.click();
    fixture.detectChanges();

    expect(component.pasoActual()).toBe(2);
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Paso 2 de 2');
  });

  it('en el Paso 2 debe deshabilitar el botón final hasta que se marque el checkbox y se escriba BORRAR', () => {
    component.irAPaso2();
    fixture.detectChanges();

    const btnFinal = fixture.nativeElement.querySelector('#btn-confirmar-borrado-definitivo') as HTMLButtonElement;
    expect(btnFinal.disabled).toBeTrue();

    component.confirmacionMarcada = true;
    expect(component.puedeConfirmarFinal()).toBeFalse();

    component.textoConfirmacion = 'borrar'; // case insensitive
    expect(component.puedeConfirmarFinal()).toBeTrue();
  });

  it('debe emitir evento confirmado al completar ambos pasos', () => {
    spyOn(component.confirmado, 'emit');

    component.irAPaso2();
    component.confirmacionMarcada = true;
    component.textoConfirmacion = 'BORRAR';
    fixture.detectChanges();

    const btnFinal = fixture.nativeElement.querySelector('#btn-confirmar-borrado-definitivo') as HTMLButtonElement;
    btnFinal.click();

    expect(component.confirmado.emit).toHaveBeenCalled();
    expect(component.pasoActual()).toBe(1); // reiniciado
  });

  it('debe emitir cancelado y reiniciar estado al pulsar cancelar', () => {
    spyOn(component.cancelado, 'emit');

    component.irAPaso2();
    component.confirmacionMarcada = true;
    component.textoConfirmacion = 'BOR';

    const btnCancelar = fixture.nativeElement.querySelector('#btn-cancelar-borrado') as HTMLButtonElement;
    btnCancelar.click();

    expect(component.cancelado.emit).toHaveBeenCalled();
    expect(component.pasoActual()).toBe(1);
    expect(component.confirmacionMarcada).toBeFalse();
    expect(component.textoConfirmacion).toBe('');
  });
});
