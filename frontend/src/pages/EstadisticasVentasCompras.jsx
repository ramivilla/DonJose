import { useState, useEffect } from 'react';
import { formatCurrency, formatInteger, formatKg, formatPrice } from '../utils/formatNumbers';

function EstadisticasVentasCompras() {
  const [stats, setStats] = useState([]);

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      const [ventasTernerosRes, ventasVacasRes, comprasVacasRes] = await Promise.all([
        fetch('/api/ventas-terneros'),
        fetch('/api/ventas-vacas-toros'),
        fetch('/api/compras-vacas-toros')
      ]);
      
      const ventasTerneros = await ventasTernerosRes.json();
      const ventasVacas = await ventasVacasRes.json();
      const comprasVacas = await comprasVacasRes.json();
      
      // Agrupar por año
      const añosMap = new Map();
      
      // Procesar ventas de terneros
      ventasTerneros.forEach(venta => {
        const año = new Date(venta.fecha_venta).getFullYear();
        if (!añosMap.has(año)) {
          añosMap.set(año, {
            anio: año,
            ventas_terneros_cantidad: 0,
            ventas_terneros_monto: 0,
            ventas_vacas_cantidad: 0,
            ventas_vacas_monto: 0,
            compras_vacas_cantidad: 0,
            compras_vacas_monto: 0
          });
        }
        const stat = añosMap.get(año);
        stat.ventas_terneros_cantidad += venta.cantidad;
        stat.ventas_terneros_monto += parseFloat(venta.precio_total || 0);
      });
      
      // Procesar ventas de vacas/toros
      ventasVacas.forEach(venta => {
        const año = new Date(venta.fecha_venta).getFullYear();
        if (!añosMap.has(año)) {
          añosMap.set(año, {
            anio: año,
            ventas_terneros_cantidad: 0,
            ventas_terneros_monto: 0,
            ventas_vacas_cantidad: 0,
            ventas_vacas_monto: 0,
            compras_vacas_cantidad: 0,
            compras_vacas_monto: 0
          });
        }
        const stat = añosMap.get(año);
        stat.ventas_vacas_cantidad += venta.cantidad;
        stat.ventas_vacas_monto += parseFloat(venta.precio_total || 0);
      });
      
      // Procesar compras de vacas/toros
      comprasVacas.forEach(compra => {
        const año = new Date(compra.fecha_compra).getFullYear();
        if (!añosMap.has(año)) {
          añosMap.set(año, {
            anio: año,
            ventas_terneros_cantidad: 0,
            ventas_terneros_monto: 0,
            ventas_vacas_cantidad: 0,
            ventas_vacas_monto: 0,
            compras_vacas_cantidad: 0,
            compras_vacas_monto: 0
          });
        }
        const stat = añosMap.get(año);
        stat.compras_vacas_cantidad += compra.cantidad;
        stat.compras_vacas_monto += parseFloat(compra.precio_total || 0);
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
      <h2>Estadísticas Anuales - Ventas y Compras</h2>
      
      <div className="stats-grid">
        {stats.map((stat) => (
          <div key={stat.anio} className="stat-card">
            <h3>Año {stat.anio}</h3>
            
            <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #eee' }}>
              <h4 style={{ color: '#28a745', fontSize: '1rem', marginBottom: '0.5rem' }}>💰 Ventas</h4>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Terneros:</strong>
                <p style={{ margin: '0.2rem 0' }}>Cantidad: {formatInteger(stat.ventas_terneros_cantidad)}</p>
                <p style={{ margin: '0.2rem 0' }}>Monto: ${formatCurrency(stat.ventas_terneros_monto)}</p>
              </div>
              <div>
                <strong>Vacas/Toros:</strong>
                <p style={{ margin: '0.2rem 0' }}>Cantidad: {formatInteger(stat.ventas_vacas_cantidad)}</p>
                <p style={{ margin: '0.2rem 0' }}>Monto: ${formatCurrency(stat.ventas_vacas_monto)}</p>
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ color: '#dc3545', fontSize: '1rem', marginBottom: '0.5rem' }}>🛒 Compras</h4>
              <div>
                <strong>Vacas/Toros:</strong>
                <p style={{ margin: '0.2rem 0' }}>Cantidad: {formatInteger(stat.compras_vacas_cantidad)}</p>
                <p style={{ margin: '0.2rem 0' }}>Monto: ${formatCurrency(stat.compras_vacas_monto)}</p>
              </div>
            </div>
            
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #eee', background: '#f8f9fa', padding: '0.5rem', borderRadius: '4px' }}>
              <strong>Balance Económico:</strong>
              <p style={{ margin: '0.2rem 0', color: stat.ventas_terneros_monto + stat.ventas_vacas_monto - stat.compras_vacas_monto >= 0 ? '#28a745' : '#dc3545' }}>
                ${formatCurrency(stat.ventas_terneros_monto + stat.ventas_vacas_monto - stat.compras_vacas_monto)}
              </p>
              <strong>Balance Animales:</strong>
              <p style={{ margin: '0.2rem 0' }}>
                {stat.compras_vacas_cantidad - stat.ventas_terneros_cantidad - stat.ventas_vacas_cantidad} animales
              </p>
            </div>
          </div>
        ))}
      </div>
      
      {stats.length === 0 && (
        <p style={{ color: '#999', fontStyle: 'italic', textAlign: 'center', marginTop: '2rem' }}>
          No hay datos de ventas o compras registrados
        </p>
      )}
    </div>
  );
}

export default EstadisticasVentasCompras;