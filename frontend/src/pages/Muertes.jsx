import { useState, useEffect } from 'react';

function Muertes() {
  const [muertes, setMuertes] = useState([]);
  const [form, setForm] = useState({
    tipo_animal: 'Vacas',
    dueno: 'Perla',
    cantidad: '',
    causa: '',
    es_recien_nacido: false,
    fecha: ''
  });

  const tiposAnimales = ['Toro', 'Vacas', 'Vacas viejas', 'Terneros', 'Terneras', 'Vaquillonas', 'Novillo'];
  const duenos = ['Perla', 'Salgado', 'Ramon'];

  useEffect(() => {
    cargarMuertes();
  }, []);

  const cargarMuertes = async () => {
    try {
      const response = await fetch('/api/muertes');
      const data = await response.json();
      setMuertes(data);
    } catch (error) {
      console.error('Error al cargar muertes:', error);
    }
  };



  const eliminarRegistro = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este registro? Se revertirá el cambio en el stock.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/muertes/${id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        alert(data.error || 'Error al eliminar el registro');
        return;
      }
      
      alert('Registro eliminado. Stock actualizado.');
      cargarMuertes();
    } catch (error) {
      console.error('Error al eliminar:', error);
      alert('Error al conectar con el servidor');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/muertes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        alert(data.error || 'Error al registrar la muerte');
        return;
      }
      
      alert('Muerte registrada exitosamente. Stock actualizado.');
      setForm({ 
        tipo_animal: 'Vacas',
        dueno: 'Perla',
        cantidad: '', 
        causa: '',
        es_recien_nacido: false,
        fecha: ''
      });
      cargarMuertes();
    } catch (error) {
      console.error('Error al guardar:', error);
      alert('Error al conectar con el servidor');
    }
  };

  return (
    <div className="page">
      <h2>Registro de muertes</h2>
      
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
          <label>Tipo de animal</label>
          <select 
            value={form.tipo_animal} 
            onChange={(e) => setForm({...form, tipo_animal: e.target.value})}
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
          <label>Cantidad</label>
          <input 
            type="number" 
            value={form.cantidad}
            onChange={(e) => setForm({...form, cantidad: e.target.value})}
            required
          />
        </div>

        <div className="form-group">
          <label>
            <input 
              type="checkbox" 
              checked={form.es_recien_nacido}
              onChange={(e) => setForm({...form, es_recien_nacido: e.target.checked})}
              style={{ width: 'auto', marginRight: '0.5rem' }}
            />
            Es ternero recién nacido (en parición)
          </label>
        </div>
        
        <div className="form-group">
          <label>Causa</label>
          <textarea 
            value={form.causa}
            onChange={(e) => setForm({...form, causa: e.target.value})}
            placeholder="Descripción de la causa..."
          />
        </div>
        
        <button type="submit">Guardar registro</button>
      </form>

      <div className="table-container">
        <h3 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Historial de muertes</h3>
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Dueño</th>
              <th>Tipo</th>
              <th>Cantidad</th>
              <th>Recién Nacido</th>
              <th>Causa</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {muertes.map((muerte) => (
              <tr key={muerte.id}>
                <td>{muerte.fecha}</td>
                <td><strong>{muerte.dueno}</strong></td>
                <td>{muerte.tipo_animal}</td>
                <td>{muerte.cantidad}</td>
                <td>{muerte.es_recien_nacido ? 'Sí' : 'No'}</td>
                <td>{muerte.causa || '-'}</td>
                <td>
                  <button 
                    onClick={() => eliminarRegistro(muerte.id)}
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

export default Muertes;
