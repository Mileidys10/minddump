import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { RecordatorioService } from './recordatorio.service';
import { DatabaseService } from '../repositories/database.service';
import { Recordatorio } from '../models';

export type EstadoPermiso = NotificationPermission | 'no-soportado';

@Injectable({
  providedIn: 'root'
})
export class NotificacionService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly recordatorioService = inject(RecordatorioService);
  private readonly dbService = inject(DatabaseService);

  readonly permiso = signal<EstadoPermiso>('default');
  readonly mostrarModalExplicativo = signal<boolean>(false);
  readonly mensajeDenegadoVisible = signal<boolean>(false);

  private resolverPromesaPermiso?: (permiso: NotificationPermission) => void;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private isChecking = false;

  constructor() {
    this.actualizarEstadoPermiso();
  }

  isSupported(): boolean {
    return isPlatformBrowser(this.platformId) && typeof window !== 'undefined' && 'Notification' in window;
  }

  actualizarEstadoPermiso(): EstadoPermiso {
    if (!this.isSupported()) {
      this.permiso.set('no-soportado');
      return 'no-soportado';
    }
    const estado = Notification.permission;
    this.permiso.set(estado);
    return estado;
  }

  /**
   * T-07.2: Solicita permiso previo diálogo explicativo si el estado actual es 'default'.
   * Si el usuario ya concedió o denegó, devuelve el estado actual.
   */
  async solicitarPermisoConExplicacion(): Promise<NotificationPermission | 'no-soportado'> {
    if (!this.isSupported()) {
      return 'no-soportado';
    }

    const actual = Notification.permission;
    if (actual === 'granted' || actual === 'denied') {
      this.permiso.set(actual);
      return actual;
    }

    // Estado 'default': mostrar modal explicativo antes del prompt nativo
    this.mostrarModalExplicativo.set(true);
    return new Promise(resolve => {
      this.resolverPromesaPermiso = resolve;
    });
  }

  /**
   * Llamado cuando el usuario confirma el modal explicativo.
   */
  async onConfirmarExplicacion(): Promise<NotificationPermission> {
    this.mostrarModalExplicativo.set(false);

    if (!this.isSupported()) {
      this.resolverPromesaPermiso?.('default');
      this.resolverPromesaPermiso = undefined;
      return 'default';
    }

    try {
      const res = await Notification.requestPermission();
      this.permiso.set(res);

      if (res === 'denied') {
        this.mensajeDenegadoVisible.set(true);
      } else {
        this.mensajeDenegadoVisible.set(false);
      }

      this.resolverPromesaPermiso?.(res);
      return res;
    } catch {
      this.permiso.set('default');
      this.resolverPromesaPermiso?.('default');
      return 'default';
    } finally {
      this.resolverPromesaPermiso = undefined;
    }
  }

  /**
   * Llamado cuando el usuario descarta o cancela el modal explicativo.
   */
  onCancelarExplicacion(): void {
    this.mostrarModalExplicativo.set(false);
    this.resolverPromesaPermiso?.('default');
    this.resolverPromesaPermiso = undefined;
  }

  /**
   * Solicita el permiso directamente (ej. botón en pantalla de Configuración).
   */
  async solicitarPermisoDirecto(): Promise<NotificationPermission | 'no-soportado'> {
    if (!this.isSupported()) {
      return 'no-soportado';
    }

    try {
      const res = await Notification.requestPermission();
      this.permiso.set(res);
      this.mensajeDenegadoVisible.set(res === 'denied');
      return res;
    } catch {
      return 'default';
    }
  }

  cerrarMensajeDenegado(): void {
    this.mensajeDenegadoVisible.set(false);
  }

  // ==========================================
  // T-07.3: Notificaciones locales en app activa
  // ==========================================

  iniciarMonitoreo(intervalMs = 15000): void {
    if (!isPlatformBrowser(this.platformId) || typeof window === 'undefined') {
      return;
    }

    // Detener cualquier monitoreo previo
    this.detenerMonitoreo();

    // Verificación inicial inmediata
    void this.comprobarYDispararRecordatorios();

    // Polling periódico
    this.intervalId = setInterval(() => {
      void this.comprobarYDispararRecordatorios();
    }, intervalMs);

    // Escucha al retomar foco o visibilidad
    window.addEventListener('focus', this.onWindowFocus);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  detenerMonitoreo(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('focus', this.onWindowFocus);
      document.removeEventListener('visibilitychange', this.onVisibilityChange);
    }
  }

  private onWindowFocus = (): void => {
    void this.comprobarYDispararRecordatorios();
  };

  private onVisibilityChange = (): void => {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      void this.comprobarYDispararRecordatorios();
    }
  };

  /**
   * Inspecciona recordatorios pendientes cuya fechaHora ha llegado y dispara la notificación local.
   */
  async comprobarYDispararRecordatorios(): Promise<number> {
    if (this.isChecking) return 0;
    this.isChecking = true;

    try {
      const pendientes = await this.recordatorioService.getPendientesNotificar();
      if (pendientes.length === 0) {
        return 0;
      }

      let disparadas = 0;
      for (const rec of pendientes) {
        await this.emitirNotificacion(rec);
        await this.recordatorioService.marcarNotificado(rec.id!);
        disparadas++;
      }

      return disparadas;
    } finally {
      this.isChecking = false;
    }
  }

  /**
   * Emite una notificación local en el navegador para un recordatorio.
   */
  private async emitirNotificacion(rec: Recordatorio): Promise<void> {
    let titulo = rec.titulo || 'Recordatorio de MindDump';
    let cuerpo = rec.descripcion || 'Tienes un elemento programado en tu segundo cerebro.';
    let rutaDestino = '/inicio';

    if (rec.tareaId) {
      const tarea = await this.dbService.tareas.get(rec.tareaId);
      if (tarea) {
        titulo = `🔔 Tarea: ${tarea.titulo}`;
        cuerpo = rec.titulo
          ? `${rec.titulo} — ${tarea.descripcion || 'Tarea pendiente'}`
          : tarea.descripcion || 'Tienes esta tarea programada.';
      }
      rutaDestino = '/tareas';
    } else if (rec.eventoId) {
      const evento = await this.dbService.eventos.get(rec.eventoId);
      if (evento) {
        titulo = `📅 Evento: ${evento.titulo}`;
        cuerpo = rec.titulo
          ? `${rec.titulo} — ${evento.descripcion || 'Evento programado'}`
          : evento.descripcion || 'Tienes este evento próximo a iniciar.';
      }
      rutaDestino = '/eventos';
    }

    // Si las notificaciones no están concedidas, omitimos la emisión visual nativa
    if (this.permiso() !== 'granted' || !this.isSupported()) {
      return;
    }

    try {
      // Intentar primero con el Service Worker (si está activo)
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const registration = await navigator.serviceWorker.ready;
        if (registration && 'showNotification' in registration) {
          await registration.showNotification(titulo, {
            body: cuerpo,
            icon: 'favicon.ico',
            tag: `recordatorio-${rec.id}`,
            data: { url: rutaDestino }
          });
          return;
        }
      }

      // Fallback a Notification API estándar
      const notif = new Notification(titulo, {
        body: cuerpo,
        icon: 'favicon.ico',
        tag: `recordatorio-${rec.id}`
      });

      notif.onclick = () => {
        window.focus();
        void this.router.navigate([rutaDestino]);
        notif.close();
      };
    } catch {
      // Si el navegador bloquea la notificación en segundo plano, se omite silenciosamente
    }
  }

  // ==============================================================
  // T-07.6: Métodos de prueba interactiva en dispositivos reales
  // ==============================================================

  /**
   * T-07.6: Emite una notificación de prueba inmediata para validar en dispositivos reales.
   */
  async enviarNotificacionPrueba(): Promise<boolean> {
    if (this.permiso() !== 'granted' || !this.isSupported()) {
      return false;
    }

    const titulo = '🧠 MindDump: Alerta de Prueba';
    const cuerpo = '¡Notificación en tiempo real verificada con éxito en este dispositivo!';
    const tag = `prueba-${Date.now()}`;

    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const registration = await navigator.serviceWorker.ready;
        if (registration && 'showNotification' in registration) {
          await registration.showNotification(titulo, {
            body: cuerpo,
            icon: 'favicon.ico',
            tag,
            data: { url: '/configuracion' }
          });
          return true;
        }
      }

      const notif = new Notification(titulo, {
        body: cuerpo,
        icon: 'favicon.ico',
        tag
      });

      notif.onclick = () => {
        window.focus();
        void this.router.navigate(['/configuracion']);
        notif.close();
      };
      return true;
    } catch {
      return false;
    }
  }

  /**
   * T-07.6: Programa un recordatorio de prueba para dentro de X segundos para validar en segundo plano.
   */
  async programarPruebaEnSegundoPlano(segundos = 5): Promise<Recordatorio> {
    const fechaHora = new Date(Date.now() + segundos * 1000).toISOString();
    const rec = await this.recordatorioService.create({
      titulo: '🧪 Alerta de Prueba en Segundo Plano',
      fechaHora,
      tareaId: null,
      eventoId: null
    });

    setTimeout(() => {
      void this.comprobarYDispararRecordatorios();
    }, segundos * 1000);

    return rec;
  }
}
