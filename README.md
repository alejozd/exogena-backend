# Exógena Backend 🚀

Sistema de gestión para la generación de reportes de información exógena. Este backend maneja la autenticación, administración de clientes, vendedores, seriales de software ERP, ventas y recaudos.

## 🛠️ Tecnologías utilizadas

* **Node.js & Express**: Entorno de ejecución y framework web.
* **Prisma ORM**: Mapeo de base de datos relacional.
* **MySQL**: Base de datos principal.
* **JWT (JSON Web Token)**: Autenticación segura.
* **Bcryptjs**: Cifrado de contraseñas.
* **Morgan & Helmet**: Seguridad y logs de peticiones.

## 📋 Requisitos previos

* Node.js (v18 o superior)
* MySQL 8.0+
* npm o yarn

## 🚀 Instalación y Configuración

1.  **Clonar el repositorio:**
    ```bash
    git clone [https://github.com/TU_USUARIO/exogena-backend.git](https://github.com/TU_USUARIO/exogena-backend.git)
    cd exogena-backend
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

3.  **Configurar variables de entorno:**
    Copia el archivo `.env.example` a `.env` y rellena tus datos reales:
    ```bash
    cp .env.example .env
    ```

4.  **Configurar la base de datos:**
    ```bash
    npx prisma generate
    ```

5.  **Iniciar el servidor:**
    ```bash
    npm run dev
    ```

## 🛣️ Endpoints Principales

### Autenticación
* `POST /api/auth/login`: Iniciar sesión y obtener token.

### Gestión
* `/api/clientes`: CRUD de clientes (incluye seriales y vendedores).
* `/api/vendedores`: CRUD de fuerza de ventas.
* `/api/seriales`: Gestión de licencias de software ERP.
* `/api/ventas`: Registro de ventas y estados financieros.
* `/api/pagos`: Control de recaudos y saldos.

## 🔐 Seguridad
Todas las rutas de gestión están protegidas por un middleware de autenticación. Es necesario incluir el token en los headers:
`Authorization: Bearer <tu_token>`

---
Desarrollado con ❤️ para la gestión contable.