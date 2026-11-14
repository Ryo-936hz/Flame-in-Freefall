# Fixtures exclusivamente sintéticos

`demo.json` contiene dos estudios ficticios, cinco ensayos y seis observaciones para
probar conexiones. Todos los IDs comienzan por `synthetic:` y toda la procedencia es
`synthetic`. No son mediciones NASA, simulación física ni evidencia de seguridad.

- `synthetic:trial-1/2/3`: flujo 2/5/10 cm/s, material ficticio `demo_polymer`, hoja,
  flujo opuesto, microgravedad y otras condiciones conocidas coincidentes.
- El ensayo 1 tiene dos observaciones del mismo ensayo/unidad: no son réplicas.
- El ensayo 4 usa otra geometría y gravedad; incluye cero conocido como caso técnico.
- El ensayo 5 tiene flujo/gravedad ausentes y observación `not_measured` con valor nulo.

Los originales y unidades de las condiciones se conservan en cada ConditionValue;
el texto de Evidence identifica los números inventados y el localizador del fixture.
Las fuentes sintéticas no contienen URLs NASA. Los consumidores deben activar
`allow_synthetic=true` explícitamente; el servidor solo siembra esta demo si se activa
su configuración de semilla o se importa por CLI.

```powershell
.\.venv\Scripts\python.exe -m flamelab.data.cli validate data/fixtures/demo.json
.\.venv\Scripts\python.exe -m flamelab.data.cli import data/fixtures/demo.json
```

Repetir la importación idéntica es idempotente. Para sustituir un corpus distinto,
añadir `--replace` de manera explícita. Las investigaciones ya guardadas conservan
su snapshot de datos; no se reescriben sus resultados durante una importación.
