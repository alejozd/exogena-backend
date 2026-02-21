-- Migración: Agregar campo serial_recibido a la tabla activaciones
-- Ejecutar manualmente: mysql -u USUARIO -p exogenadb < prisma/migrations/add_serial_recibido_activaciones.sql

ALTER TABLE `activaciones`
ADD COLUMN `serial_recibido` VARCHAR(500) NULL AFTER `venta_id`;
