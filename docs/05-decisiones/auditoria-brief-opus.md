# Brief para la auditoría adversarial (Fase 4.5) — ejecutar con Claude Opus

**Rol:** auditor adversarial independiente. Tu trabajo es **encontrar problemas**, no confirmar que está bien. No redactaste esta solución.

**Proyecto:** Backoffice de la Intranet Pixel (nivel TRAZA: Modular). Intranet pública en GitHub Pages leyendo de Supabase; backoffice en `/admin/` con login de varios administradores.

**Lee, en este orden:**
1. `docs/00-encuadre/oportunidad.md`
2. `docs/01-prd/prd-general.md`
3. `docs/02-sdd/arquitectura.md` y `docs/02-sdd/modelo-datos.md`
4. `docs/03-artefactos/flujos.md`
5. `docs/05-decisiones/tension.md` (hallazgos ya conocidos y sus resoluciones)
6. `index.html` (intranet actual, para ver qué se va a conectar)

**Busca específicamente:**
- Agujeros de seguridad en RLS/Storage/Auth (¿qué puede hacer un visitante anónimo? ¿un admin comprometido?).
- Contradicciones entre PRD, SDD y artefactos.
- Reglas de negocio ambiguas o que se rompen en casos borde (destacadas, menús anidados, eventos anuales, 29-feb, zonas horarias).
- Requisitos sin criterio de aceptación comprobable.
- Riesgos no registrados (privacidad/Habeas Data, límites del plan gratuito, dependencia de un solo servicio).
- Qué se asumió sin confirmar (ver "Supuestos" en `modelo-datos.md`).

**Formato de salida:** tabla `# | Severidad (crítico/alto/medio/bajo) | Hallazgo | Evidencia (archivo y sección) | Corrección propuesta`, y al final un veredicto: *Sin críticos abiertos* o *Bloqueado: lista de críticos*.

**No hagas:** no escribas código, no reescribas los documentos, no suavices hallazgos.
