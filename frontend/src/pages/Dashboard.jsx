import { useState, useEffect } from 'react';
import { formatCurrency, formatInteger, formatKg, formatPrice } from '../utils/formatNumbers';

function Dashboard() {
  const [stats, setStats] = useState({
    totalAnimales: 0,
    stockPorDueno: [],
    futurosCobros: [],
    futurosPagos: []
  });
  const [expandedStock, setExpandedStock] = useState(false);

  useEffect(() => {
    cargarStats();
  }, []);

  const cargarStats = async () => {
    try {
      const response = await fetch('/api/dashboard');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  return (
    <div className="page">
      <h2>Dashboard - Campo Don José</h2>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        Gestión de Sofia y Perla
      </p>
      
      <div className="stats-grid">
        <div className="stat-card" style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Total de Animales</h3>
            <button 
              onClick={() => setExpandedStock(!expandedStock)}
              style={{ 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer', 
                fontSize: '1.5rem',
                color: '#2c5f2d'
              }}
            >
              {expandedStock ? '▼' : '▶'}
            </button>
          </div>
          <div className="value">{stats.totalAnimales}</div>
          
          {expandedStock && (
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #ddd' }}>
              <h4 style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>Por dueño:</h4>
              {stats.stockPorDueno.map((item) => (
                <div key={item.dueno} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  padding: '0.5rem',
                  background: '#f5f5f5',
                  borderRadius: '4px',
                  marginBottom: '0.3rem'
                }}>
                  <strong>{item.dueno}</strong>
                  <span>{item.total} animales</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div>
          <h3>Futuros Cobros</h3>
          {stats.futurosCobros.length > 0 ? (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th>Dueño</th>
                    <th>Monto</th>
                    <th>Notas</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.futurosCobros.map((cobro, index) => {
                    const getTipoDisplay = (tipo) => {
                      switch(tipo) {
                        case 'terneros': return 'Terneros';
                        case 'vacas_toros': return 'Vacas/Toros';
                        case 'cereales': return 'Cereales';
                        default: return tipo;
                      }
                    };
                    
                    return (
                      <tr key={index}>
                        <td><strong>{cobro.fecha_cobro}</strong></td>
                        <td>{getTipoDisplay(cobro.tipo)}</td>
                        <td>{cobro.dueno}</td>
                        <td style={{ color: '#28a745', fontWeight: 'bold' }}>
                          ${formatCurrency(cobro.precio_total)}
                        </td>
                        <td>{cobro.notas || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: '#999', fontStyle: 'italic' }}>No hay cobros pendientes</p>
          )}
        </div>

        <div>
          <h3>Futuros Pagos</h3>
          {stats.futurosPagos.length > 0 ? (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th>Dueño</th>
                    <th>Monto</th>
                    <th>Proveedor</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.futurosPagos.map((pago, index) => (
                    <tr key={index}>
                      <td><strong>{pago.fecha_pago}</strong></td>
                      <td>{pago.tipo === 'terneros' ? 'Terneros' : 'Vacas/Toros'}</td>
                      <td>{pago.dueno}</td>
                      <td style={{ color: '#dc3545', fontWeight: 'bold' }}>
                        ${formatCurrency(pago.precio_total)}
                      </td>
                      <td>{pago.notas || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: '#999', fontStyle: 'italic' }}>No hay pagos pendientes</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
