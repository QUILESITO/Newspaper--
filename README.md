# Newspaper
App de noticias en español (PWA en GitHub Pages) con reparto de cobertura por orientación editorial del medio.

- `feeds.json`: fuentes (RSS de medios y búsquedas de Google News). `outlets.json`: medios admitidos y su etiqueta (L, CL, C, CR, R, N = deportes). Los medios que no están en la lista se descartan.
- `scripts/build.mjs`: lee las fuentes, agrupa titulares, genera `site/news.json` y envía avisos por ntfy (3+ medios) y el resumen de las 08:00 (Madrid).
- `public/`: web (`index.html`), lógica compartida y probada (`lib.mjs`), PWA (`manifest.json`, `sw.js`).
- `.github/workflows/News.yml`: ejecuta pruebas y build cada ~5-15 min y publica en Pages. Ajustes: Settings → Pages → Source = GitHub Actions; secreto opcional `NTFY_TOPIC`.
- Pruebas: `node --test` (agrupación, porcentajes, secciones cronológicas, pipeline con datos simulados).
- Tema: claro 07:00–20:00 y oscuro 20:00–07:00 (Madrid), con botón para forzarlo.

Límites conocidos: las URLs de RSS no están verificadas con tráfico real; las etiquetas de sesgo son orientativas; las noticias se conservan 48 h; sin resúmenes con IA, base de datos ni Web Push propio.
