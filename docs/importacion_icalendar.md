# 📅 Documentación de Validación iCalendar (.ics) (T-09.1 & R-17)

> **Proyecto**: MindDump MVP  
> **Estándar**: RFC 5545 (Internet Calendaring and Scheduling Core Object Specification)  
> **Librería npm**: `ics` (v3.12.0)  
> **Regla de Alcance**: **R-17 ✅** — Validación de importación en al menos dos plataformas principales (Google Calendar web, Microsoft Outlook web, Apple Calendar).

---

## 🛠️ Especificación Técnica RFC 5545 Generada por MindDump

Los archivos generados por `IcsService` contienen:

```ics
BEGIN:VCALENDAR
VERSION:2.0
CALSCALE:GREGORIAN
PRODID:minddump/icalendar/v1.0
METHOD:PUBLISH
X-PUBLISHED-TTL:PT1H
BEGIN:VEVENT
UID:[UUID-V4]
SUMMARY:[Título del evento]
DTSTAMP:[Timestamp UTC de generación]
DTSTART:[Fecha/Hora UTC de inicio]
DTEND:[Fecha/Hora UTC de fin]
DESCRIPTION:[Descripción con escape estándar de saltos de línea \n]
CATEGORIES:[Categoría asignada]
END:VEVENT
END:VCALENDAR
```

---

## 🧪 Matriz de Validación de Importación (R-17)

| Plataforma / Cliente | Tipo de Prueba | Resultado | Observaciones de Compatibilidad |
| :--- | :--- | :---: | :--- |
| **Google Calendar (Web)** | Importación vía `Configuración > Importar y exportar > Seleccionar archivo del ordenador` | 🟢 **Éxito (Válido)** | Lee correctamente título, fecha de inicio y fin en zona horaria local del usuario, descripción multilínea y categoría. |
| **Microsoft Outlook (Web / M365)** | Importación vía `Agregar calendario > Cargar desde archivo (.ics)` | 🟢 **Éxito (Válido)** | Importa el evento a la agenda personal con horarios exactos, preservando tildes (`á, é, í, ó, ú`) y eñes (`ñ`). |
| **Apple Calendar (macOS / iOS)** | Apertura directa de archivo descargado `.ics` en navegador móvil o Safari | 🟢 **Éxito (Válido)** | Abre la hoja nativa de iOS / macOS *"Añadir a Calendario"*, mostrando el bloque de tiempo sugerido y descripción. |

---

## 📱 Experiencia en Dispositivos Móviles (PWA)

Al pulsar el botón **"Exportar al calendario (.ics)"** en `EventoDetalleModalComponent`:
1. El navegador genera el Blob con tipo MIME `text/calendar;charset=utf-8`.
2. En Android e iOS, el sistema operativo reconoce la extensión `.ics` y ofrece abrir el archivo inmediatamente con la aplicación de calendario predeterminada (Google Calendar o Apple Calendar), permitiendo guardar el evento en la agenda local con un solo toque.
