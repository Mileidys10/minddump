# ⚙️ Documentación de Arquitectura: Configuración y Privacidad PWA (T-11.1 & T-11.2)

> **Proyecto**: MindDump MVP  
> **Arquitectura**: Angular 18 + Ionic PWA (Local-First)  
> **Módulo**: Configuración del Sistema (`ConfiguracionComponent`)  
> **Tareas**: T-11.1 (Tema Visual, Permisos, Versión, Borrado Total), T-11.2 (PWA Updates con Service Worker)  
> **Reglas Clave**: **R-08 ✅** (Notificaciones locales sin backend), **T-01.4 ✅** (Espacio 'Útiles' indestructible).

---

## 🏛️ 1. Propósito Arquitectónico

La pantalla de Configuración (`src/app/components/configuracion/configuracion.component.ts`) centraliza las preferencias de la aplicación, el diagnóstico del entorno PWA y la gobernanza estricta de datos almacenados localmente en IndexedDB.

---

## 🧭 2. Secciones del Sistema

### 2.1 Tema Visual (T-11.1)

- **Modos Soportados**: `dark` (Modo Oscuro, predeterminado) y `light` (Modo Claro).
- **Servicio Responsable**: `TemaService` (`src/app/services/tema.service.ts`).
- **Persistencia**: Se almacena en `localStorage` bajo la clave `minddump_theme`.
- **Detección Automática**: Si no existe preferencia previa, consulta `window.matchMedia('(prefers-color-scheme: light)')`.
- **Aplicación Global**: Modifica el atributo `data-theme` en `document.documentElement` (`<html data-theme="light">`), alternando dinámicamente el conjunto de tokens CSS en `styles.scss`.
- **Selectores de UI**: `#btn-tema-oscuro` y `#btn-tema-claro` con clase `.active` reactiva.

### 2.2 Permisos de Notificación (T-07.2 / T-11.1 / Regla R-08)

- **Cumplimiento de R-08**: Alertas locales en app abierta o segundo plano activo sin infraestructura de servidor remoto.
- **Estados de Permiso**:
  - `default` / `prompt`: Indicador *🟡 Pendiente*. Muestra el botón `#btn-solicitar-permiso-notif`.
  - `granted`: Indicador *🟢 Concedido* y mensaje `#indicator-alertas-activadas` (*✔️ Alertas activadas*).
  - `denied`: Indicador *🔴 Denegado* y alerta explicativa `#alerta-permiso-denegado` indicando cómo activarlo en la configuración del navegador.
- **Modal Explicativo Previo**: `app-permiso-notificacion-modal` informa al usuario sobre el uso local de las notificaciones antes de invocar la API nativa `Notification.requestPermission()`.

### 2.3 Estado de la Aplicación PWA y Diagnóstico (T-11.1)

- **Badge de Estado**: `#badge-estado-pwa`.
- **Detección**:
  - `window.matchMedia('(display-mode: standalone)').matches` o `(navigator as any).standalone`.
  - Diferencia si se ejecuta como aplicación de escritorio/móvil instalada o como pestaña web estándar.
- **Información de Versión**: `#badge-version-app` con versión fija `v1.0.0-mvp`, declarando la versión estable y el stack tecnológico.

### 2.4 Actualizaciones PWA (T-11.2)

- **Servicio Responsable**: `PwaUpdateService` (`src/app/services/pwa-update.service.ts`).
- **Integración con Angular Service Worker**: Consume `SwUpdate` de `@angular/service-worker`.
- **Ciclo de Detección**:
  - Escucha el flujo reactivo `versionUpdates` filtrando por el evento `VERSION_READY`.
  - Activa la signal `nuevaVersionDisponible: true`.
- **Banner Flotante de Actualización**:
  - Implementado en `PwaUpdateBannerComponent` (`app-pwa-update-banner`), accesible globalmente en el shell (`app.html`).
  - Botón **Actualizar ahora** (`#btn-pwa-actualizar`): Invoca `swUpdate.activateUpdate()` y recarga la página.
  - Botón **Posponer** (`#btn-pwa-posponer`): Oculta el banner sin interrumpir la sesión actual del usuario (`pospuesto: true`).
- **Comprobación Manual**: Botón `#btn-comprobar-actualizaciones` en la sección PWA, que invoca `swUpdate.checkForUpdate()` y refleja el estado de carga (*Comprobando...*).

### 2.5 Zona de Peligro & Borrado Total de Datos (T-11.1 & T-01.4)

- **Sección**: `#section-borrar-datos` con botón de activación `#btn-reset-data`.
- **Modal de Doble Confirmación**: `BorrarDatosModalComponent` (`app-borrar-datos-modal`):
  - **Paso 1**: Advertencia detallada de los 6 tipos de entidades que serán purgadas de IndexedDB (inbox, notas, tareas, eventos, recordatorios, espacios). Botón `#btn-continuar-paso-2`.
  - **Paso 2**:
    1. Checkbox obligatorio `#confirm-checkbox`: *"Comprendo que todos mis datos serán eliminados permanentemente..."*.
    2. Input de texto `#input-borrar-confirm`: El usuario debe teclear explícitamente la palabra `BORRAR` (insensible a mayúsculas/minúsculas).
    3. Botón final `#btn-confirmar-borrado-definitivo`: Deshabilitado por defecto; solo se activa cuando se cumplen ambas condiciones.
- **Ejecución del Borrado (`AppInitService.borrarTodoYReiniciar()`)**:
  1. Purga completa de las tablas Dexie: `espacios`, `inbox`, `notas`, `tareas`, `eventos`, `recordatorios`.
  2. Regeneración inmediata del espacio de sistema indestructible **Útiles** (`esSistema: true`, color `#6366f1`).
  3. Recarga sincronizada de todos los servicios activos (`inboxService.refresh()`, `notaService.refresh()`, `tareaService.refresh()`, `eventoService.cargarEventos()`, `espacioService.loadAll()`, `recordatorioService.loadAll()`).
  4. Despliegue del aviso de éxito `#alert-borrado-exitoso`.

---

## 🧪 3. Matriz de Cobertura de Pruebas Unitarias

| Suite de Pruebas | Archivo | Requerimientos Verificados |
| :--- | :--- | :--- |
| `ConfiguracionComponent` | `configuracion.component.spec.ts` | Separación visual de 5 secciones, cambio de tema, permisos notif, versión/PWA, apertura de modal borrado, borrado total con recarga de servicios. |
| `TemaService` | `tema.service.spec.ts` | Inicialización, toggle de tema, atributos DOM `data-theme`, sincronización en `localStorage`. |
| `BorrarDatosModalComponent` | `borrar-datos-modal.component.spec.ts` | Flujo de paso 1 a 2, validación de checkbox y palabra "BORRAR", emisión de eventos confirmado/cancelado y reinicio de estado. |
| `PwaUpdateService` | `pwa-update.service.spec.ts` | Escucha de `VERSION_READY`, métodos `comprobarActualizacion()`, `actualizar()` y `posponer()`. |
| `PwaUpdateBannerComponent` | `pwa-update-banner.component.spec.ts` | Renderizado condicional, botón actualizar, botón posponer, ocultamiento al posponer. |
| `AppInitService` | `init.service.spec.ts` | `borrarTodoYReiniciar()` vacía todas las tablas y regenera el espacio indestructible `Útiles`. |
