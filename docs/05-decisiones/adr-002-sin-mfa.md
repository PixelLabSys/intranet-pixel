# ADR-002 — Se elimina la verificación en dos pasos (MFA) del backoffice

**Fecha:** 2026-11-20 · **Decide:** Alejo (producto)

**Contexto.** La SDD exigía sesión aal2 (contraseña + TOTP) para escribir. En el uso real agregaba un paso que Alejo consideró engorroso para un backoffice interno con pocos administradores.

**Decisión.** `public.can_write()` pasa a ser `is_admin()` (migración `20261112000005_sin_mfa.sql`). El backoffice ya no pide ni inscribe TOTP.

**Consecuencias.** Un administrador queda protegido solo por su contraseña (mínimo 12 caracteres, registro público cerrado, invitaciones solo desde el backoffice). Riesgo aceptado: si se filtra una contraseña de administrador, se puede modificar el contenido de la intranet. Mitigación: contraseñas únicas y fuertes, quitar de inmediato a quien salga de la empresa, tabla `audit_log` para rastrear cambios. Reversible: restaurar la exigencia `aal = 'aal2'` en `can_write()` y reactivar el flujo MFA del frontend.

**Orden de despliegue.** Primero la función en la base de datos (si no, el backoffice nuevo no podría escribir), después publicar el frontend.
