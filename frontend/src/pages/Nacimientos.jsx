import { useState, useEffect } from 'react';

function Nacimientos() {
  const [nacimientos, setNacimientos] = useState([]);
  const [form, setForm] = useState({
    fecha: '',
    dueno: 'Perla',
    machos: '',
    hembras: '',
    notas: ''
  });

  const duenos = ['Perla', 'Salgado', 'Ramon'];

  useEffect(() => {
    cargarNacimientos();
  }, []);

  const cargarNacimientos = async () => {
    try {
      const response = await fetch('/api/nacimientos');
      const data = await response.json();
      setNacimientos(data);
    } catch (error) {
      console.error('Error al cargar nacimientos:', error);
    }
  };



  const eliminarRegistro = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este registro? Se revertirá el cambio en el stock.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/nacimientos/${id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        alert(data.error || 'Error al eliminar el registro');
        return;
      }
      
      alert('Registro eliminado. Stock actualizado.');
      cargarNacimientos();
    } catch (error) {
      console.error('Error al eliminar:', error);
      alert('Error al conectar con el servidor');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/nacimientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        alert(data.error || 'Error al registrar el nacimiento');
        return;
      }
      
      alert('Nacimiento registrado exitosamente. Stock actualizado automáticamente.');
      setForm({ fecha: '', dueno: 'Perla', machos: '', hembras: '', notas: '' });
      cargarNacimientos();
    } catch (error) {
      console.error('Error al guardar:', error);
      alert('Error al conectar con el servidor');
    }
  };

  return (
    <div className="page">
      <h2>Registro de nacimientos</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Fecha de nacimiento</label>
          <input 
            type="date" 
            value={form.fecha}
            onChange={(e) => setForm({...form, fecha: e.target.value})}
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
          <label>Cantidad de machos</label>
          <input 
            type="number" 
            value={form.machos}
            onChange={(e) => setForm({...form, machos: e.target.value})}
            required
            min="0"
          />
        </div>
        
        <div className="form-group">
          <label>Cantidad de hembras</label>
          <input 
            type="number" 
            value={form.hembras}
            onChange={(e) => setForm({...form, hembras: e.target.value})}
            required
            min="0"
          />
        </div>
        
        <div className="form-group">
          <label>Notas (opcional)</label>
          <textarea 
            value={form.notas}
            onChange={(e) => setForm({...form, notas: e.target.value})}
          />
        </div>
        
        <button type="submit">Guardar nacimiento</button>
      </form>

      <div className="table-container">
        <h3 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Historial de nacimientos</h3>
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Dueño</th>
              <th>Machos</th>
              <th>Hembras</th>
              <th>Total</th>
              <th>Notas</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {nacimientos.map((nac) => (
              <tr key={nac.id}>
                <td>{nac.fecha}</td>
                <td><strong>{nac.dueno}</strong></td>
                <td>{nac.machos}</td>
                <td>{nac.hembras}</td>
                <td><strong>{nac.machos + nac.hembras}</strong></td>
                <td>{nac.notas || '-'}</td>
                <td>
                  <button 
                    onClick={() => eliminarRegistro(nac.id)}
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

export default Nacimientos;
