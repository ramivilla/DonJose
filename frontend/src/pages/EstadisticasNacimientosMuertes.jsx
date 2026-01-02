import { useState, useEffect } from 'react';
import { formatCurrency, formatInteger, formatKg, formatPrice } from '../utils/formatNumbers';

function EstadisticasNacimientosMuertes() {
  const [stats, setStats] = useState([]);

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      const [nacimientosRes, muertesRes] = await Promise.all([
        fetch('/api/nacimientos/stats'),
        fetch('/api/muertes/stats')
      ]);
      
      const nacimientos = await nacimientosRes.json();
      const muertes = await muertesRes.json();
      
      // Combinar datos por año
      const añosMap = new Map();
      
      // Agregar nacimientos
      nacimientos.forEach(nac => {
        añosMap.set(nac.anio, {
          anio: nac.anio,
          nacimientos_total: nac.total,
          nacimientos_machos: nac.machos,
          nacimientos_hembras: nac.hembras,
          vacas_totales: nac.vacas_totales,
          porcentaje_paricion: nac.porcentaje_paricion,
          muertes_total: 0,
          muertes_terneros_recien_nacidos: 0,
          total_nacimientos_año: 0,
          porcentaje_muerte_terneros: '0.0'
        });
      });
      
      // Agregar muertes
      muertes.forEach(muerte => {
        if (añosMap.has(muerte.anio)) {
          const existing = añosMap.get(muerte.anio);
          existing.muertes_total = muerte.total_muertes;
          existing.muertes_terneros_recien_nacidos = muerte.terneros_recien_nacidos;
          existing.total_nacimientos_año = muerte.total_nacimientos;
          existing.porcentaje_muerte_terneros = muerte.porcentaje_muerte_terneros;
        } else {
          añosMap.set(muerte.anio, {
            anio: muerte.anio,
            nacimientos_total: 0,
            nacimientos_machos: 0,
            nacimientos_hembras: 0,
            vacas_totales: 0,
            porcentaje_paricion: '0.0',
            muertes_total: muerte.total_muertes,
            muertes_terneros_recien_nacidos: muerte.terneros_recien_nacidos,
            total_nacimientos_año: muerte.total_nacimientos,
            porcentaje_muerte_terneros: muerte.porcentaje_muerte_terneros
          });
        }
      });
      
      // Convertir a array y ordenar por año descendente
      const statsArray = Array.from(añosMap.values()).sort((a, b) => b.anio - a.anio);
      setStats(statsArray);
      
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  return (
    <div className="page">
      <h2>Estadísticas Anuales - Nacimientos y Muertes</h2>
      
      <div className="stats-grid">
        {stats.map((stat) => (
          <div key={stat.anio} className="stat-card">
            <h3>Año {stat.anio}</h3>
            
            <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #eee' }}>
              <h4 style={{ color: '#28a745', fontSize: '1rem', marginBottom: '0.5rem' }}>📈 Nacimientos</h4>
              <p>Total: <strong>{stat.nacimientos_total}</strong></p>
              <p>Machos: {stat.nacimientos_machos} | Hembras: {stat.nacimientos_hembras}</p>
              <p>Vacas totales: <strong>{stat.vacas_totales}</strong></p>
              <p>% Parición: <strong>{stat.porcentaje_paricion}%</strong></p>
            </div>
            
            <div>
              <h4 style={{ color: '#dc3545', fontSize: '1rem', marginBottom: '0.5rem' }}>📉 Muertes</h4>
              <p>Total muertes: <strong>{stat.muertes_total}</strong></p>
              <p>Terneros recién nacidos: <strong>{stat.muertes_terneros_recien_nacidos}</strong></p>
              <p>% Muerte terneros: <strong>{stat.porcentaje_muerte_terneros}%</strong></p>
            </div>
            
            {stat.nacimientos_total > 0 && stat.muertes_total > 0 && (
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #eee', background: '#f8f9fa', padding: '0.5rem', borderRadius: '4px' }}>
                <strong>Balance: {stat.nacimientos_total - stat.muertes_total} animales</strong>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {stats.length === 0 && (
        <p style={{ color: '#999', fontStyle: 'italic', textAlign: 'center', marginTop: '2rem' }}>
          No hay datos de nacimientos o muertes registrados
        </p>
      )}
    </div>
  );
}

export default EstadisticasNacimientosMuertes;