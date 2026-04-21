import { useState, useEffect } from 'react';
import { formatDate } from '../utils/formatNumbers';

function Movimientos() {
  const [movimientos, setMovimientos] = useState([]);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroDueno, setFiltroDueno] = useState('');
  const [filtroAnimal, setFiltroAnimal] = useState('');

  useEffect(() => {
    cargarMovimientos();
  }, []);

  const cargarMovimientos = async () => {
    try {
      const response = await fetch('/api/movimientos');
      const data = await response.json();
      setMovimientos(data);
    } catch (error) {
      console.error('Error al cargar movimientos:', error);
    }
  };

  const tiposMovimiento = [...new Set(movimientos.map(m => m.tipo_movimiento))];
  const duenos = [...new Set(movimientos.map(m => m.dueno))];
  const tiposAnimal = [...new Set(movimientos.map(m => m.tipo_animal))];

  const movimientosFiltrados = movimientos.filter(m => {
    if (filtroTipo && m.tipo_movimiento !== filtroTipo) return false;
    if (filtroDueno && m.dueno !== filtroDueno) return false;
    if (filtroAnimal && m.tipo_animal !== filtroAnimal) return false;
    return true;
  });

  const getBadgeColor = (tipo) => {
    switch (tipo) {
      case 'Venta': return '#dc3545';
      case 'Compra': return '#28a745';
      case 'Nacimiento': return '#007bff';
      case 'Muerte': return '#6c757d';
      case 'Ajuste manual': return '#fd7e14';
      default: return '#6c757d';
    }
  };

  return (
    <div className="page">
      <h2>Historial de Movimientos</h2>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>
        Registro completo de todos los cambios de stock con valores antes y después de cada operación.
      </p>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label>Tipo de movimiento</label>
          <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
            <option value="">Todos</option>
            {tiposMovimiento.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label>Dueño</label>
          <select value={filtroDueno} onChange={(e) => setFiltroDueno(e.target.value)}>
            <option value="">Todos</option>
            {duenos.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label>Animal</label>
          <select value={filtroAnimal} onChange={(e) => setFiltroAnimal(e.target.value)}>
            <option value="">Todos</option>
            {tiposAnimal.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button
            onClick={() => { setFiltroTipo(''); setFiltroDueno(''); setFiltroAnimal(''); }}
            style={{ background: '#6c757d', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
        Mostrando {movimientosFiltrados.length} de {movimientos.length} movimientos
      </p>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Fecha y hora</th>
              <th>Tipo</th>
              <th>Animal</th>
              <th>Dueño</th>
              <th>Cantidad</th>
              <th>Stock antes</th>
              <th>Stock después</th>
              <th>Notas</th>
            </tr>
          </thead>
          <tbody>
            {movimientosFiltrados.map((mov) => (
              <tr key={mov.id}>
                <td style={{ whiteSpace: 'nowrap' }}>{formatDate(mov.fecha_hora)}</td>
                <td>
                  <span style={{
                    background: getBadgeColor(mov.tipo_movimiento),
                    color: 'white',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '12px',
                    fontSize: '0.8rem',
                    whiteSpace: 'nowrap'
                  }}>
                    {mov.tipo_movimiento}
                  </span>
                </td>
                <td>{mov.tipo_animal}</td>
                <td><strong>{mov.dueno}</strong></td>
                <td style={{ textAlign: 'center' }}>{mov.cantidad}</td>
                <td style={{ textAlign: 'center', color: '#666' }}>{mov.stock_antes}</td>
                <td style={{ textAlign: 'center', fontWeight: 'bold', color: mov.stock_despues < mov.stock_antes ? '#dc3545' : '#28a745' }}>
                  {mov.stock_despues}
                </td>
                <td style={{ color: '#666', fontSize: '0.9rem' }}>{mov.notas || '-'}</td>
              </tr>
            ))}
            {movimientosFiltrados.length === 0 && (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', color: '#999', padding: '2rem' }}>
                  No hay movimientos registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Movimientos;
