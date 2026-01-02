import { useState, useEffect } from 'react';

function Stock() {
  const [stock, setStock] = useState([]);
  const [expandedOwner, setExpandedOwner] = useState(null);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({
    tipo: 'Toro',
    dueno: 'Perla',
    cantidad: '',
    notas: ''
  });

  const tiposAnimales = ['Toro', 'Vacas', 'Vacas viejas', 'Terneros', 'Terneras', 'Vaquillonas', 'Novillo'];
  const duenos = ['Perla', 'Salgado', 'Ramon'];

  useEffect(() => {
    cargarStock();
  }, []);

  const cargarStock = async () => {
    try {
      const response = await fetch('/api/stock');
      const data = await response.json();
      setStock(data);
    } catch (error) {
      console.error('Error al cargar stock:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await fetch('/api/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      setForm({ tipo: 'Toro', dueno: 'Perla', cantidad: '', notas: '' });
      cargarStock();
    } catch (error) {
      console.error('Error al guardar:', error);
    }
  };

  const ajustarStock = async (tipo, dueno, nuevaCantidad) => {
    if (!confirm(`¿Estás seguro de ajustar el stock de ${tipo} para ${dueno} a ${nuevaCantidad}?`)) {
      return;
    }
    
    try {
      await fetch('/api/stock/ajustar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, dueno, cantidad: nuevaCantidad })
      });
      setEditando(null);
      cargarStock();
      alert('Stock ajustado correctamente');
    } catch (error) {
      console.error('Error al ajustar:', error);
      alert('Error al ajustar el stock');
    }
  };

  const resetearSistema = async () => {
    const confirmacion1 = confirm('⚠️ ATENCIÓN: Esto borrará TODOS los datos del sistema (stock, nacimientos, muertes, ventas, compras, asignaciones de lotes).\n\n¿Estás COMPLETAMENTE seguro?');
    if (!confirmacion1) return;
    
    const confirmacion2 = confirm('🚨 ÚLTIMA CONFIRMACIÓN: Esta acción NO se puede deshacer. Se perderán TODOS los datos históricos.\n\n¿Continuar con el reset total?');
    if (!confirmacion2) return;
    
    try {
      const response = await fetch('/api/sistema/reset-total', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        alert(data.error || 'Error al resetear el sistema');
        return;
      }
      
      alert('✅ Sistema reseteado exitosamente. Todos los datos han sido borrados.');
      cargarStock();
    } catch (error) {
      console.error('Error al resetear:', error);
      alert('Error al conectar con el servidor');
    }
  };

  return (
    <div className="page">
      <h2>Stock de animales</h2>
      
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3>Stock actual por dueño</h3>
          <button 
            onClick={resetearSistema}
            style={{
              background: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}
          >
            🗑️ Reset Total del Sistema
          </button>
        </div>
        {duenos.map((dueno) => {
          const stockDueno = stock.filter(item => item.dueno === dueno);
          const totalAnimales = stockDueno.reduce((sum, item) => sum + item.cantidad, 0);
          const isExpanded = expandedOwner === dueno;

          return (
            <div key={dueno} style={{ marginBottom: '1rem', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
              <div 
                onClick={() => setExpandedOwner(isExpanded ? null : dueno)}
                style={{
                  padding: '1rem',
                  background: '#f5f5f5',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  userSelect: 'none'
                }}
              >
                <div>
                  <strong style={{ fontSize: '1.1rem' }}>{dueno}</strong>
                  <span style={{ marginLeft: '1rem', color: '#666' }}>
                    Total: {totalAnimales} animales
                  </span>
                </div>
                <span style={{ fontSize: '1.2rem' }}>{isExpanded ? '▼' : '▶'}</span>
              </div>
              
              {isExpanded && (
                <div style={{ padding: '1rem' }}>
                  <table style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '0.5rem' }}>Tipo</th>
                        <th style={{ textAlign: 'right', padding: '0.5rem' }}>Cantidad</th>
                        <th style={{ textAlign: 'right', padding: '0.5rem' }}>Última actualización</th>
                        <th style={{ textAlign: 'right', padding: '0.5rem' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockDueno.map((item) => (
                        <tr key={item.id} style={{ borderTop: '1px solid #eee' }}>
                          <td style={{ padding: '0.5rem' }}>{item.tipo}</td>
                          <td style={{ textAlign: 'right', padding: '0.5rem' }}>
                            {editando === item.id ? (
                              <input 
                                type="number" 
                                defaultValue={item.cantidad}
                                id={`edit-${item.id}`}
                                style={{ width: '80px', textAlign: 'right' }}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    ajustarStock(item.tipo, item.dueno, e.target.value);
                                  }
                                }}
                              />
                            ) : (
                              <strong style={{ color: item.cantidad < 0 ? 'red' : 'inherit' }}>
                                {item.cantidad}
                              </strong>
                            )}
                          </td>
                          <td style={{ textAlign: 'right', padding: '0.5rem', color: '#666' }}>
                            {item.fecha_actualizacion}
                          </td>
                          <td style={{ textAlign: 'right', padding: '0.5rem' }}>
                            {editando === item.id ? (
                              <>
                                <button 
                                  onClick={() => {
                                    const input = document.getElementById(`edit-${item.id}`);
                                    ajustarStock(item.tipo, item.dueno, input.value);
                                  }}
                                  style={{ 
                                    background: '#28a745', 
                                    color: 'white', 
                                    border: 'none', 
                                    padding: '0.2rem 0.5rem', 
                                    borderRadius: '4px', 
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    marginRight: '0.3rem'
                                  }}
                                >
                                  ✓
                                </button>
                                <button 
                                  onClick={() => setEditando(null)}
                                  style={{ 
                                    background: '#6c757d', 
                                    color: 'white', 
                                    border: 'none', 
                                    padding: '0.2rem 0.5rem', 
                                    borderRadius: '4px', 
                                    cursor: 'pointer',
                                    fontSize: '0.8rem'
                                  }}
                                >
                                  ✕
                                </button>
                              </>
                            ) : (
                              <button 
                                onClick={() => setEditando(item.id)}
                                style={{ 
                                  background: '#007bff', 
                                  color: 'white', 
                                  border: 'none', 
                                  padding: '0.2rem 0.5rem', 
                                  borderRadius: '4px', 
                                  cursor: 'pointer',
                                  fontSize: '0.8rem'
                                }}
                              >
                                Ajustar
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '2px solid #ddd' }}>
        <h3 style={{ marginBottom: '1rem' }}>Ajuste manual de stock</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Tipo de animal</label>
            <select 
              value={form.tipo} 
              onChange={(e) => setForm({...form, tipo: e.target.value})}
            >
              {tiposAnimales.map(tipo => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Dueño</label>
            <select 
              value={form.dueno} 
              onChange={(e) => setForm({...form, dueno: e.target.value})}
            >
              {duenos.map(dueno => (
                <option key={dueno} value={dueno}>{dueno}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Cantidad a sumar</label>
            <input 
              type="number" 
              value={form.cantidad}
              onChange={(e) => setForm({...form, cantidad: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Notas (opcional)</label>
            <textarea 
              value={form.notas}
              onChange={(e) => setForm({...form, notas: e.target.value})}
              placeholder="Motivo del ajuste manual..."
            />
          </div>
          
          <button type="submit">Sumar al stock</button>
        </form>
      </div>
    </div>
  );
}

export default Stock;
