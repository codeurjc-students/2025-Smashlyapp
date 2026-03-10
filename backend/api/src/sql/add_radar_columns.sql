-- ============================================================
-- MIGRACIÓN: Añadir columnas de métricas radar a la tabla rackets
--
-- INSTRUCCIONES: Copia y pega este SQL en el Editor SQL de Supabase.
-- Tras ejecutarlo, ejecuta el script populate-radar-metrics.ts para
-- rellenar los valores de todas las palas del catálogo.
-- ============================================================

-- 1. Añadir columnas de métricas radar (valores 0-10 con 1 decimal)
ALTER TABLE rackets
  ADD COLUMN IF NOT EXISTS radar_potencia     NUMERIC(4,1),
  ADD COLUMN IF NOT EXISTS radar_control      NUMERIC(4,1),
  ADD COLUMN IF NOT EXISTS radar_manejabilidad NUMERIC(4,1),
  ADD COLUMN IF NOT EXISTS radar_punto_dulce  NUMERIC(4,1),
  ADD COLUMN IF NOT EXISTS radar_salida_bola  NUMERIC(4,1);

-- 2. Añadir comentarios descriptivos para documentar el schema
COMMENT ON COLUMN rackets.radar_potencia      IS 'Métrica de potencia calculada (0-10). Derivada de forma, balance y dureza.';
COMMENT ON COLUMN rackets.radar_control       IS 'Métrica de control calculada (0-10). Derivada de forma, balance y dureza.';
COMMENT ON COLUMN rackets.radar_manejabilidad IS 'Métrica de manejabilidad calculada (0-10). Derivada de forma, balance y peso.';
COMMENT ON COLUMN rackets.radar_punto_dulce   IS 'Tamaño del punto dulce (0-10). Derivado de forma: redonda=alto, diamante=bajo.';
COMMENT ON COLUMN rackets.radar_salida_bola   IS 'Salida de bola (0-10). Derivada de dureza: blanda=alta, dura=baja.';

-- 3. Verificación: muestra cuántas filas tiene la tabla
SELECT COUNT(*) AS total_rackets FROM rackets;
