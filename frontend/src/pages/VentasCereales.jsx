import { useState, useEffect } from 'react';
import { formatCurrency, formatInteger, formatKg, formatPrice } from '../utils/formatNumbers';

function VentasCereales() {
  const [ventas, setVentas] = useState([]);
  const [stockCereales, setStockCereales] = useState([]);
  const [añoSeleccionado, setAñoSeleccionado] = useState(new Date().getFullYear());
  const [añosDisponibles, setAñosDisponibles] = useState([]);
  const [porcentajeRetencionGlobal, setPorcentajeRetencionGlobal] = useState(() => {
    // Cargar desde localStorage o usar 21% por defecto
    const saved = localStorage.getItem('cereales_porcentaje_retencion');
    return saved ? parseFloat(saved) : 21;
  });
  const [mostrarConfigRetencion, setMostrarConfigRetencion] = useState(false);
  const [porcentajeTemporal, setPorcentajeTemporal] = useState(porcentajeRetencionGlobal);
  const [form, setForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    tipo: 'Blanco',
    kg_vendidos: '',
    precio_por_kg: '',
    total_vendido: '',
    retencion: '',
    valor_final: '',
    fecha_cobro: '',
    notas: ''
  });

  useEffect(() => {
    cargarAños();
  }, []);

  useEffect(() => {
    if (añoSeleccionado) {
      cargarStockCereales();
      cargarVentas();
    }
  }, [añoSeleccionado]);

  const cargarAños = async () => {
    try {
      const response = await fetch('/api/cereales/anos');
      const años = await response.json();
      setAñosDisponibles(años);
      
      if (años.length === 0) {
        setAñosDisponibles([new Date().getFullYear()]);
      }
    } catch (error) {
      console.error('Error al cargar años:', error);
    }
  };

  const cargarStockCereales = async () => {
    try {
      const response = await fetch(`/api/cereales/stock/${añoSeleccionado}`);
      const stock = await response.json();
      setStockCereales(stock);
    } catch (error) {
      console.error('Error al cargar stock de cereales:', error);
    }
  };

  const cargarVentas = async () => {
    try {
      const response = await fetch(`/api/cereales/ventas/${añoSeleccionado}`);
      const data = await response.json();
      setVentas(data);
    } catch (error) {
      console.error('Error al cargar ventas:', error);
    }
  };

  const eliminarRegistro = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta venta? Se revertirá el cambio en el stock.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/cereales/ventas/${id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        alert(data.error || 'Error al eliminar el registro');
        return;
      }
      
      alert('Venta eliminada. Stock actualizado.');
      cargarVentas();
      cargarStockCereales();
    } catch (error) {
      console.error('Error al eliminar:', error);
      alert('Error al conectar con el servidor');
    }
  };

  const calcularTotales = (campo, valor) => {
    const newForm = { ...form, [campo]: valor };
    
    if (newForm.kg_vendidos && newForm.precio_por_kg) {
      const total = parseFloat(newForm.kg_vendidos) * parseFloat(newForm.precio_por_kg);
      newForm.total_vendido = total.toFixed(2);
      
      // Solo aplicar retención si el tipo es "Blanco"
      let retencionCalculada = 0;
      if (newForm.tipo === 'Blanco') {
        retencionCalculada = (total * porcentajeRetencionGlobal) / 100;
      }
      
      newForm.retencion = retencionCalculada.toFixed(2);
      newForm.valor_final = (total - retencionCalculada).toFixed(2);
    }
    
    setForm(newForm);
  };

  // Función para recalcular cuando cambia el porcentaje global
  const recalcularConNuevoPorcentaje = (nuevoPorcentaje) => {
    setPorcentajeRetencionGlobal(nuevoPorcentaje);
    // Guardar en localStorage
    localStorage.setItem('cereales_porcentaje_retencion', nuevoPorcentaje.toString());
    
    // Si hay valores en el formulario, recalcular
    if (form.kg_vendidos && form.precio_por_kg) {
      const total = parseFloat(form.kg_vendidos) * parseFloat(form.precio_por_kg);
      
      // Solo aplicar retención si el tipo es "Blanco"
      let retencionCalculada = 0;
      if (form.tipo === 'Blanco') {
        retencionCalculada = (total * nuevoPorcentaje) / 100;
      }
      
      setForm(prev => ({
        ...prev,
        retencion: retencionCalculada.toFixed(2),
        valor_final: (total - retencionCalculada).toFixed(2)
      }));
    }
  };

  // Funciones para manejar la configuración de retención
  const abrirConfigRetencion = () => {
    setPorcentajeTemporal(porcentajeRetencionGlobal);
    setMostrarConfigRetencion(true);
  };

  const guardarConfigRetencion = () => {
    recalcularConNuevoPorcentaje(porcentajeTemporal);
    setMostrarConfigRetencion(false);
  };

  const cancelarConfigRetencion = () => {
    setPorcentajeTemporal(porcentajeRetencionGlobal);
    setMostrarConfigRetencion(false);
  };

  const getStockDisponible = (tipo) => {
    const stock = stockCereales.find(s => s.tipo === tipo);
    return stock ? stock.kg_restantes : 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/cereales/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        alert(data.error || 'Error al guardar la venta');
        return;
      }
      
      alert('Venta registrada exitosamente. Stock actualizado.');
      setForm({
        fecha: new Date().toISOString().split('T')[0],
        tipo: 'Blanco',
        kg_vendidos: '',
        precio_por_kg: '',
        total_vendido: '',
        retencion: '',
        valor_final: '',
        fecha_cobro: '',
        notas: ''
      });
      cargarVentas();
      cargarStockCereales();
      cargarAños();
    } catch (error) {
      console.error('Error al guardar:', error);
      alert('Error al conectar con el servidor');
    }
  };

  return (
    <div className="page">
      <h2>Ventas de cereales</h2>
      
      {/* Selector de Año */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
        <div className="form-group" style={{ margin: 0, minWidth: '150px' }}>
          <label>Año:</label>
          <select 
            value={añoSeleccionado} 
            onChange={(e) => setAñoSeleccionado(parseInt(e.target.value))}
          >
            {añosDisponibles.map(año => (
              <option key={año} value={año}>{año}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stock Disponible */}
      <div style={{ 
        background: '#f8f9fa', 
        padding: '1rem', 
        borderRadius: '4px', 
        marginBottom: '1rem',
        border: '1px solid #dee2e6'
      }}>
        <h4 style={{ margin: '0 0 0.5rem 0' }}>Stock Disponible - Año {añoSeleccionado}</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {stockCereales.map(stock => (
            <div key={stock.tipo} style={{ 
              background: 'white', 
              padding: '0.8rem', 
              borderRadius: '4px',
              border: '1px solid #dee2e6'
            }}>
              <strong>Cereal {stock.tipo}</strong>
              <div style={{ fontSize: '0.9rem', marginTop: '0.3rem' }}>
                <div>Disponible: {formatKg(stock.kg_disponibles)} kg</div>
                <div>Vendido: {formatKg(stock.kg_vendidos)} kg</div>
                <div style={{ color: stock.kg_restantes > 0 ? '#28a745' : '#dc3545', fontWeight: 'bold' }}>
                  Restante: {formatKg(stock.kg_restantes)} kg
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Configuración de Retención Global */}
      <div style={{ 
        background: '#e3f2fd', 
        padding: '1rem', 
        borderRadius: '4px', 
        marginBottom: '1rem',
        border: '1px solid #90caf9'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h4 style={{ margin: '0 0 0.3rem 0', color: '#1565c0' }}>⚙️ Configuración de Retención</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 'bold', color: '#1565c0' }}>
                Porcentaje actual: {porcentajeRetencionGlobal}%
              </span>
              <small style={{ color: '#1565c0', fontStyle: 'italic' }}>
                (Se aplica automáticamente a todas las ventas)
              </small>
            </div>
          </div>
          <button 
            type="button"
            onClick={abrirConfigRetencion}
            style={{
              background: '#1976d2',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            Modificar
          </button>
        </div>
      </div>

      {/* Modal de Configuración */}
      {mostrarConfigRetencion && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            minWidth: '400px'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#1565c0' }}>
              ⚙️ Modificar Porcentaje de Retención
            </h3>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Nuevo porcentaje de retención:
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input 
                  type="number" 
                  step="0.01"
                  value={porcentajeTemporal}
                  onChange={(e) => setPorcentajeTemporal(parseFloat(e.target.value) || 0)}
                  min="0"
                  max="100"
                  style={{
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    width: '120px',
                    textAlign: 'center',
                    fontSize: '1.1rem',
                    fontWeight: 'bold'
                  }}
                />
                <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>%</span>
              </div>
              <small style={{ color: '#666', display: 'block', marginTop: '0.5rem' }}>
                Este porcentaje se aplicará a todas las ventas futuras y se guardará para próximas sesiones.
              </small>
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button 
                type="button"
                onClick={cancelarConfigRetencion}
                style={{
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button 
                type="button"
                onClick={guardarConfigRetencion}
                style={{
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Fecha</label>
          <input 
            type="date" 
            value={form.fecha}
            onChange={(e) => setForm({...form, fecha: e.target.value})}
            min={new Date().toISOString().split('T')[0]}
            required
          />
        </div>

        <div className="form-group">
          <label>Tipo de cereal</label>
          <select 
            value={form.tipo} 
            onChange={(e) => calcularTotales('tipo', e.target.value)}
          >
            <option value="Blanco">Blanco</option>
            <option value="Negro">Negro</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>Cantidad (kg)</label>
          <input 
            type="number" 
            value={form.kg_vendidos}
            onChange={(e) => calcularTotales('kg_vendidos', e.target.value)}
            max={getStockDisponible(form.tipo)}
            required
          />
          <small style={{ color: '#666', fontSize: '0.8rem' }}>
            Disponible: {formatKg(getStockDisponible(form.tipo))} kg
          </small>
        </div>
        
        <div className="form-group">
          <label>Precio por kg ($)</label>
          <input 
            type="number" 
            step="0.01"
            value={form.precio_por_kg}
            onChange={(e) => calcularTotales('precio_por_kg', e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Total vendido ($)</label>
          <input 
            type="text" 
            value={form.total_vendido ? formatCurrency(form.total_vendido) : ''}
            readOnly
            style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed' }}
          />
        </div>
        
        <div className="form-group">
          <label>
            Retención {form.tipo === 'Blanco' ? `(${porcentajeRetencionGlobal}%)` : '(0% - No aplica para cereal Negro)'} - Calculada automáticamente
          </label>
          <input 
            type="text" 
            value={form.retencion ? formatCurrency(form.retencion) : ''}
            readOnly
            style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed' }}
          />
          {form.total_vendido && (
            <small style={{ color: '#666', fontSize: '0.8rem' }}>
              {form.tipo === 'Blanco' 
                ? `${porcentajeRetencionGlobal}% de ${formatCurrency(parseFloat(form.total_vendido))}`
                : 'Sin retención para cereal Negro'
              }
            </small>
          )}
        </div>
        
        <div className="form-group">
          <label>Valor final ($)</label>
          <input 
            type="text" 
            value={form.valor_final ? formatCurrency(form.valor_final) : ''}
            readOnly
            style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed' }}
          />
        </div>
        
        <div className="form-group">
          <label>Fecha a cobrar</label>
          <input 
            type="date" 
            value={form.fecha_cobro}
            onChange={(e) => setForm({...form, fecha_cobro: e.target.value})}
          />
        </div>
        
        <div className="form-group">
          <label>Notas (opcional)</label>
          <textarea 
            value={form.notas}
            onChange={(e) => setForm({...form, notas: e.target.value})}
          />
        </div>
        
        <button type="submit">Guardar venta</button>
      </form>

      <div className="table-container">
        <h3 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Historial de ventas - Año {añoSeleccionado}</h3>
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Kg Vendidos</th>
              <th>$/Kg</th>
              <th>Total Vendido</th>
              <th>Retención</th>
              <th>Valor Final</th>
              <th>Fecha Cobro</th>
              <th>Notas</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ventas.map((venta) => (
              <tr key={venta.id}>
                <td>{new Date(venta.fecha).toLocaleDateString()}</td>
                <td><strong>{venta.tipo}</strong></td>
                <td>{formatKg(venta.kg_vendidos)}</td>
                <td>${formatPrice(venta.precio_por_kg)}</td>
                <td><strong>${formatCurrency(venta.total_vendido)}</strong></td>
                <td>${formatCurrency(venta.retencion)}</td>
                <td><strong style={{ color: '#28a745' }}>${formatCurrency(venta.valor_final)}</strong></td>
                <td>{venta.fecha_cobro ? new Date(venta.fecha_cobro).toLocaleDateString() : '-'}</td>
                <td>{venta.notas || '-'}</td>
                <td>
                  <button 
                    onClick={() => eliminarRegistro(venta.id)}
                    style={{ 
                      background: '#dc3545', 
                      color: 'white', 
                      border: 'none', 
                      padding: '0.3rem 0.8rem', 
                      borderRadius: '4px', 
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default VentasCereales;