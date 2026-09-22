import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NotificacionService, EstadoPermiso } from '../../services/notificacion.service';
import { TemaService, TemaVisual } from '../../services/tema.service';
import { PwaUpdateService } from '../../services/pwa-update.service';
import { AppInitService } from '../../services/init.service';
import { InboxService } from '../../services/inbox.service';
import { NotaService } from '../../services/nota.service';
import { TareaService } from '../../services/tarea.service';
import { EventoService } from '../../services/evento.service';
import { EspacioService } from '../../services/espacio.service';
import { RecordatorioService } from '../../services/recordatorio.service';
import { AuthService } from '../../services/auth.service';
import { FirestoreSyncService } from '../../services/firestore-sync.service';
import { FirebaseService, FirebaseConfig } from '../../services/firebase.service';
import { PermisoNotificacionModalComponent } from './permiso-notificacion-modal.component';
import { BorrarDatosModalComponent } from './borrar-datos-modal.component';
import { PwaUpdateBannerComponent } from './pwa-update-banner.component';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PermisoNotificacionModalComponent,
    BorrarDatosModalComponent,
    PwaUpdateBannerComponent
  ],
  template: `
    <div class="view-container" id="view-configuracion">
      <header class="view-header">
        <div>
          <span class="badge">Ajustes Generales (P-09 / E-12)</span>
          <h1 class="view-title">Configuración ⚙️</h1>
          <p class="view-subtitle">Cuenta de usuario, sincronización en la nube, personalización y almacenamiento local.</p>
        </div>
      </header>

      <!-- Banner de Actualización PWA si está disponible (T-11.2) -->
      <app-pwa-update-banner />

      @if (mensajeExitoBorrado()) {
        <div class="alert-success glass" id="alert-borrado-exitoso">
          <span>✅ Todos los datos han sido borrados con éxito. El espacio de sistema <strong>Útiles</strong> ha sido restaurado limpio.</span>
          <button type="button" class="btn-close-alert" (click)="mensajeExitoBorrado.set(false)">✕</button>
        </div>
      }

      <div class="config-sections">
        <!-- SECCIÓN 0: Cuenta y Sincronización en la Nube (C-06 / E-12) -->
        <section class="config-card glass sync-card" id="section-cuenta-sync">
          <div class="config-info">
            <span class="section-tag sync-tag">Nube & Sincronización (E-12)</span>
            <div class="title-with-badge">
              <h3>Cuenta y Sincronización</h3>
              <span
                class="status-badge"
                [class.success]="syncService.syncStatus() === 'synced'"
                [class.syncing]="syncService.syncStatus() === 'syncing'"
                [class.danger]="syncService.syncStatus() === 'error'"
                id="badge-sync-status"
              >
                {{ getSyncStatusLabel() }}
              </span>
            </div>

            <!-- Perfil de Usuario -->
            <div class="user-profile-bar" id="user-profile-info">
              <div class="user-avatar-pill">
                <span class="avatar-emoji">👤</span>
                <div class="user-details">
                  <strong class="user-name">{{ authService.currentUser()?.displayName || 'Modo Local (Invitado)' }}</strong>
                  <span class="user-email">{{ authService.currentUser()?.email || 'Sin cuenta conectada — Guardado solo en este navegador' }}</span>
                </div>
              </div>
            </div>

            <!-- Telemetría de Sincronización -->
            <div class="sync-telemetry">
              <div class="telemetry-pill">
                <span class="telemetry-icon">🕒</span>
                <span>Última sincronización: <strong>{{ formatearTiempoRelativo(syncService.lastSyncTime()) }}</strong></span>
              </div>

              <div class="telemetry-pill">
                <span class="telemetry-icon">📤</span>
                <span>Pendientes por subir: <strong>{{ syncService.pendingCount() }} cambios</strong></span>
              </div>

              <div class="telemetry-pill">
                <span class="telemetry-icon">{{ syncService.isOnline() ? '🌐' : '📴' }}</span>
                <span>Red: <strong>{{ syncService.isOnline() ? 'Conectado a Internet' : 'Sin conexión (Modo Offline activo)' }}</strong></span>
              </div>
            </div>

            @if (syncService.errorMessage()) {
              <div class="sync-error-banner" id="sync-error-banner">
                ⚠️ {{ syncService.errorMessage() }}
              </div>
            }
          </div>

          <div class="config-action sync-actions">
            <button
              type="button"
              class="btn-action btn-sync-now"
              id="btn-sincronizar-ahora"
              [disabled]="syncService.syncStatus() === 'syncing'"
              (click)="onSincronizar()"
            >
              {{ syncService.syncStatus() === 'syncing' ? '🔄 Sincronizando...' : '⚡ Sincronizar ahora' }}
            </button>

            @if (authService.currentUser()) {
              <button
                type="button"
                class="btn-action-secondary"
                id="btn-logout"
                (click)="onCerrarSesion()"
              >
                🚪 Cerrar sesión
              </button>
            } @else {
              <button
                type="button"
                class="btn-action-secondary"
                id="btn-ir-login"
                (click)="onIrALogin()"
              >
                🔑 Conectar cuenta
              </button>
            }

            <button
              type="button"
              class="btn-link"
              id="btn-toggle-firebase-config"
              (click)="mostrarConfigFirebase.set(!mostrarConfigFirebase())"
            >
              {{ mostrarConfigFirebase() ? '▲ Ocultar Firebase' : '⚙️ Configurar claves Firebase' }}
            </button>
          </div>
        </section>

        <!-- Subpanel opcional: Configuración personalizada de credenciales Firebase -->
        @if (mostrarConfigFirebase()) {
          <section class="config-card glass firebase-config-card" id="section-firebase-keys">
            <div class="config-info">
              <span class="section-tag">Credenciales del Proyecto</span>
              <h3>Configuración de Firebase Firestore</h3>
              <p>Puedes conectar tu propio proyecto de Google Firebase Console (Spark gratuito).</p>

              <div class="form-grid">
                <div class="form-group">
                  <label>API Key:</label>
                  <input type="text" [(ngModel)]="firebaseConfigForm.apiKey" class="input-text" />
                </div>
                <div class="form-group">
                  <label>Project ID:</label>
                  <input type="text" [(ngModel)]="firebaseConfigForm.projectId" class="input-text" />
                </div>
                <div class="form-group">
                  <label>Auth Domain:</label>
                  <input type="text" [(ngModel)]="firebaseConfigForm.authDomain" class="input-text" />
                </div>
                <div class="form-group">
                  <label>App ID:</label>
                  <input type="text" [(ngModel)]="firebaseConfigForm.appId" class="input-text" />
                </div>
              </div>

              @if (mensajeConfigFirebase()) {
                <div class="config-feedback">
                  {{ mensajeConfigFirebase() }}
                </div>
              }
            </div>

            <div class="config-action firebase-action-buttons">
              <button type="button" class="btn-action" (click)="guardarConfigFirebase()" id="btn-save-firebase-config">
                💾 Guardar y Reiniciar
              </button>
              <button type="button" class="btn-action-secondary" (click)="restaurarDefaultFirebase()" id="btn-reset-firebase-config">
                ↺ Restaurar por defecto
              </button>
            </div>
          </section>
        }

        <!-- SECCIÓN 1: Tema Visual (T-11.1) -->
        <section class="config-card glass" id="section-tema-visual">
          <div class="config-info">
            <span class="section-tag">Apariencia</span>
            <h3>Tema Visual</h3>
            <p>Elige entre el tema oscuro de alto contraste y el tema claro optimizado para lectura diurna.</p>
          </div>
          <div class="config-action">
            <div class="theme-selector-group">
              <button
                type="button"
                class="btn-theme-toggle"
                [class.active]="temaService.tema() === 'dark'"
                id="btn-tema-oscuro"
                (click)="onSeleccionarTema('dark')"
              >
                🌙 Modo Oscuro
              </button>
              <button
                type="button"
                class="btn-theme-toggle"
                [class.active]="temaService.tema() === 'light'"
                id="btn-tema-claro"
                (click)="onSeleccionarTema('light')"
              >
                ☀️ Modo Claro
              </button>
            </div>
          </div>
        </section>

        <!-- SECCIÓN 2: Permisos de Notificación (T-07.2 / T-11.1) -->
        <section class="config-card glass notification-card" id="section-notificaciones">
          <div class="config-info">
            <span class="section-tag">Alertas</span>
            <div class="title-with-badge">
              <h3>Permisos de Notificación</h3>
              <span
                class="status-badge"
                [class.success]="notifService.permiso() === 'granted'"
                [class.danger]="notifService.permiso() === 'denied'"
                id="badge-estado-permiso"
              >
                {{ getPermisoLabel(notifService.permiso()) }}
              </span>
            </div>
            <p>Controla las alertas sonoras y visuales para tareas y eventos programados.</p>

            <div class="notif-notice">
              <span class="notice-icon">ℹ️</span>
              <span class="notice-text">
                <strong>Regla R-08:</strong> Las notificaciones funcionan exclusivamente con la app abierta o en segundo plano activo.
                Tus recordatorios siempre se guardan de forma local en el dispositivo independientemente de este permiso.
              </span>
            </div>

            @if (notifService.mensajeDenegadoVisible()) {
              <div class="denied-alert" id="alerta-permiso-denegado">
                ⚠️ El permiso fue denegado en este navegador. Para recibir alertas, actívalo en los ajustes de privacidad del navegador.
              </div>
            }

            @if (mensajePruebaNotif()) {
              <div class="test-feedback-alert" id="feedback-notificacion-prueba">
                {{ mensajePruebaNotif() }}
              </div>
            }
          </div>

          <div class="config-action">
            @if (notifService.permiso() !== 'granted') {
              <button
                type="button"
                class="btn-action"
                id="btn-solicitar-permiso-notif"
                (click)="onSolicitarPermiso()"
              >
                🔔 Solicitar permiso
              </button>
            } @else {
              <div class="notif-granted-container">
                <span class="granted-indicator" id="indicator-alertas-activadas">✔️ Alertas activadas</span>
                <div class="test-notif-buttons">
                  <button
                    type="button"
                    class="btn-test-notif"
                    id="btn-probar-notificacion"
                    (click)="onProbarNotificacionInmediata()"
                    title="Envía una notificación de prueba en este instante"
                  >
                    🧪 Probar ahora
                  </button>
                  <button
                    type="button"
                    class="btn-test-notif-secondary"
                    id="btn-probar-notificacion-segundo-plano"
                    (click)="onProbarNotificacionSegundoPlano()"
                    title="Programa una alerta en 5 segundos para que puedas minimizar o cambiar de pestaña"
                  >
                    ⏱️ Probar en 5s
                  </button>
                </div>
              </div>
            }
          </div>
        </section>

        <!-- SECCIÓN 3: Estado PWA y Actualizaciones (T-11.1 / T-11.2) -->
        <section class="config-card glass" id="section-estado-pwa">
          <div class="config-info">
            <span class="section-tag">PWA & Offline</span>
            <div class="title-with-badge">
              <h3>Estado de la Aplicación PWA</h3>
              <span class="status-badge" [class.success]="isPwaInstalled()" id="badge-estado-pwa">
                {{ isPwaInstalled() ? '🟢 Instalada como App (Modo Standalone)' : '🌐 Navegador Web (Instalable como PWA)' }}
              </span>
            </div>
            <p>MindDump opera de manera completamente autónoma sin conexión a internet mediante Service Worker.</p>
          </div>
          <div class="config-action">
            <button
              type="button"
              class="btn-action-secondary"
              id="btn-comprobar-actualizaciones"
              [disabled]="pwaUpdateService.comprobando()"
              (click)="onComprobarActualizaciones()"
            >
              {{ pwaUpdateService.comprobando() ? 'Comprobando...' : '🔍 Buscar actualizaciones' }}
            </button>
          </div>
        </section>

        <!-- SECCIÓN 4: Información de Versión (T-11.1) -->
        <section class="config-card glass" id="section-info-version">
          <div class="config-info">
            <span class="section-tag">Sistema</span>
            <h3>Información de la Aplicación</h3>
            <p>Segundo Cerebro Digital desarrollado bajo el Estándar de Fábrica <strong>Google Cloud OKF v0.2</strong>.</p>
            <div class="version-meta">
              <span>Stack: Angular 20 Standalone + IndexedDB Dexie + Firebase Cloud Sync</span>
              <span>•</span>
              <span>Arquitectura: Repositorios & Sincronización Bidireccional</span>
            </div>
          </div>
          <div class="config-action">
            <span class="version-badge" id="badge-version-app">v1.0.0-mvp</span>
          </div>
        </section>

        <!-- SECCIÓN 5: Zona de Peligro - Borrar Todo (T-11.1) -->
        <section class="config-card glass danger-zone" id="section-borrar-datos">
          <div class="config-info">
            <span class="section-tag danger">Gobernanza de Datos</span>
            <h3 class="danger-title">Borrar Todos los Datos</h3>
            <p>Elimina permanentemente todas las notas, tareas, eventos, recordatorios y espacios de IndexedDB. Requiere doble confirmación.</p>
            <div class="safety-note">
              🛡️ El espacio predefinido <strong>Útiles</strong> se regenerará automáticamente limpio tras el vaciado.
            </div>
          </div>
          <div class="config-action">
            <button
              type="button"
              class="btn-danger"
              id="btn-reset-data"
              (click)="abrirModalBorrado()"
            >
              🗑️ Borrar todo
            </button>
          </div>
        </section>
      </div>

      <!-- Modal explicativo previo al permiso del navegador -->
      <app-permiso-notificacion-modal
        [visible]="notifService.mostrarModalExplicativo()"
        (confirmar)="notifService.onConfirmarExplicacion()"
        (cancelar)="notifService.onCancelarExplicacion()"
      />

      <!-- Modal de Doble Confirmación para Borrado de Datos (T-11.1) -->
      <app-borrar-datos-modal
        [visible]="mostrarModalBorrado()"
        (cancelado)="cerrarModalBorrado()"
        (confirmado)="ejecutarBorradoTotal()"
      />
    </div>
  `,
  styles: [`
    .view-container { display: flex; flex-direction: column; gap: 24px; animation: fadeIn 0.3s ease; }
    .badge {
      display: inline-block; font-size: 0.75rem; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.05em; padding: 4px 10px; border-radius: var(--radius-full);
      background: rgba(148, 163, 184, 0.15); color: #94a3b8; margin-bottom: 8px;
    }
    .view-title { font-size: 2rem; font-weight: 700; color: var(--text-primary); }
    .view-subtitle { color: var(--text-secondary); margin-top: 6px; font-size: 0.95rem; }
    .config-sections { display: flex; flex-direction: column; gap: 18px; }
    .config-card {
      padding: 22px 26px; border-radius: var(--radius-lg); display: flex;
      justify-content: space-between; align-items: center; gap: 24px;
      transition: border-color var(--transition-fast);
    }
    .config-card:hover { border-color: rgba(255, 255, 255, 0.15); }
    .config-info { flex: 1; }
    .section-tag {
      font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;
      color: #818cf8; margin-bottom: 4px; display: inline-block;
    }
    .section-tag.danger { color: #f43f5e; }
    .section-tag.sync-tag { color: #38bdf8; }
    .title-with-badge { display: flex; align-items: center; gap: 12px; margin-bottom: 4px; flex-wrap: wrap; }
    .config-info h3 { font-size: 1.15rem; font-weight: 600; color: var(--text-primary); margin: 0 0 4px 0; }
    .config-info p { font-size: 0.9rem; color: var(--text-secondary); margin: 0 0 8px 0; line-height: 1.4; }

    /* Estilos de la sección Cuenta & Sincronización */
    .sync-card {
      border-left: 4px solid #38bdf8;
      background: linear-gradient(135deg, rgba(56, 189, 248, 0.05), rgba(99, 102, 241, 0.05));
    }
    .user-profile-bar {
      margin: 10px 0 14px 0;
    }
    .user-avatar-pill {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 8px 14px;
      border-radius: var(--radius-md, 10px);
    }
    .avatar-emoji { font-size: 1.5rem; }
    .user-details { display: flex; flex-direction: column; }
    .user-name { font-size: 0.95rem; color: var(--text-primary); }
    .user-email { font-size: 0.8rem; color: var(--text-secondary); }
    .sync-telemetry {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 8px;
    }
    .telemetry-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.82rem;
      padding: 5px 10px;
      border-radius: var(--radius-sm, 6px);
      background: rgba(0, 0, 0, 0.25);
      color: var(--text-secondary);
      border: 1px solid rgba(255, 255, 255, 0.06);
    }
    .telemetry-pill strong { color: var(--text-primary); }
    .sync-error-banner {
      margin-top: 10px;
      padding: 8px 12px;
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 8px;
      color: #fca5a5;
      font-size: 0.85rem;
    }
    .sync-actions {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-width: 170px;
    }
    .btn-sync-now {
      background: linear-gradient(135deg, #0284c7, #6366f1);
      box-shadow: 0 4px 14px rgba(2, 132, 199, 0.3);
    }
    .btn-sync-now:hover:not(:disabled) {
      background: linear-gradient(135deg, #0369a1, #4f46e5);
    }
    .btn-link {
      background: none;
      border: none;
      color: #94a3b8;
      font-size: 0.78rem;
      cursor: pointer;
      text-decoration: underline;
      padding: 4px;
      text-align: center;
    }
    .btn-link:hover { color: #f1f5f9; }

    /* Formulario de credenciales Firebase */
    .firebase-config-card {
      background: rgba(15, 23, 42, 0.85);
      border: 1px dashed rgba(56, 189, 248, 0.3);
      flex-direction: column;
      align-items: stretch;
    }
    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 12px;
      margin-top: 12px;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .form-group label {
      font-size: 0.78rem;
      color: #94a3b8;
      font-weight: 600;
    }
    .input-text {
      padding: 8px 12px;
      border-radius: 6px;
      background: rgba(0, 0, 0, 0.35);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #f1f5f9;
      font-family: monospace;
      font-size: 0.85rem;
    }
    .firebase-action-buttons {
      display: flex;
      gap: 8px;
      margin-top: 14px;
    }
    .config-feedback {
      margin-top: 10px;
      color: #38bdf8;
      font-size: 0.82rem;
    }

    .notif-notice {
      display: flex; gap: 8px; font-size: 0.82rem; color: #93c5fd; background: rgba(59, 130, 246, 0.08);
      padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(59, 130, 246, 0.2); margin-top: 6px;
      line-height: 1.4;
    }
    .notice-icon { font-size: 1rem; }
    .denied-alert {
      margin-top: 8px; font-size: 0.82rem; color: #fca5a5; background: rgba(239, 68, 68, 0.1);
      padding: 6px 10px; border-radius: 6px; border: 1px solid rgba(239, 68, 68, 0.25);
    }
    .safety-note {
      font-size: 0.82rem; color: #fecdd3; background: rgba(244, 63, 94, 0.06);
      padding: 6px 10px; border-radius: 6px; border: 1px solid rgba(244, 63, 94, 0.18);
      display: inline-block; margin-top: 4px;
    }
    .version-meta { font-size: 0.8rem; color: var(--text-muted); display: flex; gap: 8px; flex-wrap: wrap; }
    .theme-selector-group {
      display: flex; background: rgba(0, 0, 0, 0.25); padding: 4px; border-radius: var(--radius-full);
      border: 1px solid var(--border-color); gap: 4px;
    }
    .btn-theme-toggle {
      padding: 8px 16px; border-radius: var(--radius-full); font-size: 0.85rem; font-weight: 600;
      color: var(--text-secondary); border: none; cursor: pointer; transition: all 0.2s;
    }
    .btn-theme-toggle.active {
      background: var(--primary, #6366f1); color: #fff; box-shadow: 0 2px 8px var(--primary-glow);
    }
    .btn-action {
      padding: 9px 18px; border-radius: 8px; font-size: 0.88rem; font-weight: 600;
      background: var(--primary, #6366f1); color: #fff; border: none; cursor: pointer;
      transition: all 0.2s; white-space: nowrap; text-align: center;
    }
    .btn-action:hover { background: #4f46e5; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35); }
    .btn-action-secondary {
      padding: 8px 16px; border-radius: 8px; font-size: 0.85rem; font-weight: 600;
      background: rgba(255, 255, 255, 0.08); color: var(--text-primary); border: 1px solid var(--border-color);
      cursor: pointer; transition: all 0.2s; white-space: nowrap; text-align: center;
    }
    .btn-action-secondary:hover:not(:disabled) { background: rgba(255, 255, 255, 0.15); }
    .granted-indicator {
      font-size: 0.88rem; font-weight: 600; color: #34d399; padding: 6px 14px;
      background: rgba(16, 185, 129, 0.15); border-radius: 999px; border: 1px solid rgba(16, 185, 129, 0.3);
      white-space: nowrap;
    }
    .notif-granted-container { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
    .test-notif-buttons { display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
    .btn-test-notif {
      padding: 6px 12px; border-radius: 6px; font-size: 0.8rem; font-weight: 600;
      background: rgba(99, 102, 241, 0.15); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.35);
      cursor: pointer; transition: all 0.2s; white-space: nowrap;
    }
    .btn-test-notif:hover { background: rgba(99, 102, 241, 0.3); color: #fff; }
    .btn-test-notif-secondary {
      padding: 6px 12px; border-radius: 6px; font-size: 0.8rem; font-weight: 600;
      background: rgba(245, 158, 11, 0.12); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3);
      cursor: pointer; transition: all 0.2s; white-space: nowrap;
    }
    .btn-test-notif-secondary:hover { background: rgba(245, 158, 11, 0.25); color: #fff; }
    .test-feedback-alert {
      margin-top: 10px; font-size: 0.82rem; color: #a5b4fc; background: rgba(99, 102, 241, 0.1);
      padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(99, 102, 241, 0.25); animation: fadeIn 0.2s ease;
    }
    .status-badge {
      padding: 4px 12px; border-radius: var(--radius-full); font-size: 0.8rem; font-weight: 600;
      background: rgba(255, 255, 255, 0.08); color: var(--text-secondary);
    }
    .status-badge.success {
      background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3);
    }
    .status-badge.syncing {
      background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3);
    }
    .status-badge.danger {
      background: rgba(244, 63, 94, 0.15); color: #fb7185; border: 1px solid rgba(244, 63, 94, 0.3);
    }
    .version-badge {
      font-family: monospace; font-size: 0.95rem; font-weight: 700; padding: 6px 14px;
      border-radius: var(--radius-sm); background: rgba(99, 102, 241, 0.15); color: #a5b4fc;
      border: 1px solid rgba(99, 102, 241, 0.3);
    }
    .danger-zone {
      border-color: rgba(244, 63, 94, 0.25); background: rgba(244, 63, 94, 0.03);
    }
    .danger-title { color: #fb7185 !important; }
    .btn-danger {
      padding: 9px 20px; border-radius: var(--radius-md); font-size: 0.88rem; font-weight: 700;
      background: rgba(244, 63, 94, 0.15); color: #fb7185; border: 1px solid rgba(244, 63, 94, 0.3);
      cursor: pointer; transition: all 0.2s; white-space: nowrap;
    }
    .btn-danger:hover { background: rgba(244, 63, 94, 0.28); color: #fff; }
    .alert-success {
      padding: 14px 20px; border-radius: var(--radius-md); background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.3); color: #34d399; font-size: 0.92rem;
      display: flex; justify-content: space-between; align-items: center; gap: 12px;
    }
    .btn-close-alert { color: #34d399; font-size: 1.1rem; cursor: pointer; border: none; background: none; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class ConfiguracionComponent implements OnInit {
  readonly notifService = inject(NotificacionService);
  readonly temaService = inject(TemaService);
  readonly pwaUpdateService = inject(PwaUpdateService);
  readonly authService = inject(AuthService);
  readonly syncService = inject(FirestoreSyncService);
  readonly firebaseService = inject(FirebaseService);
  private readonly router = inject(Router);

  private readonly appInitService = inject(AppInitService);
  private readonly inboxService = inject(InboxService);
  private readonly notaService = inject(NotaService);
  private readonly tareaService = inject(TareaService);
  private readonly eventoService = inject(EventoService);
  private readonly espacioService = inject(EspacioService);
  private readonly recordatorioService = inject(RecordatorioService);

  readonly isPwaInstalled = signal(false);
  readonly mostrarModalBorrado = signal(false);
  readonly mensajeExitoBorrado = signal(false);
  readonly mensajePruebaNotif = signal<string | null>(null);

  readonly mostrarConfigFirebase = signal(false);
  readonly mensajeConfigFirebase = signal<string | null>(null);

  firebaseConfigForm: FirebaseConfig = {
    apiKey: '',
    authDomain: '',
    projectId: '',
    appId: ''
  };

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      this.isPwaInstalled.set(isStandalone);
      this.notifService.actualizarEstadoPermiso();
    }

    // Inicializar formulario con la config actual
    const cfg = this.firebaseService.currentConfig();
    this.firebaseConfigForm = { ...cfg };
  }

  getSyncStatusLabel(): string {
    switch (this.syncService.syncStatus()) {
      case 'synced': return '✅ Sincronizado';
      case 'syncing': return '🔄 Sincronizando...';
      case 'offline': return '📴 Sin conexión (Offline)';
      case 'error': return '⚠️ Error de sincronización';
      case 'idle': return '⏳ Listo';
    }
  }

  formatearTiempoRelativo(isoDate: string | null): string {
    if (!isoDate) return 'Aún no sincronizado';
    const diffMs = Date.now() - new Date(isoDate).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Hace instantes';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `Hace ${diffMin} min`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `Hace ${diffHours} h`;
    return new Date(isoDate).toLocaleDateString() + ' ' + new Date(isoDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  async onSincronizar(): Promise<void> {
    await this.syncService.syncAll();
  }

  async onCerrarSesion(): Promise<void> {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }

  onIrALogin(): void {
    this.router.navigate(['/login']);
  }

  guardarConfigFirebase(): void {
    const ok = this.firebaseService.saveCustomConfig(this.firebaseConfigForm);
    if (ok) {
      this.mensajeConfigFirebase.set('✅ Configuración de Firebase guardada con éxito.');
      setTimeout(() => this.mensajeConfigFirebase.set(null), 4000);
    } else {
      this.mensajeConfigFirebase.set('❌ Error al aplicar configuración.');
    }
  }

  restaurarDefaultFirebase(): void {
    this.firebaseService.resetToDefaultConfig();
    this.firebaseConfigForm = { ...this.firebaseService.currentConfig() };
    this.mensajeConfigFirebase.set('↺ Configuración restaurada a valores por defecto.');
    setTimeout(() => this.mensajeConfigFirebase.set(null), 4000);
  }

  onSeleccionarTema(tema: TemaVisual): void {
    this.temaService.setTema(tema);
  }

  getPermisoLabel(permiso: EstadoPermiso): string {
    switch (permiso) {
      case 'granted': return '🟢 Concedido';
      case 'denied': return '🔴 Denegado';
      case 'default': return '🟡 Pendiente / No solicitado';
      case 'no-soportado': return '⚪ No soportado';
    }
  }

  async onSolicitarPermiso(): Promise<void> {
    await this.notifService.solicitarPermisoConExplicacion();
  }

  async onProbarNotificacionInmediata(): Promise<void> {
    const emitida = await this.notifService.enviarNotificacionPrueba();
    if (emitida) {
      this.mensajePruebaNotif.set('⚡ Notificación de prueba emitida con éxito. Revisa el centro de notificaciones de tu sistema.');
    } else {
      this.mensajePruebaNotif.set('⚠️ No se pudo emitir la notificación. Verifica permisos del navegador o sistema.');
    }
    setTimeout(() => this.mensajePruebaNotif.set(null), 6000);
  }

  async onProbarNotificacionSegundoPlano(): Promise<void> {
    await this.notifService.programarPruebaEnSegundoPlano(5);
    this.mensajePruebaNotif.set('⏱️ Alerta programada en 5 segundos. ¡Minimiza o cambia de pestaña ahora!');
    setTimeout(() => this.mensajePruebaNotif.set(null), 8000);
  }

  async onComprobarActualizaciones(): Promise<void> {
    await this.pwaUpdateService.comprobarActualizacion();
  }

  abrirModalBorrado(): void {
    this.mostrarModalBorrado.set(true);
  }

  cerrarModalBorrado(): void {
    this.mostrarModalBorrado.set(false);
  }

  async ejecutarBorradoTotal(): Promise<void> {
    this.cerrarModalBorrado();
    await this.appInitService.borrarTodoYReiniciar();

    // Recargar estado reactivo de todos los servicios
    await Promise.all([
      this.inboxService.refresh(),
      this.notaService.refresh(),
      this.tareaService.refresh(),
      this.eventoService.cargarEventos(),
      this.espacioService.loadAll(),
      this.recordatorioService.loadAll()
    ]);

    this.mensajeExitoBorrado.set(true);
  }
}
