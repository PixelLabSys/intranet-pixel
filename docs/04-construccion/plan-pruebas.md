# Plan de pruebas
1. **Seguridad (SQL):** suite en `supabase/tests/` ejecutada como `anon`, `authenticated` no-admin y admin; se corre en cada corte y antes de cada publicación.
2. **Entrada hostil:** payloads `javascript:`, `"><img onerror>`, URLs con espacios/tabs, SVG con script, archivo de 20 MB.
3. **Funcional por corte:** los criterios de `criterios-aceptacion.md`, ejecutados en navegador (escritorio y móvil, claro y oscuro).
4. **Resiliencia:** Supabase simulado caído, lento (> 4 s) y respondiendo `[]`.
5. **Concurrencia:** dos sesiones de admin destacando el mismo cupo.
6. **Regresión visual:** la intranet con Supabase se ve igual que la v1 estática (mismo Design System v2).
7. **Aceptación:** Alejo recorre cada corte y firma antes de pasar al siguiente.
