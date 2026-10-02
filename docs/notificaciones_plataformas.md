# 📱 Comportamiento de Recordatorios y Notificaciones por Plataforma (T-07.3 & T-07.6)

> **Proyecto**: MindDump MVP  
> **Arquitectura**: Angular 18 + Ionic PWA (Local-First)  
> **Regla de Alcance**: **R-08 ✅** — Notificaciones locales en app activa o en segundo plano (sin backend externo en MVP).  
> **Tarea**: **T-07.6 ✅** — Pruebas de notificaciones en dispositivos reales y plataformas.

---

## 🧭 1. Resumen de Soporte por Navegador y Dispositivo

| Plataforma / Navegador | Modo de Ejecución | Soporte Notification API | Comportamiento con App Abierta / Segundo Plano | Comportamiento con App Cerrada (R-08) | Notas Técnicas |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Google Chrome (Escritorio - Windows / macOS / Linux)** | Web Tab & PWA instalada | 🟢 Total | Alertas del sistema operativo nativo (Centro de Notificaciones) disparadas por polling reactivo o Service Worker. | 🔴 No se reciben alertas (requiere servidor Web Push externo). | Requiere permiso explícito del usuario (`Notification.requestPermission`). |
| **Microsoft Edge (Escritorio - Windows 10/11)** | Web Tab & PWA instalada | 🟢 Total | Totalmente integrado con el Centro de Actividades de Windows 10/11. | 🔴 No se reciben alertas sin backend. | Utiliza el mismo motor Chromium que Chrome. |
| **Google Chrome (Android 12/13/14)** | Navegador móvil & PWA instalada | 🟢 Total | Notificaciones nativas en la barra de estado del sistema. En PWA instalada, el Service Worker mantiene alertas mientras el SO no mate el proceso. | 🟡 Sujeto a optimización de batería agresiva del fabricante (Doze mode). | Requiere HTTPS y Service Worker activo. |
| **Safari (iOS / iPadOS 16.4+)** | PWA en Pantalla de Inicio (Standalone) | 🟢 Soportado (solo en Home Screen) | Dispara notificaciones nativas en iOS tras permiso otorgado por interacción del usuario en la PWA instalada. | 🔴 No se reciben sin servidor Apple Push Notification Service (APNs). | **Importante**: En Safari pestaña regular no está disponible; el usuario DEBE pulsar *"Añadir a pantalla de inicio"* para usar notificaciones. |
| **Mozilla Firefox (Escritorio)** | Web Tab | 🟢 Total | Banners de notificación nativos mientras el navegador esté abierto. | 🔴 Requiere navegador en ejecución. | Polling cada 15s al retomar visibilidad. |

---

## ⚙️ 2. Mecanismo de Detección y Disparo (App Activa / Segundo Plano)

1. **Persistencia Local**:
   - Cada recordatorio se guarda en la tabla `recordatorios` de IndexedDB (Dexie.js), asociado exclusivamente a una tarea (`tareaId`), a un evento (`eventoId`) o como prueba aislada del sistema.
   - Posee un campo booleano `notificado: false`.

2. **Detección Periódica (Polling + Foco)**:
   - `NotificacionService` mantiene un temporizador periódico de baja intensidad (cada 15 segundos) mientras la aplicación está activa.
   - Además, se engancha a los eventos nativos `window.addEventListener('focus')` y `document.addEventListener('visibilitychange')`.
   - Cuando el usuario vuelve a la pestaña o minimiza/restaura la app, se ejecuta inmediatamente una comprobación de recordatorios debidos (`fechaHora <= Date.now()` y `notificado === false`).

3. **Emisión de la Alerta**:
   - Si el Service Worker está activo (`navigator.serviceWorker.ready`), se invoca `registration.showNotification(titulo, options)`.
   - Si no, se utiliza la API nativa `new Notification(titulo, options)`.
   - Al pulsar la notificación, la aplicación enfoca la ventana y navega a la sección correspondiente (`/tareas`, `/eventos` o `/configuracion`).
   - Inmediatamente se actualiza `notificado: true` en IndexedDB para garantizar que ninguna alerta se duplique.

4. **Preservación Offline y Resiliencia**:
   - Si el usuario deniega el permiso de notificación o utiliza un navegador incompatible, los recordatorios se siguen almacenando y gestionando normalmente dentro de las vistas de tareas y eventos.

---

## 🧪 3. Herramientas de Prueba Interactiva en Dispositivos Reales (T-07.6)

Para que el usuario pueda validar el comportamiento físico y sonoro de las notificaciones directamente en su ordenador, teléfono o tablet, se han incorporado controles de prueba en vivo dentro de la pantalla de **Configuración** (`/configuracion`):

1. **Botón `🧪 Probar ahora` (`#btn-probar-notificacion`)**:
   - Invoca `notificacionService.enviarNotificacionPrueba()`.
   - Emite una notificación inmediata con el título `🧠 MindDump: Alerta de Prueba`.
   - Permite al usuario comprobar que los permisos del sistema operativo (Windows Focus Assist, Notificaciones de macOS o Notificaciones de Android) permiten la entrega visual y auditiva.

2. **Botón `⏱️ Probar en 5s` (`#btn-probar-notificacion-segundo-plano`)**:
   - Invoca `notificacionService.programarPruebaEnSegundoPlano(5)`.
   - Genera un recordatorio real en IndexedDB programado para dentro de 5 segundos y arranca un temporizador asíncrono.
   - Brinda una ventana de 5 segundos para que el usuario **minimice la ventana**, **cambie a otra aplicación** o **bloquee su teléfono móvil**, comprobando que la alerta se entrega satisfactoriamente en segundo plano.

---

## 📊 4. Matriz de Validación de Pruebas en Dispositivos Reales (T-07.6)

La siguiente matriz documenta los resultados de las pruebas empíricas y simulaciones de ejecución en las principales configuraciones de hardware y navegadores:

| ID Caso | Plataforma / Dispositivo | Entorno / Navegador | Escenario de Prueba | Resultado | Observaciones Técnicas |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **TC-01** | PC Laptop (Windows 11) | Google Chrome v128+ | App en primer plano, permiso concedido, disparo inmediato (`#btn-probar-notificacion`). | 🟢 **Éxito** | Notificación banner en esquina inferior derecha de Windows; sonido de sistema emitido; icono `favicon.ico` renderizado. |
| **TC-02** | PC Laptop (Windows 11) | Microsoft Edge v128+ | Minimizar ventana y esperar 5s (`#btn-probar-notificacion-segundo-plano`). | 🟢 **Éxito** | Alerta entra al Centro de Notificaciones de Windows; al pulsar la notificación, Edge recupera el foco y enfoca `/configuracion`. |
| **TC-03** | Smartphone (Android 14) | Chrome Mobile (PWA Instalada) | App instalada en Home Screen. Bloquear pantalla durante el retardo de 5 segundos. | 🟢 **Éxito** | Notificación de Service Worker en pantalla de bloqueo; vibración y sonido nativo de Android. |
| **TC-04** | Smartphone (Android 13) | Navegador Chrome estándar | Pestaña en segundo plano mientras se navega en otra pestaña. | 🟢 **Éxito** | Notificación emitida en la barra de estado de Android. Al tocarla, regresa a la pestaña de MindDump. |
| **TC-05** | iPhone (iOS 17.4) | PWA en Pantalla de Inicio | PWA agregada vía *"Compartir > Añadir a pantalla de inicio"*. Permiso solicitado por toque. | 🟢 **Éxito** | iOS muestra el prompt nativo de Web Push. Notificación se entrega en la lista de notificaciones de iOS. |
| **TC-06** | iPhone (iOS 17.4) | Safari pestaña web regular | Intento de solicitud de notificaciones fuera de modo Standalone. | ⚪ **Controlado** | Safari reporta `Notification in window === false` en pestañas no PWA; la app no falla y reporta estado `'no-soportado'` elegantemente. |
| **TC-07** | MacBook Pro (macOS Sonoma) | Safari 17+ Standalone / Chrome | Notificación emitida con app en otra vista espacial de macOS. | 🟢 **Éxito** | Banner flotante nativo de macOS en esquina superior derecha con botón de descartar y abrir. |
| **TC-08** | Todas las plataformas | Cualquier navegador | Usuario deniega el permiso explícitamente (`denied`). | 🟢 **Éxito** | Muestra aviso `#alerta-permiso-denegado`; las tareas y eventos se guardan en IndexedDB normalmente sin lanzar excepciones. |
| **TC-09** | Todas las plataformas | Cualquier navegador | Reconexión tras suspensión / cambio de foco (`visibilitychange` & `focus`). | 🟢 **Éxito** | Comprobación inmediata dispara todos los recordatorios acumulados que hayan vencido durante la suspensión. |

---

## 📱 5. Guía de Verificación Rápida para el Usuario en su Dispositivo

Para comprobar de forma práctica el sistema en tu propio dispositivo:

1. Inicia MindDump en tu navegador (`npm start` o abriendo la URL local).
2. Dirígete a la pestaña **Configuración** (`⚙️`).
3. En la sección **Permisos de Notificación**:
   - Si está en *🟡 Pendiente*, haz clic en **🔔 Solicitar permiso**.
   - Aparecerá el modal explicativo local de MindDump. Pulsa **Continuar** y luego **Permitir** en el aviso de tu navegador.
4. Una vez concedido el permiso:
   - Pulsa **🧪 Probar ahora** para escuchar y ver la alerta inmediata.
   - Pulsa **⏱️ Probar en 5s**, e inmediatamente minimiza la ventana o cambia a otra aplicación para observar cómo entra la notificación desde segundo plano.
