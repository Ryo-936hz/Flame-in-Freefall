# Decisiones de arquitectura

Cada ADR conserva contexto, decisión y consecuencias. Los cambios estructurales se coordinan con P1 y los consumidores.

Los ADR 0001–0006 nacieron como decisiones de diseño. La implementación local del 14 de noviembre de
2026 se concreta en ADR 0007, con catálogo real de metadatos, fixtures separados, flujo Python acotado y
entrega local. Ningún ADR acredita por sí solo una prueba, publicación o validación científica; consultar
IMPLEMENTATION_STATUS y VERIFICATION.

- [0001 Contratos canónicos y monorepo](0001-canonical-contracts.md)
- [0002 SQLite local y camino PostgreSQL](0002-local-and-postgres.md)
- [0003 Modo de demostración y proveedor configurable](0003-ai-modes.md)
- [0004 Procedencia y separación de fixtures](0004-provenance.md)
- [0005 Compatibilidad antes de similitud](0005-scientific-ranking.md)
- [0006 Interfaz técnica antes del frontend de producto](0006-ui-skeleton.md)
- [0007 Inspección y base integrada local](0007-inspection-and-integrated-base.md)
- [0008 Successive conditions and local BASS-II import](0008-successive-conditions-and-bass-import.md)

Para una nueva decisión: siguiente número, fecha, estado, problema concreto, alternativas, decisión, consecuencias y rutas afectadas. Una preferencia de herramienta no necesita un ADR si no cambia una frontera o compromiso del sistema.
