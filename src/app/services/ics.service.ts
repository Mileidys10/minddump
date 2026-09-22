import { Injectable } from '@angular/core';
import { createEvent, EventAttributes, DateArray } from 'ics';
import { Evento } from '../models';

@Injectable({
  providedIn: 'root'
})
export class IcsService {
  /**
   * Valida que el evento tenga las fechas requeridas y coherentes para generar un archivo .ics válido (RFC 5545).
   */
  validarEventoParaIcs(evento: Evento): void {
    if (!evento.titulo || evento.titulo.trim().length === 0) {
      throw new Error('El evento debe tener un título para ser exportado a iCalendar.');
    }
    if (!evento.fechaInicio) {
      throw new Error('El evento debe tener una fecha de inicio (DTSTART).');
    }
    if (!evento.fechaFin) {
      throw new Error('El evento debe tener una fecha de fin (DTEND).');
    }

    const tInicio = new Date(evento.fechaInicio).getTime();
    const tFin = new Date(evento.fechaFin).getTime();

    if (isNaN(tInicio) || isNaN(tFin)) {
      throw new Error('Las fechas del evento no tienen un formato ISO válido.');
    }

    if (tFin < tInicio) {
      throw new Error('La fecha de fin no puede ser anterior a la fecha de inicio.');
    }
  }

  /**
   * Genera el contenido del archivo iCalendar (.ics) cumpliendo con el estándar RFC 5545.
   * Utiliza la librería oficial 'ics' de npm.
   */
  generarIcs(evento: Evento): string {
    this.validarEventoParaIcs(evento);

    const dInicio = new Date(evento.fechaInicio);
    const dFin = new Date(evento.fechaFin);

    const start: DateArray = [
      dInicio.getUTCFullYear(),
      dInicio.getUTCMonth() + 1,
      dInicio.getUTCDate(),
      dInicio.getUTCHours(),
      dInicio.getUTCMinutes()
    ];

    const end: DateArray = [
      dFin.getUTCFullYear(),
      dFin.getUTCMonth() + 1,
      dFin.getUTCDate(),
      dFin.getUTCHours(),
      dFin.getUTCMinutes()
    ];

    const attributes: EventAttributes = {
      start,
      end,
      startInputType: 'utc',
      startOutputType: 'utc',
      endInputType: 'utc',
      endOutputType: 'utc',
      title: evento.titulo.trim(),
      description: evento.descripcion?.trim() || undefined,
      categories: evento.categoria ? [evento.categoria.trim()] : undefined,
      productId: 'minddump/icalendar/v1.0'
    };

    const { error, value } = createEvent(attributes);

    if (error || !value) {
      throw new Error(`Error al generar archivo iCalendar: ${error ? error.message : 'Generación fallida'}`);
    }

    return value;
  }

  /**
   * Inicia la descarga en el navegador del archivo .ics generado a partir del evento.
   */
  descargarIcs(evento: Evento, nombreArchivoPersonalizado?: string): void {
    const icsContent = this.generarIcs(evento);

    const nombreLimpio =
      nombreArchivoPersonalizado ||
      this.sanitizarNombreArchivo(evento.titulo || `evento-${evento.id || 'export'}`);

    const nombreFinal = nombreLimpio.endsWith('.ics') ? nombreLimpio : `${nombreLimpio}.ics`;

    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = nombreFinal;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(url);
    }
  }

  private sanitizarNombreArchivo(nombre: string): string {
    return nombre
      .toLowerCase()
      .replace(/[\s/\\?%*:|"<>]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'evento';
  }
}
