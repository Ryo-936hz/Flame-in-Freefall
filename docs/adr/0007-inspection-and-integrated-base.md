# ADR 0007 — Base integrada y límites de los datos inspeccionados

Aceptado por P1 para esta implementación, 2026-11-14.

## Evidencia antes de programar

El remoto fue consultado mediante conector GitHub y `git ls-remote`: público,
size=0, sin refs ni commits. No existía el destino local; se clonó sin sustituir
archivos y se creó `codex/integrated-skeleton`. Los 52 archivos documentales se
compararon por ruta/hash antes de copiar. El paquete original permanece intacto
en `NASA/FlameLab_Contexto_Codex/FlameLab_Contexto`.

P2 inspeccionó `datasets_lujan.zip` (130464918 bytes): 24 investigaciones,
22 CSV, 27 PDF, 48 TXT ISA, 24 ZIP de metadatos, 2 DOC y ningún vídeo. BASS-II
contiene ensayos nominales y ajustes Fan/Air que no se convierten automáticamente
a velocidad física. Su PDF contiene una tabla candidata de tasas y mesetas.
Saffire II mezcla notas, magnitudes y una columna de propagación mal rotulada.
El inventario completo y sus hashes se entregan en `docs/DATA_INSPECTION.md` y
`data/catalog/zip_inventory.json`. Documents se lee sin modificarlo.

## Decisiones

- El catálogo real conserva metadatos y localizadores; no genera observaciones
  revisadas. El recorrido numérico usa exclusivamente fixtures sintéticos.
- Se implementa contrato 1.0 sin forzar magnitudes ambiguas en `other` ni
  interpretar cada meseta como una réplica. La ingesta de mesetas reales exige
  una futura revisión coordinada con condición por observación e identidad del
  ensayo padre. No hay comparación cuantitativa NASA acreditada en esta base.
- `ResearchRequest` mantiene filtros explícitos como autoridad. El coordinador
  es un flujo Python acotado, sin LangGraph: todavía no necesita grafos dinámicos
  ni un segundo motor. El proveedor externo solo sintetiza resultados calculados.
- SQLite usa SQLAlchemy y migraciones Alembic; PostgreSQL queda preparado por
  la misma capa y configuración opcional. pgvector no está poblado ni validado.
- Gower usa rangos de escala fijos versionados, sin interpretación probabilística;
  `vary` no penaliza distancia. Comparación estratifica investigación y condiciones.
- No se publica remoto automáticamente: la entrega deja un commit y un bundle
  Git transportable para los seis puestos. Publicación coordinada pendiente.

## Consecuencias

Esta base permite desarrollar conexiones y contratos sin convertir fuentes
ambiguas en resultados científicos. P2/P3 deben revisar unidad experimental,
unidades y licencia antes de integrar una serie real. P5/P6 mantienen la dirección
visual en DESIGN_ANDURIL; la interfaz entregada es un arnés técnico.
