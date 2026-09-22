import { TestBed } from '@angular/core/testing';
import { IcsService } from './ics.service';
import { Evento } from '../models';

describe('IcsService (T-09.1)', () => {
  let service: IcsService;

  const mockEvento: Evento = {
    id: 42,
    titulo: 'Reunión de Diseño y Planificación',
    descripcion: 'Revisión de arquitectura:\n- Módulos core\n- Integración iCalendar\nTildes: á, é, í, ó, ú, ñ',
    categoria: 'Ingeniería',
    fechaInicio: '2026-10-15T14:30:00.000Z',
    fechaFin: '2026-10-15T16:00:00.000Z',
    espacioId: 1,
    fechaCreacion: '2026-09-01T00:00:00.000Z'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [IcsService]
    });
    service = TestBed.inject(IcsService);
  });

  it('debe crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  describe('Generación de contenido .ics (RFC 5545)', () => {
    it('debe generar un archivo iCalendar válido con cabeceras estándar RFC 5545', () => {
      const ics = service.generarIcs(mockEvento);

      expect(ics).toContain('BEGIN:VCALENDAR');
      expect(ics).toContain('VERSION:2.0');
      expect(ics).toContain('BEGIN:VEVENT');
      expect(ics).toContain('END:VEVENT');
      expect(ics).toContain('END:VCALENDAR');
    });

    it('debe incluir SUMMARY, DESCRIPTION, DTSTART y DTEND', () => {
      const ics = service.generarIcs(mockEvento);

      expect(ics).toContain('SUMMARY:Reunión de Diseño y Planificación');
      expect(ics).toContain('DTSTART:20261015T143000Z');
      expect(ics).toContain('DTEND:20261015T160000Z');
      expect(ics).toContain('DESCRIPTION:');
    });

    it('debe preservar caracteres especiales, tildes y eñes', () => {
      const ics = service.generarIcs(mockEvento);

      expect(ics).toContain('á');
      expect(ics).toContain('ñ');
    });

    it('debe fallar si el evento no tiene título', () => {
      const eventoSinTitulo = { ...mockEvento, titulo: '' };
      expect(() => service.generarIcs(eventoSinTitulo)).toThrowError(/debe tener un título/);
    });

    it('debe fallar si el evento no tiene fechaFin', () => {
      const eventoSinFin = { ...mockEvento, fechaFin: '' };
      expect(() => service.generarIcs(eventoSinFin)).toThrowError(/debe tener una fecha de fin/);
    });

    it('debe fallar si fechaFin es anterior a fechaInicio', () => {
      const eventoInvalido = {
        ...mockEvento,
        fechaInicio: '2026-10-15T16:00:00.000Z',
        fechaFin: '2026-10-15T14:00:00.000Z'
      };
      expect(() => service.generarIcs(eventoInvalido)).toThrowError(/no puede ser anterior/);
    });
  });

  describe('Descarga de archivo .ics', () => {
    it('debe invocar la descarga en el navegador sin errores', () => {
      const createObjectURLSpy = spyOn(window.URL, 'createObjectURL').and.returnValue('blob:mock-url');
      const revokeObjectURLSpy = spyOn(window.URL, 'revokeObjectURL').and.callThrough();

      expect(() => service.descargarIcs(mockEvento)).not.toThrow();
      expect(createObjectURLSpy).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');
    });
  });
});
