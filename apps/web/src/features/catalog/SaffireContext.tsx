import "./SaffireContext.css";

/** Documentary facts reviewed in docs/handoffs/P2_DEMO.md and P2_SAFFIRE_CONTEXT.md.
 * This card does not read, select or compare observations from the active corpus.
 */
export function SaffireContext() {
  return <section className="saffire-context" data-saffire-context aria-label="Saffire documentary context">
    <h2>Saffire · contexto de escala</h2>
    <p className="saffire-context__label">Contexto documental · fuentes publicadas</p>
    <p>Saffire aporta contexto a otra escala, con materiales y confinamiento distintos.
      Estas diferencias delimitan dónde se pueden aplicar las observaciones de BASS-II.</p>

    <div className="saffire-context__table" role="region" aria-label="Configuraciones documentadas BASS-II y Saffire" tabIndex={0}>
      <table>
        <caption>Configuraciones descritas por las publicaciones citadas; las dimensiones son contexto geométrico.</caption>
        <thead><tr><th scope="col">Serie</th><th scope="col">Plataforma y material</th><th scope="col">Configuración publicada</th><th scope="col">Fuente</th></tr></thead>
        <tbody>
          <tr>
            <th scope="row">BASS-II · Tabla 5.1</th>
            <td>Glovebox de la ISS; láminas de PMMA colado.</td>
            <td>Anchos publicados de 1.2 o 2.2 cm; flujo opuesto en la serie.</td>
            <td><a href="https://ntrs.nasa.gov/api/citations/20210011385/downloads/TM-20210011385.pdf#page=65" target="_blank" rel="noreferrer">NASA TM · §5, Tabla 5.1</a></td>
          </tr>
          <tr>
            <th scope="row">Saffire I y III</th>
            <td>Conducto de ensayo de Cygnus; tejido de algodón y fibra de vidrio (SIBAL).</td>
            <td>94 cm de largo × 40.6 cm de ancho; propagación concurrente y opuesta.</td>
            <td><a href="https://ntrs.nasa.gov/citations/20170008805" target="_blank" rel="noreferrer">NASA · ensayos a gran escala</a>{" · "}
              <a href="https://doi.org/10.1016/j.combustflame.2018.10.012" target="_blank" rel="noreferrer">Urban et al. · configuración</a></td>
          </tr>
          <tr>
            <th scope="row">Saffire II</th>
            <td>Conducto de ensayo de Cygnus; nueve muestras de varios materiales.</td>
            <td>29 × 5 cm según Urban et al.; incluye configuraciones de SIBAL, silicona y PMMA.</td>
            <td><a href="https://doi.org/10.1016/j.combustflame.2018.10.012" target="_blank" rel="noreferrer">Urban et al. · configuración</a></td>
          </tr>
        </tbody>
      </table>
    </div>

    <p><strong>Límite de interpretación.</strong> Material, geometría, dirección del flujo y confinamiento
      limitan la comparabilidad física. Esta tarjeta no añade puntos ni combina rankings con BASS-II.
      Una comparación numérica entre campañas requiere revisar las métricas y condiciones.</p>
    <details>
      <summary>Discrepancias de las fuentes conservadas</summary>
      <ul>
        <li>El CSV de Saffire I intercambia largo y ancho respecto a la publicación.
          Aquí se atribuyen las dimensiones a la publicación.</li>
        <li>El CSV de Saffire III indica 30 cm/s; el artículo de Urban et al. indica 25 cm/s
          para el flujo a la entrada del conducto. No se resuelve esa diferencia en esta tarjeta.</li>
        <li>La tabla de Saffire II mezcla rótulos de longitud con valores en mm/s.
          Esos campos no se presentan aquí como una tasa comparable con BASS-II.</li>
      </ul>
      <p><a href="https://github.com/Ryo-936hz/Flame-in-Freefall/blob/main/docs/P2_SAFFIRE_CONTEXT.md" target="_blank" rel="noreferrer">Auditoría de fuentes: archivos, líneas y discrepancias</a></p>
    </details>
    <p className="saffire-context__availability">Esta tarjeta es documental y permanece visible en modo sintético.
      Su presencia no confirma que el corpus NASA esté importado. El catálogo muestra los estudios
      y registros realmente disponibles en la API.</p>
  </section>;
}
