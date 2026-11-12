/* Configuración pública (la clave "anon" es pública por diseño; la seguridad la dan las políticas RLS).
   NUNCA pongas aquí la clave service_role. */
(function () {
  var local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  window.PX_CONFIG = local
    ? { // Supabase local de desarrollo (claves de demostración públicas del CLI)
        url: 'http://127.0.0.1:56321',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
      }
    : { // Producción: completar cuando exista el proyecto Supabase. Vacío = la intranet usa el respaldo.
        url: '',
        anonKey: ''
      };
})();
