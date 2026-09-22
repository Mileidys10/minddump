import { TestBed } from '@angular/core/testing';
import { PwaUpdateService } from './pwa-update.service';
import { SwUpdate, VersionEvent, VersionReadyEvent } from '@angular/service-worker';
import { Subject } from 'rxjs';

describe('PwaUpdateService (T-11.2)', () => {
  let service: PwaUpdateService;
  let swUpdateSpy: jasmine.SpyObj<SwUpdate>;
  let versionUpdatesSubject: Subject<VersionEvent>;

  beforeEach(() => {
    versionUpdatesSubject = new Subject<VersionEvent>();
    swUpdateSpy = jasmine.createSpyObj('SwUpdate', ['activateUpdate', 'checkForUpdate'], {
      isEnabled: true,
      versionUpdates: versionUpdatesSubject.asObservable()
    });

    TestBed.configureTestingModule({
      providers: [
        PwaUpdateService,
        { provide: SwUpdate, useValue: swUpdateSpy }
      ]
    });
    service = TestBed.inject(PwaUpdateService);
  });

  it('debe crearse correctamente', () => {
    expect(service).toBeTruthy();
    expect(service.nuevaVersionDisponible()).toBeFalse();
    expect(service.pospuesto()).toBeFalse();
  });

  it('debe marcar nuevaVersionDisponible como true al recibir VersionReadyEvent', () => {
    const readyEvent: VersionReadyEvent = {
      type: 'VERSION_READY',
      currentVersion: { hash: 'v1' },
      latestVersion: { hash: 'v2' }
    };

    versionUpdatesSubject.next(readyEvent);
    expect(service.nuevaVersionDisponible()).toBeTrue();
    expect(service.pospuesto()).toBeFalse();
  });

  it('debe permitir posponer la actualización', () => {
    service.nuevaVersionDisponible.set(true);
    service.posponer();
    expect(service.pospuesto()).toBeTrue();
  });

  it('debe invocar swUpdate.activateUpdate al llamar a actualizar', async () => {
    swUpdateSpy.activateUpdate.and.resolveTo(true);
    spyOn(service, 'recargarPagina');
    await service.actualizar();
    expect(swUpdateSpy.activateUpdate).toHaveBeenCalled();
    expect(service.recargarPagina).toHaveBeenCalled();
  });

  it('debe comprobar actualizaciones con comprobarActualizacion', async () => {
    swUpdateSpy.checkForUpdate.and.resolveTo(true);
    const res = await service.comprobarActualizacion();
    expect(swUpdateSpy.checkForUpdate).toHaveBeenCalled();
    expect(res).toBeTrue();
  });
});
