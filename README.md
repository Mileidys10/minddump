# MindDump MVP 🧠

> **Aplicación PWA de "Segundo Cerebro"** desarrollada en Angular + TypeScript con persistencia local en IndexedDB mediante Dexie.js.

---

## 🏛️ Arquitectura del Sistema

El proyecto implementa una arquitectura desacoplada en 4 capas:

```
[ Componentes (UI / Presentación) ]
               ↓
[ Servicios (Lógica de Negocio / Reglas de Dominio) ]
               ↓
[ Repositorios (Acceso a Datos / Contratos) ]
               ↓
[ Persistencia Local (Dexie.js / IndexedDB) ]
```

### Estructura de Directorios (`src/app/`)

- `components/`: Componentes visuales y pantallas (Inbox, Espacios, Notas, Tareas, Eventos, Búsqueda, Configuración).
- `services/`: Lógica de negocio, orquestación de inicialización (`init.service.ts`), reglas de espacios indestructibles.
- `repositories/`: Adaptadores de acceso a base de datos sobre Dexie.js.
- `models/`: Interfaces y modelos de dominio en TypeScript.
- `shared/`: Componentes reutilizables, utilitarios, pipes y directivas.

---

## 🚀 Requisitos Previos

- **Node.js**: v20+ o v22+
- **NPM**: v10+
- **Angular CLI**: v20+ (`npm install -g @angular/cli`)

---

## 📦 Instalación

1. Clona o abre el repositorio en tu máquina:
   ```bash
   cd minddump
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

---

## 💻 Ejecución en Desarrollo

Para arrancar el servidor de desarrollo local:

```bash
npm start
# o
ng serve
```

Navega en tu navegador a `http://localhost:4200/`. La aplicación se recargará automáticamente ante cualquier cambio de código.

---

## 🏗️ Compilación para Producción

Para generar el bundle optimizado para producción con Service Worker PWA habilitado:

```bash
npm run build
# o
ng build
```

Los artefactos compilados se almacenarán en la carpeta `dist/minddump`.

---

## 🔍 Linting y Calidad de Código

Para ejecutar el análisis estático con ESLint:

```bash
npm run lint
```

Para ejecutar las pruebas unitarias:

```bash
npm test
```
