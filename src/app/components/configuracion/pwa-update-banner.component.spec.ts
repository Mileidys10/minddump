import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PwaUpdateBannerComponent } from './pwa-update-banner.component';
import { PwaUpdateService } from '../../services/pwa-update.service';
import { signal } from '@angular/core';

describe('PwaUpdateBannerComponent (T-11.2)', () => {
  let fixture: ComponentFixture<PwaUpdateBannerComponent>;
  let pwaServiceMock: {
    nuevaVersionDisponible: ReturnType<typeof signal<boolean>>;
    pospuesto: ReturnType<typeof signal<boolean>>;
    actualizar: jasmine.Spy;
    posponer: jasmine.Spy;
  };

  beforeEach(async () => {
    pwaServiceMock = {
      nuevaVersionDisponible: signal(false),
      pospuesto: signal(false),
      actualizar: jasmine.createSpy('actualizar'),
      posponer: jasmine.createSpy('posponer')
    };

    await TestBed.configureTestingModule({
      imports: [PwaUpdateBannerComponent],
      providers: [
        { provide: PwaUpdateService, useValue: pwaServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PwaUpdateBannerComponent);
    fixture.detectChanges();
  });

  it('no debe mostrar el banner si no hay nueva versión disponible', () => {
    const banner = fixture.nativeElement.querySelector('#pwa-update-banner');
    expect(banner).toBeNull();
  });

  it('debe mostrar el aviso al usuario cuando hay una nueva versión disponible (T-11.2)', () => {
    pwaServiceMock.nuevaVersionDisponible.set(true);
    fixture.detectChanges();

    const banner = fixture.nativeElement.querySelector('#pwa-update-banner');
    expect(banner).toBeTruthy();
    expect(banner.textContent).toContain('Nueva versión disponible');
  });

  it('debe invocar actualizar al pulsar el botón Actualizar ahora', () => {
    pwaServiceMock.nuevaVersionDisponible.set(true);
    fixture.detectChanges();

    const btnActualizar = fixture.nativeElement.querySelector('#btn-pwa-actualizar') as HTMLButtonElement;
    btnActualizar.click();

    expect(pwaServiceMock.actualizar).toHaveBeenCalled();
  });

  it('debe invocar posponer al pulsar el botón Posponer', () => {
    pwaServiceMock.nuevaVersionDisponible.set(true);
    fixture.detectChanges();

    const btnPosponer = fixture.nativeElement.querySelector('#btn-pwa-posponer') as HTMLButtonElement;
    btnPosponer.click();

    expect(pwaServiceMock.posponer).toHaveBeenCalled();
  });

  it('no debe mostrar el banner si el usuario ha pospuesto la actualización', () => {
    pwaServiceMock.nuevaVersionDisponible.set(true);
    pwaServiceMock.pospuesto.set(true);
    fixture.detectChanges();

    const banner = fixture.nativeElement.querySelector('#pwa-update-banner');
    expect(banner).toBeNull();
  });
});
