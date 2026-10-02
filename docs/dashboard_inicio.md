# 🧠 Documentación de Arquitectura: Dashboard de Inicio (T-10.1, T-10.2 & R-18)

> **Proyecto**: MindDump MVP  
> **Arquitectura**: Angular 18 + Ionic PWA (Local-First)  
> **Módulo**: Inicio / Dashboard Principal (`InicioComponent`)  
> **Tareas**: T-10.1 (Resumen de Información & Modales), T-10.2 (Accesos Rápidos)  
> **Regla de Alcance**: **R-18 ✅** — Inbox Reciente limitado a exactamente las últimas N=5 capturas.

---

## 🏛️ 1. Propósito Arquitectónico del Dashboard

El componente `InicioComponent` (`src/app/components/inicio/inicio.component.ts`) actúa como el centro de mando y resumen ejecutivo del "Segundo Cerebro". Su objetivo es permitir al usuario:

1. Evaluar de un vistazo su carga mental actual (Inbox sin organizar, tareas activas urgentes, próximos eventos).
2. Acceder rápidamente mediante enlaces con contadores actualizados a las 4 áreas nucleares del sistema (T-10.2).
3. Inspeccionar, completar, editar, reprogramar, eliminar o convertir cualquier elemento directamente desde el dashboard mediante modales integrados, sin necesidad de navegar a otras pantallas (T-10.1).

---

## 🧭 2. Secciones del Dashboard

### 2.1 Accesos Rápidos (T-10.2)

Ubicada en la parte superior, presenta una cuadrícula de 4 tarjetas con diseño *glassmorphism*:

| Acceso Rápido | Identificador | Indicador en Tiempo Real | Destino |
| :--- | :--- | :--- | :--- |
| **Inbox** | `#quicklink-inbox` | Número de capturas pendientes de organizar (`inboxService.totalPendientes()`) | `/inbox` |
| **Notas** | `#quicklink-notas` | Conteo total de notas almacenadas en el sistema | `/notas` |
| **Tareas** | `#quicklink-tareas` | Conteo de tareas en estado *Pendiente* o *En progreso* | `/tareas` |
| **Eventos** | `#quicklink-eventos` | Conteo de próximos eventos programados desde hoy en adelante | `/eventos` |

### 2.2 Tareas Activas (T-10.1)

Filtrado reactivo mediante signals y `computed`:
- **Condición de Inclusión**: Tareas con estado `Pendiente` o `En progreso` (las tareas `Completada` o `Cancelada` se omiten automáticamente).
- **Algoritmo de Priorización y Ordenamiento**:
  1. **Nivel de Prioridad**: `Urgente` (peso 1) > `Normal` (peso 2) > `Baja` (peso 3).
  2. **Fecha Límite**: Tareas con fecha límite más próxima se ubican primero; tareas sin fecha límite van al final de su grupo de prioridad.
  3. **Fecha de Creación**: Empates se desempatan por la fecha de creación más reciente.
- **Interacción**: Al pulsar una tarjeta (`#dashboard-tarea-item-<id>`), se abre `app-tarea-detalle-modal`.
- **Acciones Disponibles**:
  - Marcar como completada o cambiar estado (`cambiarEstadoTarea`).
  - Editar campos de la tarea en `app-tarea-modal` (`guardarTareaEditada`).
  - Eliminar la tarea (`eliminarTarea`).

### 2.3 Próximos Eventos (T-10.1)

- **Condición de Inclusión**: Eventos cuya `fechaInicio` sea mayor o igual al inicio del día actual (`00:00:00`).
- **Ordenamiento**: Cronológico estricto ascendente por `fechaInicio`.
- **Interacción**: Al pulsar una tarjeta (`#dashboard-evento-item-<id>`), se abre `app-evento-detalle-modal`.
- **Acciones Disponibles**:
  - Exportar evento a formato `.ics` para sincronización con calendarios externos (T-09.2 / R-17).
  - Editar evento en `app-evento-modal` (`guardarEventoEditado`).
  - Eliminar evento (`eliminarEvento`).

### 2.4 Inbox Reciente (T-10.1 & Regla R-18)

- **Regla R-18 (N=5)**: Muestra exclusivamente las **últimas 5 capturas** del Inbox pendientes de procesar (`organizado === false`), ordenadas por `fechaCreacion` descendente.
- **Contador Dinámico**: Header con formato `X / 5`.
- **Interacción**: Al pulsar sobre la tarjeta o el botón *🔄 Organizar* (`#dashboard-inbox-item-<id>`), se despliega `app-inbox-convert-modal`.
- **Acciones Disponibles**:
  - Convertir captura en una **Nota** (`convertirCapturaANota`).
  - Convertir captura en una **Tarea** (`convertirCapturaATarea`).
  - El elemento se marca como `organizado: true` inmediatamente y desaparece del resumen.

---

## 🧪 3. Matriz de Validación de Pruebas Unitarias

El archivo `inicio.component.spec.ts` cuenta con cobertura completa de los requerimientos:

| Escenario de Prueba | Requerimiento | ID de Elemento / Método |
| :--- | :---: | :--- |
| Enlaces visibles con contadores | T-10.2 | `#quicklink-inbox`, `#quicklink-notas`, `#quicklink-tareas`, `#quicklink-eventos` |
| Exactamente 5 capturas más recientes de Inbox | T-10.1 & R-18 | `capturasInboxRecientes()` length === 5 |
| Estado vacío cuando Inbox está despejado | T-10.1 | `#empty-inbox` |
| Apertura de modal de organización de Inbox | T-10.1 | `isConvertInboxModalOpen === true` |
| Filtrado y ordenación por prioridad y fecha límite | T-10.1 | `tareasPendientes()` |
| Apertura de modal de detalle de tarea | T-10.1 | `isDetalleTareaModalOpen === true` |
| Filtrado cronológico de eventos futuros | T-10.1 | `proximosEventos()` |
| Apertura de modal de detalle de evento | T-10.1 | `isDetalleEventoModalOpen === true` |
| Cambio de estado de tarea desde modal | T-10.1 | `cambiarEstadoTarea()` |
| Edición y persistencia de tarea | T-10.1 | `guardarTareaEditada()` |
| Eliminación de tarea | T-10.1 | `eliminarTarea()` |
| Edición y persistencia de evento | T-10.1 | `guardarEventoEditado()` |
| Eliminación de evento | T-10.1 | `eliminarEvento()` |
| Conversión de captura a Nota | T-10.1 | `convertirCapturaANota()` |
| Conversión de captura a Tarea | T-10.1 | `convertirCapturaATarea()` |
