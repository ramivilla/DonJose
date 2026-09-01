import { useState, useEffect } from 'react';

const DUENOS = ['Perla', 'Salgado', 'Ramon'];

function NacimientosEstadisticas() {
  const [anios, setAnios] = useState([]);
  const [porDueno, setPorDueno] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarStats();
  }, []);

  const cargarStats = async () => {
    try {
      const res = await fetch('/api/nacimientos/stats-detalle');
      const data = await res.json();
      setAnios(data.anios || []);
      setPorDueno(data.porDueno || []);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Para un año y dueño dado, busca los datos
  const getDuenoData = (anio, dueno) => {
    return porDueno.find(d => d.anio === anio && d.dueno === dueno) || { machos: 0, hembras: 0, total: 0 };
  };

  if (loading) return <div className="page"><p>Cargando...</p></div>;

  return (
    <div className="page">
      <h2>Estadísticas de Nacimientos</h2>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        Resumen anual de nacimientos por dueño.
      </p>

      {anios.length === 0 ? (
        <p style={{ color: '#999', fontStyle: 'italic', textAlign: 'center', marginTop: '3rem' }}>
          No hay nacimientos registrados aún.
        </p>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th rowSpan="2" style={{ verticalAlign: 'middle', textAlign: 'center' }}>Año</th>
                {DUENOS.map(dueno => (
                  <th key={dueno} colSpan="3" style={{ textAlign: 'center', borderLeft: '2px solid #dee2e6' }}>
                    {dueno}
                  </th>
                ))}
                <th colSpan="3" style={{ textAlign: 'center', borderLeft: '2px solid #dee2e6', background: '#2c5f2d', color: 'white' }}>
                  Total
                </th>
              </tr>
              <tr>
                {DUENOS.map(dueno => (
                  <>
                    <th key={`${dueno}-m`} style={{ textAlign: 'center', fontSize: '0.85rem', borderLeft: '2px solid #dee2e6' }}>♂ Machos</th>
                    <th key={`${dueno}-h`} style={{ textAlign: 'center', fontSize: '0.85rem' }}>♀ Hembras</th>
                    <th key={`${dueno}-t`} style={{ textAlign: 'center', fontSize: '0.85rem', fontWeight: 'bold' }}>Total</th>
                  </>
                ))}
                <th style={{ textAlign: 'center', fontSize: '0.85rem', borderLeft: '2px solid #dee2e6', background: '#2c5f2d', color: 'white' }}>♂ Machos</th>
                <th style={{ textAlign: 'center', fontSize: '0.85rem', background: '#2c5f2d', color: 'white' }}>♀ Hembras</th>
                <th style={{ textAlign: 'center', fontSize: '0.85rem', fontWeight: 'bold', background: '#2c5f2d', color: 'white' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {anios.map((anio, idx) => {
                const esActual = anio.anio === String(new Date().getFullYear());
                return (
                  <tr
                    key={anio.anio}
                    style={{
                      background: esActual ? '#f0f9f0' : idx % 2 === 0 ? 'white' : '#fafafa',
                      fontWeight: esActual ? '600' : 'normal'
                    }}
                  >
                    <td style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1rem' }}>
                      {anio.anio}
                      {esActual && (
                        <span style={{
                          marginLeft: '0.4rem',
                          background: '#28a745',
                          color: 'white',
                          fontSize: '0.7rem',
                          padding: '0.1rem 0.4rem',
                          borderRadius: '10px'
                        }}>
                          actual
                        </span>
                      )}
                    </td>
                    {DUENOS.map(dueno => {
                      const d = getDuenoData(anio.anio, dueno);
                      return (
                        <>
                          <td key={`${dueno}-m`} style={{ textAlign: 'center', borderLeft: '2px solid #dee2e6', color: '#555' }}>{d.machos}</td>
                          <td key={`${dueno}-h`} style={{ textAlign: 'center', color: '#555' }}>{d.hembras}</td>
                          <td key={`${dueno}-t`} style={{ textAlign: 'center', fontWeight: 'bold' }}>{d.total}</td>
                        </>
                      );
                    })}
                    <td style={{ textAlign: 'center', borderLeft: '2px solid #dee2e6', fontWeight: 'bold', color: '#555' }}>{anio.machos}</td>
                    <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#555' }}>{anio.hembras}</td>
                    <td style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.05rem', color: '#2c5f2d' }}>{anio.total}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: '#e8f5e9', fontWeight: 'bold' }}>
                <td style={{ textAlign: 'center' }}>Totales</td>
                {DUENOS.map(dueno => {
                  const totalMachos = porDueno.filter(d => d.dueno === dueno).reduce((s, d) => s + d.machos, 0);
                  const totalHembras = porDueno.filter(d => d.dueno === dueno).reduce((s, d) => s + d.hembras, 0);
                  return (
                    <>
                      <td key={`${dueno}-tm`} style={{ textAlign: 'center', borderLeft: '2px solid #dee2e6' }}>{totalMachos}</td>
                      <td key={`${dueno}-th`} style={{ textAlign: 'center' }}>{totalHembras}</td>
                      <td key={`${dueno}-tt`} style={{ textAlign: 'center' }}>{totalMachos + totalHembras}</td>
                    </>
                  );
                })}
                <td style={{ textAlign: 'center', borderLeft: '2px solid #dee2e6' }}>{anios.reduce((s, a) => s + a.machos, 0)}</td>
                <td style={{ textAlign: 'center' }}>{anios.reduce((s, a) => s + a.hembras, 0)}</td>
                <td style={{ textAlign: 'center', color: '#2c5f2d', fontSize: '1.1rem' }}>{anios.reduce((s, a) => s + a.total, 0)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

export default NacimientosEstadisticas;
