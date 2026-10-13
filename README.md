# Gestión de Empresas

Aplicación web para gestionar empresas mediante operaciones CRUD (crear, consultar, actualizar y eliminar), desarrollada con Angular, Node.js, Express y SQLite.

## Tecnologías utilizadas

- **Frontend:** Angular y TypeScript.
- **Backend:** Node.js y Express.
- **Base de datos:** SQLite mediante `better-sqlite3`.
- **Comunicación:** API REST con JSON.

## Requisitos previos

- Node.js y npm instalados.
- Git, para clonar el repositorio.

## Instalación y ejecución

### 1. Clonar el repositorio

```bash
git clone https://github.com/DnacdJK/gestion-empresas.git
cd gestion-empresas
```

### 2. Configurar el backend

Desde la carpeta raíz del proyecto, ejecutar:

```bash
cd backend
npm install
npm start
```

La API estará disponible en:

`http://localhost:3000`

La base de datos SQLite se crea automáticamente en la carpeta `backend` cuando se inicia el servidor. Los datos se almacenan en el archivo `empresas.db`.

**Importante:** ese archivo es local y está excluido del repositorio. Los datos creados en una computadora no se incluyen al clonar el proyecto.

### 3. Configurar el frontend

Abrir una segunda terminal en la carpeta raíz del proyecto y ejecutar:

```bash
npm install
npm start
```

Angular estará disponible en:

`http://localhost:4200`

Mantener ambas terminales abiertas mientras se utiliza la aplicación.

## Operaciones de la API

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/empresas` | Consultar todas las empresas |
| GET | `/api/empresas/:id` | Consultar una empresa por ID |
| POST | `/api/empresas` | Registrar una empresa |
| PUT | `/api/empresas/:id` | Actualizar una empresa |
| DELETE | `/api/empresas/:id` | Eliminar una empresa |

La API valida los datos recibidos y devuelve respuestas HTTP según el resultado de las operaciones.

## Campos de la empresa

- Nombre comercial
- Razón social
- Teléfono
- Correo electrónico
- NIT
- Estado
- Dirección

## Persistencia

La aplicación utiliza SQLite para almacenar los registros localmente. Para un despliegue público, el backend debe ejecutarse en un servicio compatible y utilizar almacenamiento persistente para evitar la pérdida de datos.

## Ejecución local

Para utilizar la aplicación, iniciar primero el backend y después el frontend. Acceder desde el navegador a `http://localhost:4200`.

## Repositorio

https://github.com/DnacdJK/gestion-empresas