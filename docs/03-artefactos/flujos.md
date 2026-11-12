# Artefactos · Backoffice Intranet Pixel

Borrador visual de pantallas validado en la sesión (5 módulos: Banner, Menús, Noticias, Calendario, Herramientas). Aquí se congelan los flujos y estados.

## Mapa de módulos
```mermaid
flowchart TD
  L[Login admin] --> H[Backoffice]
  H --> B[Banner<br/>imagen + textos]
  H --> M[Menús<br/>superior + accesos rápidos]
  H --> N[Noticias<br/>2 destacadas]
  H --> C[Calendario<br/>eventos públicos]
  H --> T[Herramientas<br/>categorías + links]
  B & M & N & C & T --> DB[(Supabase)]
  DB --> I[Intranet pública]
```

## Estados de una noticia
```mermaid
stateDiagram-v2
  [*] --> Borrador
  Borrador --> Publicada: Publicar
  Publicada --> Borrador: Despublicar
  Publicada --> Destacada: Destacar (cupo 1 o 2)
  Destacada --> Publicada: Quitar destacada
  Destacada --> Publicada: Reemplazada por otra
  Publicada --> [*]: Borrar
  Borrador --> [*]: Borrar
```

## Flujo: destacar una noticia
```mermaid
flowchart TD
  A[Admin pulsa estrella] --> B{¿Está publicada?}
  B -- No --> X[Aviso: publícala primero]
  B -- Sí --> C{¿Hay cupo? menos de 2}
  C -- Sí --> D[Se destaca en el cupo libre]
  C -- No --> E[Pregunta: ¿cuál reemplaza?]
  E --> F[Se intercambian · operación única en BD]
  D & F --> G[La intranet muestra las 2 destacadas]
```

## Flujo: evento en el calendario
```mermaid
flowchart TD
  A[Admin crea evento] --> B{Tipo}
  B -- Cumpleaños --> C[Nombre + día y mes · se repite cada año]
  B -- Reunión / Capacitación / Otro --> D[Título + fecha + hora opcional + descripción]
  C & D --> E[(events)]
  E --> F[Intranet: ícono sobre el día]
  F --> G[Puntero encima: muestra de quién / qué es]
```

## Reglas visibles en pantalla
- Menús: 1 nivel de submenú; el destino puede ser enlace, ancla o (luego) página interna.
- Banner sin imagen → fondo de píxeles.
- Noticias en borrador no se pueden destacar.
- Íconos de herramientas: catálogo cerrado (incluye torta y personas para calendario).
