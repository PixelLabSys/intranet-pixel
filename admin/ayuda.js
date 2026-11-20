/* Contenido del módulo Ayuda del backoffice: novedades y manual.
   Para anunciar algo nuevo: agrega una entrada AL INICIO de `novedades` con un id mayor que el anterior
   (formato AAAA-MM-DD-n) y sube ?v= de ayuda.js en admin/index.html. Al abrir Ayuda se apaga el círculo rojo. */
window.PX_AYUDA = {
  novedades: [
    { id: '2026-11-20-6', fecha: '2026-11-20', titulo: 'Noticias más largas y con párrafos',
      items: ['El texto de una noticia ahora admite hasta 1800 caracteres y saltos de línea con Enter (puedes usar negrita para los subtítulos).', 'En la intranet la tarjeta muestra un resumen y la noticia completa se abre con un clic.'] },
    { id: '2026-11-20-5', fecha: '2026-11-20', titulo: 'Las noticias se abren completas en la intranet',
      items: ['Al hacer clic en una noticia o anuncio de la intranet se abre una ventana con la imagen y el texto completos. Se cierra con la X, con Esc o haciendo clic fuera.'] },
    { id: '2026-11-20-4', fecha: '2026-11-20', titulo: 'Centro de ayuda',
      items: ['Nuevo módulo Ayuda al final del menú: aquí ves las novedades de la plataforma y el manual de uso.', 'Cuando haya novedades sin leer verás un círculo rojo con su cantidad junto a Ayuda.'] },
    { id: '2026-11-20-3', fecha: '2026-11-20', titulo: 'La intranet ahora pide entrar con Google',
      items: ['Solo ven la intranet los correos @pixel-g.com, @pxl-g.com y los correos individuales que agregues en Accesos.', 'Nuevo módulo Accesos: agrega o quita dominios y correos (por ejemplo un Gmail) sin tocar código.', 'Ya no existe una copia pública de la intranet: si el servidor no responde, se muestra un aviso para reintentar.', 'Arriba a la derecha de la intranet aparece tu foto, nombre y correo, y el botón Salir.'] },
    { id: '2026-11-20-2', fecha: '2026-11-20', titulo: 'Agregar administradores es mucho más fácil',
      items: ['En Administradores solo escribes el correo y pulsas Agregar. No se envía ningún mensaje ni hay que crear contraseña.', 'La persona entra con "Continuar con Google" usando ese correo.', 'Ya no se pide verificación en dos pasos.'] },
    { id: '2026-11-20-1', fecha: '2026-11-20', titulo: 'Texto con formato en vivo',
      items: ['En el banner y en las noticias escribes directamente y ves cómo queda. Selecciona el texto y elige Ligero, Normal o Negrita, y el color. Ya no hay códigos.'] },
    { id: '2026-11-20-0', fecha: '2026-11-20', titulo: 'Mejoras del backoffice',
      items: ['Tu foto de Google aparece abajo a la izquierda, sobre tu correo.', 'El tema claro/oscuro ahora es un interruptor con sol y luna.', 'La barra lateral queda siempre visible completa, sin scroll.', 'Calendario: nuevos emojis de barco, lancha, ferri (para el planchón), velero y canoa en Viajes y transporte.'] },
    { id: '2026-11-12-1', fecha: '2026-11-12', titulo: 'Lanzamiento del backoffice',
      items: ['Módulos: Banner, Menús, Noticias, Calendario y Herramientas, además de Administradores.', 'Editor de imágenes con Zoom, Alto y arrastre; calendario con emoji por evento; versión cómoda para celular.'] }
  ],

  manual: [
    { t: 'Entrar al backoffice', p: [
      'Abre la dirección del backoffice y pulsa "Continuar con Google". Entra con el mismo correo con que te agregaron como administrador.',
      'Si aparece "Sin acceso", esa cuenta no es administradora: pídele a otro administrador que te agregue en Administradores.',
      'Por seguridad, la sesión se cierra sola tras 30 minutos sin actividad. Para salir tú mismo usa "Cerrar sesión" abajo a la izquierda.',
      'Arriba de "Cerrar sesión" está el interruptor del tema: sol para modo claro, luna para modo oscuro.'] },
    { t: 'Banner (portada de la intranet)', p: [
      'Imagen: sube un JPG, PNG o WebP. Se abre un editor donde ajustas el Zoom, el Alto del banner y arrastras la imagen para encuadrarla. Pulsa "Usar esta imagen". Con "Reencuadrar la actual" vuelves a ajustar la que ya está, y con "Quitar imagen" regresa el fondo de píxeles.',
      'Textos: hay tres (línea superior pequeña, título y texto). Escribe sobre el propio recuadro y verás cómo queda. Para dar formato, selecciona el texto y elige Ligero, Normal o Negrita, y un color de la paleta de la marca. El color "automático" es el que se adapta al modo claro u oscuro.',
      'Nada se publica hasta que pulsas "Guardar textos" (la imagen se guarda al usarla). Si el texto excede el largo permitido, el sistema te avisa.'] },
    { t: 'Menús', p: [
      'Hay dos zonas: Menú superior (junto al logo) y Accesos rápidos (la barra bajo el banner).',
      'Con "+ Agregar elemento" creas uno. Elige su tipo: sección de la página, enlace a una dirección web (https:// o mailto:) o una herramienta de la lista.',
      'Las flechas suben y bajan el orden; el lápiz edita; la papelera elimina. Un elemento puede ocultarse sin borrarlo. El menú superior admite un solo nivel de submenús.'] },
    { t: 'Noticias', p: [
      'Con "+ Nueva noticia" escribes título y texto (con formato en vivo; el texto admite párrafos con Enter y hasta 1800 caracteres), eliges categoría y fecha, y subes una imagen que encuadras con Zoom y Alto.',
      'El estado Borrador no se ve en la intranet; Publicada sí.',
      'La intranet muestra solo 2 noticias: las Destacadas. En "Destacadas en la intranet" eliges cuáles son. Solo se pueden destacar noticias publicadas, y si despublicas una destacada, el cupo queda libre.'] },
    { t: 'Calendario', p: [
      'Tiene eventos (reunión, capacitación, otro) y cumpleaños. Se agregan con "+ Nuevo evento" y "+ Nuevo cumpleaños".',
      'Cada uno puede llevar un emoji, que reemplaza el número del día en el calendario de la intranet. Elige uno del selector por grupos (hay más de 150, incluidos los de Navidad y transporte) o pega otro. "Usar el del tipo" vuelve al emoji por defecto.',
      'Los cumpleaños se guardan sin año. Un evento en estado oculto no se muestra en la intranet.'] },
    { t: 'Herramientas', p: [
      'Las herramientas se agrupan en categorías, que son las pestañas de la sección "Nuestras herramientas".',
      'Crea o renombra categorías, y dentro de cada una agrega herramientas con nombre, ícono y enlace (debe empezar por https://). Se pueden ordenar con las flechas, ocultar o eliminar.',
      'Una categoría con herramientas no se puede eliminar: primero mueve o elimina sus herramientas.'] },
    { t: 'Accesos: quién puede ver la intranet', p: [
      'La intranet pide entrar con Google. Entra quien tenga un correo de los dominios de la lista (hoy pixel-g.com y pxl-g.com) o esté en la lista de correos individuales (por ejemplo un Gmail).',
      'Agrega o quita en cada lista con "Agregar" y "Quitar". No se admiten dominios públicos como gmail.com o hotmail.com: para esas personas usa correos individuales.',
      'Al quitar a alguien, puede seguir viendo la intranet hasta 1 hora, mientras dure su sesión abierta.',
      'Los administradores siempre pueden entrar, estén o no en las listas.'] },
    { t: 'Administradores', p: [
      'Para agregar a alguien escribe su correo (Google o de la empresa) y pulsa Agregar. No recibe ningún mensaje: solo entra con "Continuar con Google" usando ese correo.',
      '"Quitar acceso" le retira el permiso de administrar. No puedes quitarte a ti mismo ni dejar la plataforma sin administradores.',
      'Mientras la app de Google esté en modo de prueba, la persona también debe estar en la lista de usuarios de prueba de Google Cloud; si ya está publicada, no hace falta.'] },
    { t: 'Problemas frecuentes', p: [
      'No veo un cambio en la intranet: recarga con Cmd+Shift+R (Ctrl+Shift+R en Windows). Las páginas se guardan en el navegador y a veces tardan un minuto en actualizar.',
      'Aparece "Otra persona modificó…": alguien más editó lo mismo antes que tú. Recarga la página y vuelve a hacer tu cambio.',
      '"Esa cuenta no está autorizada" al entrar con Google: ese correo no es de un dominio permitido ni está en la lista. Agrégalo en Accesos (intranet) o en Administradores (backoffice).',
      'Una imagen no se sube: debe ser JPG, PNG o WebP y pesar menos de 3 MB.'] }
  ]
};
