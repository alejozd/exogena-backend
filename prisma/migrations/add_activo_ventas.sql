-- Migración: Agregar campo activo a la tabla ventas
-- Control por año: una venta (licencia) puede estar activa para 2024 pero inactiva para 2025.
-- Ejecutar: mysql -u USUARIO -p exogenadb < prisma/migrations/add_activo_ventas.sql

ALTER TABLE `ventas`
ADD COLUMN `activo` TINYINT(1) DEFAULT 1 AFTER `estado_pago`,
ADD KEY `idx_venta_activo` (`activo`);

-- Las ventas existentes quedan activas por defecto (1)
