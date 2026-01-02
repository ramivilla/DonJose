import { useState, useEffect } from 'react';
import MapaSVG from '../components/MapaSVG';
import '../styles/Mapa.css';

function Mapa() {
  const [lotes, setLotes] = useState([]);
  const [selectedLote, setSelectedLote] = useState(null);
  const [asignaciones, setAsignaciones] = useState([]);
  const [todasAsignaciones, setTodasAsignaciones] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [notasLote, setNotasLote] = useState('');
  const [stock, setStock] = useState([]);
  const [formAsignacion, setFormAsignacion] = useState({
    tipo_animal: 'Toro',
    dueno: 'Perla',
    cantidad: ''
  });

  const tiposAnimales = ['Toro', 'Vacas', 'Vacas viejas', 'Terneros', 'Terneras', 'Vaquillonas', 'Novillo'];
  const duenos = ['Perla', 'Salgado', 'Ramon'];

  useEffect(() => {
    cargarLotes();
    cargarStock();
    cargarTodasAsignaciones();
  }, []);

  const cargarLotes = async () => {
    try {
      const response = await fetch('/api/lotes');
      const data = await response.json();
      setLotes(data);
    } catch (error) {
      console.error('Error al cargar lotes:', error);
    }
  };

  const cargarStock = async () => {
    try {
      const response = await fetch('/api/stock');
      const data = await response.json();
      setStock(data);
    } catch (error) {
      console.error('Error al cargar stock:', error);
    }
  };

  const cargarTodasAsignaciones = async () => {
    try {
      const response = await fetch('/api/lotes');
      const lotesData = await response.json();
      
      const asignacionesPorLote = {};
      for (const lote of lotesData) {
        const res = await fetch(`/api/lote-asignaciones/${lote.id}`);
        const data = await res.json();
        asignacionesPorLote[lote.nombre] = data;
      }
      setTodasAsignaciones(asignacionesPorLote);
    } catch (error) {
      console.error('Error al cargar asignaciones:', error);
    }
  };

  const cargarAsignaciones = async (loteId) => {
    try {
      const response = await fetch(`/api/lote-asignaciones/${loteId}`);
      const data = await response.json();
      setAsignaciones(data);
    } catch (error) {
      console.error('Error al cargar asignaciones:', error);
    }
  };

  const handleLoteClick = (lote) => {
    setSelectedLote(lote);
    setNotasLote(lote.notas || '');
    cargarAsignaciones(lote.id);
    setShowModal(true);
  };

  const handleMoverAnimales = async (loteOrigenId, asignacionId = null, cantidadAMover = null) => {
    if (!selectedLote) return;
    
    // Si se especifica una asignación específica, mover solo esa cantidad
    if (asignacionId && cantidadAMover) {
      try {
        // Obtener la asignación original
        const asignacionesOrigen = todasAsignaciones[lotes.find(l => l.id === loteOrigenId)?.nombre] || [];
        const asignacion = asignacionesOrigen.find(a => a.id === asignacionId);
        
        if (!asignacion) return;
        
        // Agregar al lote destino
        await fetch('/api/lote-asignaciones', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lote_id: selectedLote.id,
            tipo_animal: asignacion.tipo_animal,
            dueno: asignacion.dueno,
            cantidad: cantidadAMover
          })
        });
        
        // Restar del lote origen
        const nuevaCantidad = asignacion.cantidad - cantidadAMover;
        if (nuevaCantidad > 0) {
          // Actualizar cantidad (necesitamos un endpoint para esto)
          await fetch(`/api/lote-asignaciones/${asignacionId}`, {
            method: 'DELETE'
          });
          await fetch('/api/lote-asignaciones', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              lote_id: loteOrigenId,
              tipo_animal: asignacion.tipo_animal,
              dueno: asignacion.dueno,
              cantidad: nuevaCantidad
            })
          });
        } else {
          // Eliminar la asignación si se movió todo
          await fetch(`/api/lote-asignaciones/${asignacionId}`, {
            method: 'DELETE'
          });
        }
        
        alert(`Se movieron ${cantidadAMover} ${asignacion.tipo_animal} a ${selectedLote.nombre}`);
        refreshData();
      } catch (error) {
        console.error('Error al mover animales:', error);
        alert('Error al mover animales');
      }
    } else {
      // Mover todos los animales del lote
      if (!confirm(`¿Mover todos los animales del lote origen a ${selectedLote.nombre}?`)) return;
      
      try {
        const response = await fetch('/api/lote-asignaciones/mover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lote_origen_id: loteOrigenId,
            lote_destino_id: selectedLote.id
          })
        });
        
        const result = await response.json();
        if (result.success) {
          alert(`Se movieron ${result.moved} grupos de animales a ${selectedLote.nombre}`);
          refreshData();
        }
      } catch (error) {
        console.error('Error al mover animales:', error);
        alert('Error al mover animales');
      }
    }
  };

  const refreshData = () => {
    cargarLotes();
    cargarTodasAsignaciones();
    if (selectedLote) {
      cargarAsignaciones(selectedLote.id);
    }
  };

  const handleGuardarNotas = async () => {
    try {
      await fetch(`/api/lotes/${selectedLote.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notas: notasLote })
      });
      refreshData();
      alert('Notas guardadas correctamente');
    } catch (error) {
      console.error('Error al guardar notas:', error);
    }
  };

  const handleAgregarAsignacion = async (e) => {
    e.preventDefault();
    
    // Validar stock disponible
    const cantidadSolicitada = parseInt(formAsignacion.cantidad);
    const stockDisponible = getStockDisponible(formAsignacion.tipo_animal, formAsignacion.dueno);
    
    if (cantidadSolicitada > stockDisponible) {
      alert(`No hay suficiente stock disponible.\nStock actual: ${stockDisponible}\nSolicitado: ${cantidadSolicitada}\n\nPrimero debes agregar más animales al stock.`);
      return;
    }
    
    try {
      await fetch('/api/lote-asignaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lote_id: selectedLote.id,
          ...formAsignacion
        })
      });
      setFormAsignacion({ tipo_animal: 'Toro', dueno: 'Perla', cantidad: '' });
      refreshData();
    } catch (error) {
      console.error('Error al agregar asignación:', error);
    }
  };

  const getStockDisponible = (tipoAnimal, dueno) => {
    // Obtener stock total
    const stockItem = stock.find(s => s.tipo === tipoAnimal && s.dueno === dueno);
    const stockTotal = stockItem ? stockItem.cantidad : 0;
    
    // Calcular total asignado en todos los lotes
    let totalAsignado = 0;
    Object.values(todasAsignaciones).forEach(asignacionesLote => {
      asignacionesLote.forEach(asig => {
        if (asig.tipo_animal === tipoAnimal && asig.dueno === dueno) {
          totalAsignado += asig.cantidad;
        }
      });
    });
    
    return stockTotal - totalAsignado;
  };

  const handleEliminarAsignacion = async (id) => {
    if (!confirm('¿Eliminar esta asignación?')) return;
    try {
      await fetch(`/api/lote-asignaciones/${id}`, { method: 'DELETE' });
      refreshData();
    } catch (error) {
      console.error('Error al eliminar asignación:', error);
    }
  };

  const getTotalAnimalesLote = (loteId) => {
    const asignacionesLote = asignaciones.filter(a => a.lote_id === loteId);
    return asignacionesLote.reduce((sum, a) => sum + a.cantidad, 0);
  };

  // Exponer función para usar desde el HTML generado dinámicamente
  useEffect(() => {
    window.moverAsignacion = (loteOrigenId, asignacionId) => {
      const input = document.getElementById(`cant-${asignacionId}`);
      const cantidad = parseInt(input.value);
      if (cantidad > 0) {
        handleMoverAnimales(loteOrigenId, asignacionId, cantidad);
      }
    };
    return () => {
      delete window.moverAsignacion;
    };
  }, [selectedLote, todasAsignaciones]);

  return (
    <div className="page">
      <h2>Mapa del campo</h2>
      <p style={{ color: '#666', marginBottom: '1rem' }}>
        Haz click en cada lote para ver y gestionar los animales
      </p>

      <div className="mapa-container">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
          <MapaSVG 
            lotes={lotes}
            onLoteClick={handleLoteClick}
            asignacionesPorLote={todasAsignaciones}
          />
        </div>
      </div>

      {showModal && selectedLote && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedLote.nombre}</h3>
              <button onClick={() => setShowModal(false)} className="close-btn">✕</button>
            </div>

            <div className="modal-body">
              <div className="lote-info">
                <p><strong>Superficie:</strong> {selectedLote.superficie}</p>
              </div>

              <div className="seccion">
                <h4>Animales en este lote</h4>
                {asignaciones.length > 0 ? (
                  <table className="mini-table">
                    <thead>
                      <tr>
                        <th>Tipo</th>
                        <th>Dueño</th>
                        <th>Cantidad</th>
                        <th>Fecha</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {asignaciones.map((asig) => (
                        <tr key={asig.id}>
                          <td>{asig.tipo_animal}</td>
                          <td><strong>{asig.dueno}</strong></td>
                          <td>{asig.cantidad}</td>
                          <td>{asig.fecha_asignacion}</td>
                          <td>
                            <button 
                              onClick={() => handleEliminarAsignacion(asig.id)}
                              className="btn-eliminar"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p style={{ color: '#999', fontStyle: 'italic' }}>No hay animales asignados</p>
                )}
              </div>

              <div className="seccion">
                <h4>Mover animales desde otro lote</h4>
                <div style={{ marginBottom: '1rem' }}>
                  <select 
                    id="lote-origen"
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd', marginBottom: '0.5rem' }}
                    onChange={(e) => {
                      const loteId = parseInt(e.target.value);
                      if (loteId) {
                        const lote = lotes.find(l => l.id === loteId);
                        const asignacionesLote = todasAsignaciones[lote.nombre] || [];
                        const container = document.getElementById('asignaciones-mover');
                        if (asignacionesLote.length > 0) {
                          container.style.display = 'block';
                          container.innerHTML = asignacionesLote.map(asig => `
                            <div style="display: flex; gap: 0.5rem; align-items: center; padding: 0.5rem; background: #f5f5f5; border-radius: 4px; margin-bottom: 0.5rem;">
                              <span style="flex: 1;">${asig.tipo_animal} - ${asig.dueno} (${asig.cantidad})</span>
                              <input type="number" id="cant-${asig.id}" min="1" max="${asig.cantidad}" value="${asig.cantidad}" style="width: 80px; padding: 0.3rem;" />
                              <button onclick="window.moverAsignacion(${loteId}, ${asig.id})" style="padding: 0.3rem 0.8rem; background: #ff9800; color: white; border: none; borderRadius: 4px; cursor: pointer;">Mover</button>
                            </div>
                          `).join('');
                        } else {
                          container.style.display = 'none';
                        }
                      } else {
                        document.getElementById('asignaciones-mover').style.display = 'none';
                      }
                    }}
                  >
                    <option value="">Seleccionar lote origen...</option>
                    {lotes.filter(l => l.id !== selectedLote.id).map(lote => {
                      const totalAnimales = (todasAsignaciones[lote.nombre] || []).reduce((sum, a) => sum + a.cantidad, 0);
                      return (
                        <option key={lote.id} value={lote.id}>
                          {lote.nombre} ({totalAnimales} animales)
                        </option>
                      );
                    })}
                  </select>
                  <div id="asignaciones-mover" style={{ display: 'none' }}></div>
                  <button 
                    onClick={() => {
                      const select = document.getElementById('lote-origen');
                      const loteOrigenId = select.value;
                      if (loteOrigenId) {
                        handleMoverAnimales(parseInt(loteOrigenId));
                        select.value = '';
                        document.getElementById('asignaciones-mover').style.display = 'none';
                      } else {
                        alert('Selecciona un lote origen');
                      }
                    }}
                    style={{ width: '100%', padding: '0.5rem 1rem', background: '#2c5f2d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Mover TODOS los animales del lote
                  </button>
                </div>
              </div>

              <div className="seccion">
                <h4>Agregar animales al lote</h4>
                <div style={{ marginBottom: '0.5rem', padding: '0.5rem', background: '#f0f0f0', borderRadius: '4px', fontSize: '0.9rem' }}>
                  <strong>Stock disponible:</strong> {getStockDisponible(formAsignacion.tipo_animal, formAsignacion.dueno)} {formAsignacion.tipo_animal} ({formAsignacion.dueno})
                </div>
                <form onSubmit={handleAgregarAsignacion} className="form-inline">
                  <select 
                    value={formAsignacion.tipo_animal}
                    onChange={(e) => setFormAsignacion({...formAsignacion, tipo_animal: e.target.value})}
                  >
                    {tiposAnimales.map(tipo => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                  </select>

                  <select 
                    value={formAsignacion.dueno}
                    onChange={(e) => setFormAsignacion({...formAsignacion, dueno: e.target.value})}
                  >
                    {duenos.map(dueno => (
                      <option key={dueno} value={dueno}>{dueno}</option>
                    ))}
                  </select>

                  <input 
                    type="number"
                    placeholder="Cantidad"
                    value={formAsignacion.cantidad}
                    onChange={(e) => setFormAsignacion({...formAsignacion, cantidad: e.target.value})}
                    max={getStockDisponible(formAsignacion.tipo_animal, formAsignacion.dueno)}
                    required
                  />

                  <button type="submit">Agregar</button>
                </form>
              </div>

              <div className="seccion">
                <h4>Notas del lote</h4>
                <textarea 
                  value={notasLote}
                  onChange={(e) => setNotasLote(e.target.value)}
                  placeholder="Escribe notas sobre este lote..."
                  rows="4"
                  style={{ width: '100%', padding: '0.5rem' }}
                />
                <button onClick={handleGuardarNotas} style={{ marginTop: '0.5rem' }}>
                  Guardar notas
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Mapa;
