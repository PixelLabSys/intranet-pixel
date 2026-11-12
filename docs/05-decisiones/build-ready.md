# Fase 5 · Alistamiento — decisión Build Ready

**Fecha:** 2026-11-12 · **Nivel:** Modular · **Responsable de aceptar:** Alejandro Morales

## Checklist
| Criterio | Estado |
|---|---|
| Problema y usuario definidos | ✔ `00-encuadre` |
| Alcance del ciclo y exclusiones | ✔ PRD (páginas internas, login de pixeludos, comentarios fuera) |
| Reglas, roles, permisos, estados | ✔ SDD + Enmiendas v2 |
| Datos e integraciones | ✔ modelo de datos, Supabase, Edge Function `invite_admin` |
| Flujos validados | ✔ borrador interactivo validado por Alejo + Mermaid |
| Errores, vacíos, excepciones | ✔ tensión (15) + auditoría (24) |
| Criterios de aceptación comprobables | ✔ `04-construccion/criterios-aceptacion.md` |
| Estrategia de pruebas | ✔ `04-construccion/plan-pruebas.md` |
| Riesgos críticos resueltos o aceptados | ✔ críticos resueltos por diseño; **R-HD aceptado** por Alejo |
| Documentación sin contradicciones | ✔ Enmiendas v2 prevalecen; ver nota |
| Auditoría Opus pre-código | ✔ ejecutada (agente independiente) |
| Sin críticos abiertos / altos sin decisión | ✔ #1 y #2 resueltos; #8 aceptado. **Nota:** las resoluciones no fueron re-auditadas por Opus (decisión de Alejo de seguir). Las pruebas del Corte 0 las verifican en la práctica. |
| Responsable de aceptación | ✔ Alejo |

## Nota de consistencia
PRD/SDD/flujos originales conservan texto previo (p. ej. `event_date` en cumpleaños, hover como única interacción). Las **Enmiendas v2** de `modelo-datos.md` prevalecen; no se reescribieron para dejar traza.

## Decisión
**GO condicionado** para Corte 0 y Corte 1, pendiente de dos entradas externas (no de diseño):
1. URL y clave `anon` del proyecto Supabase.
2. Correos de los administradores iniciales (≥ 2).
Sin ellas se puede preparar todo el SQL y el código, pero no ejecutarlo ni probarlo contra un proyecto real.

**Registro de aprobación:** Alejo aprobó "Go, a construir" (Cortes 0 y 1) el 2026-11-12.
