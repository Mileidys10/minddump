# 🧠 MindDump — Capturador Cognitivo & Segundo Cerebro (Local-First PWA)

<p align="center">
  <img src="https://img.shields.io/badge/Angular-20.0-DD0031?style=for-the-badge&logo=angular&logoColor=white" alt="Angular 20" />
  <img src="https://img.shields.io/badge/Ionic-8.0-3880FF?style=for-the-badge&logo=ionic&logoColor=white" alt="Ionic 8" />
  <img src="https://img.shields.io/badge/IndexedDB-Dexie.js-007ACC?style=for-the-badge" alt="Dexie.js" />
  <img src="https://img.shields.io/badge/Local--First-100%25-10B981?style=for-the-badge" alt="Local First" />
  <img src="https://img.shields.io/badge/Firebase_Hosting-Live-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase Hosting" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/Estética-Quiet_Luxury-D4AF37?style=for-the-badge" alt="Quiet Luxury" />
  <img src="https://img.shields.io/badge/Licencia-MIT-F59E0B?style=for-the-badge" alt="MIT License" />
</p>

> **Aplicación Progresiva (PWA) de Alto Rendimiento tipo "Segundo Cerebro"** para captura instantánea de pensamientos, notas estructuradas y grabaciones de audio con persistencia reactiva en el cliente (IndexedDB vía Dexie.js), sincronización opcional a la nube y estética minimalista *Quiet Luxury* en modo oscuro.

* **Desarrolladora**: [Mileidys Agámez Ospino](https://github.com/Mileidys10) — Ingeniera de Software & Especialista Frontend/Móvil.
* **Aplicación en Vivo (Firebase Hosting)**: 👉 **[https://minddump-app-agamez.web.app](https://minddump-app-agamez.web.app)**

---

## 🏛️ Arquitectura del Sistema

El proyecto implementa una arquitectura desacoplada en 4 capas estrictas:

```
[ Componentes (UI / Presentación / Angular 20) ]
                       │
[ Servicios (Lógica de Negocio / Reglas de Dominio / Sincronización) ]
                       │
[ Repositorios (Acceso a Datos / Contratos de Repositorio) ]
                       │
[ Persistencia Local (Dexie.js / IndexedDB / Service Workers) ]
```

### Características Técnicas Principales:
* **Persistencia Local-First con Cero Latencia**: Almacenamiento local directo en IndexedDB mediante Dexie.js. La aplicación es completamente funcional sin conexión a internet.
* **Captura de Audio con Visualizador de Onda**: Grabación de notas de voz en el navegador con renderizado fluido de formas de onda en tiempo real.
* **Espacios Indestructibles & Organización**: Sistema de espacios de trabajo cognitivos protegidos contra eliminación accidental con ordenamiento inteligente.
* **Sincronización Bidireccional a la Nube**: Conexión con Firestore para respaldo opcional y sincronización multidispositivo con resolución determinista de conflictos.
* **Diseño Quiet Luxury**: Interfaz cuidada con paleta oscura (tonos obsidiana, titanio y acentos ámbar), tipografía moderna de alta legibilidad e iconografía vectorial SVG de trazo fino (sin emojis saturados).
* **PWA Instalable**: Soporte de Service Worker y Web App Manifest para instalación nativa en dispositivos móviles y de escritorio.

---

## 🐳 Despliegue con Docker (Nginx Alpine)

```bash
# 1. Clonar el repositorio
git clone https://github.com/Mileidys10/minddump.git
cd minddump

# 2. Iniciar con Docker Compose
docker compose up -d --build
```

* Aplicación disponible en `http://localhost:8080`.

---

## 💻 Ejecución Local en Desarrollo

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo Angular
npm start
```

---

## 📁 Estructura del Código (`src/app/`)

```text
src/app/
├── components/         # Pantallas principales (Inbox, Espacios, Notas, Tareas, Búsqueda, Configuración)
├── models/             # Interfaces de dominio TypeScript
├── repositories/       # Adaptadores de base de datos sobre Dexie.js
├── services/           # Lógica de dominio, orquestación de inicio y sincronización
└── shared/             # Componentes reutilizables, modales y layouts
```

---

## 📄 Licencia y Autoría

* **Autora**: Mileidys Agámez Ospino
* **GitHub**: [@Mileidys10](https://github.com/Mileidys10)
* **Licencia**: MIT
