# Hechos decisiones e incógnitas

Actualización local: 14 de noviembre de 2026. Cada afirmación nueva debe indicar su categoría y fuente. No conviertas una decisión de diseño en un hecho científico.

## Confirmado por la petición del usuario

- Equipo de seis personas, Los TTS.
- Repositorio compartido: `https://github.com/Ryo-936hz/Flame-in-Freefall`.
- Trabajo mediante asistentes de IA en clones/ramas individuales.
- Objetivo inicial: documentación, esqueleto integrado y reparto de tareas; después, cierre e integración de la demo.
- La propuesta final aportada en DOCX guía el producto.
- La dirección visual sigue una inspiración estética de sistemas de Anduril; el host P5/P6 ya está integrado.
- El usuario informó de un ZIP en `C:\Users\user\Desktop\NASA\Documents`.

## Instrucción vigente

El usuario ha pedido fusionar la PR #3 e integrar la demo con P2. La PR ya se
fusionó en `main` como `0b732cb`. El cierre adicional de catálogo, métricas y
contraste Saffire está implementado y verificado localmente en `raul`, código
`20aab80404fc2f0fc188d718cac47d0d4bf31d54`; el cierre se entrega mediante la PR #4 sobre `main`.
[Guía de integración](INTEGRATION_P2_MAIN.md) y [pruebas por SHA](VERIFICATION.md).
La referencia común para nuevas ramas es `origin/main`; las existentes integran
esa base mediante merge. El avance posterior AskSI/CSS de P5 sigue en su propia rama.

La reconstrucción P2 anterior en `lujan`, la fase limitada a documentación y la
entrega exclusivamente local pertenecen al historial. `team-start-v1` y etiquetas
P6 se conservan sin mover; no se usan para deshacer avances. Documents permanece intacto.

## Observado en la implementación local

- El paquete estaba en `NASA/FlameLab_Contexto_Codex/FlameLab_Contexto`; se integró tras comparar rutas y hashes, conservando el original.
- `datasets_lujan.zip` fue inspeccionado sin ejecutar su contenido ni modificar Documents: 24 investigaciones, 22 CSV, 27 PDF, 48 TXT ISA, 24 ZIP de metadatos, 2 DOC y ningún vídeo. Inventario, hashes y límites en [DATA_INSPECTION](DATA_INSPECTION.md).
- BASS-II Table 5.1 has now been extracted into a canonical local bundle: 20 tests, 43 conditions, 39 known rates and four missing rates. The scientific status is `unverified`. Initial/final oxygen are distinct test-level fields; intermediate oxygen remains unmeasured. Source discrepancies and review requirements are retained.
- `data/catalog/psi_metadata.json` es un catálogo de 24 estudios de metadatos. El bundle completo P2 incorpora 2.265 evidencias, 1.058 registros y 1.673 observaciones, con 1.283 valores conocidos. Son artefactos distintos. El fixture demo separado contiene 2 estudios, 5 ensayos y 6 observaciones sintéticas.
- P3 aprobó descriptivamente diez puntos BASS-II de siete muestras; el paquete P2 1.1.1 añade dos avisos M8 a las evidencias y corrige el caso lunar. La conformidad no cambia `scientific_unverified` ni resuelve las discrepancias del corpus global. Ver [dictamen](handoffs/P3_BASS_II_DECISION_DEMO.md).
- Saffire tiene un contraste documental revisado de escala/configuración con discrepancias explícitas. No hay una comparación numérica aprobada con BASS-II. Ver [contexto Saffire](P2_SAFFIRE_CONTEXT.md).
- Hay API, contratos canónicos, persistencia con snapshots, CLI, ciencia, coordinación determinista e interfaz P5/P6. SQLite local y PostgreSQL 17 en CI tienen ejecuciones registradas, junto a Windows/Linux y navegador. Las pruebas concretas pertenecen a su SHA en [VERIFICATION](VERIFICATION.md); los mocks del proveedor no son llamadas reales ni evaluación científica.

## Historia de la preparación documental

- Antes del clonado inicial se comprobó que el repositorio público estaba vacío y que no existía `NASA/Flame-in-Freefall`; se creó `codex/integrated-skeleton`. Es un dato histórico, no el estado actual de GitHub.

- La preparación se hizo en un entorno Linux remoto, sin acceso montado al disco Windows indicado.
- En aquel entorno el ZIP local no estaba adjunto ni accesible. La inspección local posterior se registra arriba.
- El remoto se observó vacío; ese dato se volvió a comprobar antes del clonado local.
- La entrega histórica no contenía resultados de pruebas del esqueleto. Las verificaciones posteriores con fixtures validan software, no hallazgos de NASA.

## Confirmado por fuentes documentales

- El reto plantea resumir, ordenar e interpretar investigaciones de combustión de PSI en un dashboard con SI.
- BASS-II estudia condiciones que incluyen concentración de oxígeno, ventilación y características del combustible.
- La escala y configuración deben revisarse al relacionar resultados BASS/Saffire.
- El enunciado indica ausencia actual de datos de combustión en gravedad parcial en PSI; no afirma que no exista investigación externa sobre el tema.

Enlaces y precisión del alcance en [SOURCES](SOURCES.md).

## Decisiones del proyecto

- Contrato Pydantic ejecutable como autoridad; OpenAPI y tipos derivados de la API.
- Monorepo con Python/FastAPI y React/TypeScript.
- Modo de desarrollo sin credenciales externas y modo IA configurable.
- Fixtures sintéticos identificados; datos reales separados.
- Comparabilidad, similitud y cobertura explícitas.
- Investigación por herramientas, con cálculos deterministas.
- Infraestructura sencilla antes de añadir servicios equivalentes.

## Pendiente de comprobar

| Incógnita | Responsable | Cómo se resuelve |
|---|---|---|
| Calidad y licencia de cada fuente inventariada | P2 | Ampliar la revisión más allá del inventario de archivos. |
| Revisión BASS-II fuera de los diez puntos aprobados | P2 + P3 | Ampliar el dictamen con fuentes; mantener el aviso M8, O₂ por segmento sin medir y límites causales. |
| Comparación numérica Saffire/BASS-II | P2 + P3 | Resolver métricas y compatibilidad antes de mezclar campañas; el contraste documental ya está definido. |
| Independencia fuera de las muestras identificadas | P3 | Revisar por campaña; varios segmentos u observaciones del mismo ensayo no crean réplicas. |
| Acceso a un modelo externo y presupuesto | P4 + P1 | Configuración de servidor y prueba acotada autorizada. |
| Nombres y usuarios de las seis personas | Equipo | Asignar P1–P6 en una decisión de coordinación. |
| Tiempo local de pitch y entrega | Equipo | Confirmar con organización local. |
| Licencias de cada archivo | P2 | Registrar por fuente antes de redistribuir. |
| pgvector y uso vectorial | P1 | No implementados ni acreditados por PostgreSQL 17; requieren un incremento y pruebas específicos. |
| Estado de cada nueva CI | P1 | Consultar Actions y VERIFICATION; no inferir éxito por haber subido el workflow. |

## Regla para nuevos resultados

Anota si son observados, calculados, digitalizados, sintéticos, inferidos o ilustrativos. Registra origen, condiciones y limitaciones. Un nombre NASA en el título no acredita que una tabla sea auténtica ni que sus filas sean independientes.
