import { useState, useEffect } from 'react';
import { formatCurrency, formatInteger, formatKg, formatPrice } from '../utils/formatNumbers';

function VentasVacasToros() {
  const [ventas, setVentas] = useState([]);
  const [form, setForm] = useState({
    tipo: 'Vacas',
    fecha_venta: '',
    dueno: 'Perla',
    cantidad: '',
    kilos_totales: '',
    precio_por_kg: '',
    precio_total: '',
    fecha_cobro: '',
    notas: ''
  });

  const duenos = ['Perla', 'Salgado', 'Ramon'];

  useEffect(() => {
    cargarVentas();
  }, []);

  const calcularPrecioTotal = (campo, valor) => {
    const newForm = { ...form, [campo]: valor };
    
    if (newForm.kilos_totales && newForm.precio_por_kg) {
      newForm.precio_total = (parseFloat(newForm.kilos_totales) * parseFloat(newForm.precio_por_kg)).toFixed(2);
    }
    
    setForm(newForm);
  };

  const cargarVentas = async () => {
    try {
      const response = await fetch('/api/ventas-vacas-toros');
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
      const response = await fetch(`/api/ventas-vacas-toros/${id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        alert(data.error || 'Error al eliminar el registro');
        return;
      }
      
      alert('Venta eliminada. Stock actualizado.');
      cargarVentas();
    } catch (error) {
      console.error('Error al eliminar:', error);
      alert('Error al conectar con el servidor');
    }
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/ventas-vacas-toros', {
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
        tipo: 'Vacas',
        fecha_venta: '',
        dueno: 'Perla',
        cantidad: '',
        kilos_totales: '',
        precio_por_kg: '',
        precio_total: '',
        fecha_cobro: '',
        notas: ''
      });
      cargarVentas();
    } catch (error) {
      console.error('Error al guardar:', error);
      alert('Error al conectar con el servidor');
    }
  };

  return (
    <div className="page">
      <h2>Ventas de vacas y toros</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Tipo</label>
          <select 
            value={form.tipo} 
            onChange={(e) => setForm({...form, tipo: e.target.value})}
          >
            <option value="Vacas">Vacas</option>
            <option value="Toro">Toro</option>
            <option value="Vacas viejas">Vacas viejas</option>
            <option value="Vaquillonas">Vaquillonas</option>
            <option value="Novillo">Novillo</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>Fecha de venta</label>
          <input 
            type="date" 
            value={form.fecha_venta}
            onChange={(e) => setForm({...form, fecha_venta: e.target.value})}
            min={new Date().toISOString().split('T')[0]}
            required
          />
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
          <label>Cantidad</label>
          <input 
            type="number" 
            value={form.cantidad}
            onChange={(e) => setForm({...form, cantidad: e.target.value})}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Kilos totales</label>
          <input 
            type="number" 
            step="0.01"
            value={form.kilos_totales}
            onChange={(e) => calcularPrecioTotal('kilos_totales', e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Precio por kg ($)</label>
          <input 
            type="number" 
            step="0.01"
            value={form.precio_por_kg}
            onChange={(e) => calcularPrecioTotal('precio_por_kg', e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Precio total ($)</label>
          <input 
            type="text" 
            value={form.precio_total ? formatCurrency(form.precio_total) : ''}
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
        <h3 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Historial de ventas</h3>
        <table>
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Fecha Venta</th>
              <th>Dueño</th>
              <th>Cantidad</th>
              <th>Kg Totales</th>
              <th>$/Kg</th>
              <th>Precio Total</th>
              <th>Fecha Cobro</th>
              <th>Notas</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ventas.map((venta) => (
              <tr key={venta.id}>
                <td>{venta.tipo}</td>
                <td>{venta.fecha_venta}</td>
                <td><strong>{venta.dueno}</strong></td>
                <td>{venta.cantidad}</td>
                <td>{formatKg(venta.kilos_totales) || '-'}</td>
                <td>${formatPrice(venta.precio_por_kg) || '-'}</td>
                <td><strong>${formatCurrency(venta.precio_total)}</strong></td>
                <td>{venta.fecha_cobro || '-'}</td>
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

export default VentasVacasToros;
