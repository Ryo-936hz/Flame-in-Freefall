# Estructura del repositorio y fronteras futuras

La base compartida implementa dominio, API, datos, ciencia, IA, persistencia y cliente
técnico. Las fronteras del frontend de producto y evaluación científica siguen
preparadas. El estado está en [IMPLEMENTATION_STATUS](IMPLEMENTATION_STATUS.md), las
verificaciones en [VERIFICATION](VERIFICATION.md), y el arranque desde GitHub en
[TEAM_START](TEAM_START.md).

## Carpetas del equipo Windows

| Ruta local | Uso | Conservación |
|---|---|---|
| `C:/Users/user/Desktop/NASA/FlameLab_Contexto_Codex/FlameLab_Contexto` | Paquete documental original, ya integrado por comparación. | Conservar como referencia histórica. |
| `C:/Users/user/Desktop/NASA/Flame-in-Freefall` | Clon del repositorio compartido y desarrollo. | Revisar cualquier contenido existente antes de clonar. |
| `C:/Users/user/Desktop/NASA/Documents` | ZIP y archivos originales informados por el usuario. | Conservar intactos; no mover ni publicar automáticamente. |

Los Markdown se copiaron al clon tras comparar contenido. Las futuras actualizaciones deben conservar cambios locales y revisar diferencias; no volver a copiar ciegamente la documentación histórica encima de la implementación.

## Directorios de la aplicación

| Ruta relativa al clon | Propósito y estado | Propietario | Revisión |
|---|---|---|---|
| `apps/api/src/flamelab/domain/` | Modelos de dominio y contratos canónicos Pydantic. | P1 | Productores y consumidores afectados. |
| `apps/api/src/flamelab/config.py`, `main.py` | Configuración, ensamblaje y aplicación ASGI. | P1 | P4 para proveedor; P5 para acceso cliente. |
| `apps/api/src/flamelab/main.py` | Rutas HTTP, validación de entrada y errores; todavía no se separan en `routes/`. | P1 | Responsable del servicio. |
| `apps/api/src/flamelab/storage/` | Repositorio, sesiones y persistencia. | P1 | P2. |
| `apps/api/src/flamelab/data/` | Ingesta, normalización, validación y CLI local. | P2 | P3. |
| `apps/api/src/flamelab/science/` | Profiling, elegibilidad, ranking y comparación. | P3 | P2 y P4. |
| `apps/api/src/flamelab/ai/` | Flujo, herramientas permitidas, adaptadores y revisión. | P4 | P3 y P5. |
| `apps/api/alembic/` | Migraciones y revisiones del esquema. | P1 | P2. |
| `apps/api/tests/` | Pruebas de módulos e integración. | Responsable del módulo | P1 coordina fixtures compartidos. |
| `apps/web/src/lib/` | Cliente API tipado y utilidades de integración. | P5 | P1. |
| `apps/web/src/features/evidence/` | Frontera documentada para Evidence Canvas futuro. | P5 | P3 y P6. |
| `apps/web/src/features/mission-lab/` | Frontera documentada para Mission Lab futuro. | P6 | P5 y P3. |
| `apps/web/src/App.tsx` y componentes comunes | Composición, estados y estilos compartidos. | P5 | P6; P1 para conexión. |
| `packages/contracts/` | OpenAPI y tipos TypeScript generados. | P1 | P5; nadie edita generados a mano. |
| `data/catalog/` | Metadatos y referencias públicas. | P2 | P3. |
| `data/fixtures/` | Corpus sintético pequeño y explícito. | P2 | P3 y P1. |
| `data/raw/`, `data/processed/` | Destinos locales previstos/excluidos; no contienen una serie NASA publicada. | P2 | P1 para exclusiones. |
| `evals/` | Frontera futura para consultas científicas etiquetadas; no confundir pruebas software con evaluación científica independiente. | P6 coordina | P3 evalúa ciencia y P4 IA. |
| `scripts/` | Preparación, desarrollo, generación y verificación. | P1 | Consumidor del script. |
| `.github/workflows/` | Workflow configurado; ejecución remota pendiente. | P1 | Responsables de pruebas. |
| `docs/` | Producto, decisiones, contexto y relevos. | Autor del cambio | Responsable del área. |

Las migraciones están en `apps/api/alembic/` y las pruebas Python en `apps/api/tests/`. Evidence Canvas y Mission Lab solo contienen sus fronteras: el arnés de App no constituye el frontend final. `work/`, `.venv/` y dependencias instaladas son locales y quedan fuera de Git.

## Archivos raíz implementados

`pyproject.toml`, `uv.lock`, `package.json`, `package-lock.json`, `.env.example`, `.gitignore`, `alembic.ini` y `compose.yaml` están presentes. P1 coordina cambios compartidos. Compose prepara PostgreSQL/pgvector; no demuestra que ese motor se haya ejecutado. Una dependencia nueva se incorpora una sola vez y se verifica con sus consumidores.

## Dirección de dependencias

El dominio no depende de rutas, IA ni UI. Ciencia consume modelos y datos; no depende de un proveedor LLM. IA llama a herramientas controladas y devuelve contratos. Las rutas ensamblan servicios y almacenamiento. El cliente consume la API y componentes permitidos. Los generados proceden de la API, nunca al revés.

No colocar reglas de elegibilidad exclusivamente en React ni duplicar cálculos en un prompt. No introducir acceso directo desde el navegador a la base o al proveedor de IA.

## Fronteras compartidas

P6 monta su experiencia a través de un punto acordado con P5, sin editar simultáneamente App o estilos globales. P4 solicita cambios de panel a P1/P5 mediante contratos, sin emitir código libre. P2 solicita cambios de modelo a P1 al detectar datos no representados. P3 acuerda semántica de unidades y grupos con P2 antes de alterar cálculos.

El árbol real y el contrato ejecutable son la descripción de implementación. Si cambia una frontera, actualizar esta tabla y los paquetes afectados, conservando el registro de decisiones.
