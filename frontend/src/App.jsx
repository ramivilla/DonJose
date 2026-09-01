import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Stock from './pages/Stock';
import Mapa from './pages/Mapa';
import Nacimientos from './pages/Nacimientos';
import Muertes from './pages/Muertes';
import VentasTerneros from './pages/VentasTerneros';
import VentasVacasToros from './pages/VentasVacasToros';
import VentasCereales from './pages/VentasCereales';
import ComprasVacasToros from './pages/ComprasVacasToros';
import EstadisticasNacimientosMuertes from './pages/EstadisticasNacimientosMuertes';
import EstadisticasVentasCompras from './pages/EstadisticasVentasCompras';
import Login from './pages/Login';
import Movimientos from './pages/Movimientos';
import NacimientosEstadisticas from './pages/NacimientosEstadisticas';
import './App.css';

// Componente para el menú desplegable
function DropdownMenu({ title, children, isActive }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div 
      className="dropdown"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <span className={`dropdown-title ${isActive ? 'active' : ''}`}>
        {title} ▼
      </span>
      {isOpen && (
        <div className="dropdown-content">
          {children}
        </div>
      )}
    </div>
  );
}

// Componente principal de navegación
function Navigation({ currentUser, onLogout }) {
  const location = useLocation();
  
  const isVentasActive = ['/ventas-terneros', '/ventas-vacas-toros', '/ventas-cereales'].includes(location.pathname);
  const isComprasActive = ['/compras-vacas-toros'].includes(location.pathname);
  const isEstadisticasActive = ['/estadisticas-nacimientos-muertes', '/estadisticas-ventas-compras'].includes(location.pathname);
  const isNacimientosActive = ['/nacimientos', '/nacimientos-estadisticas'].includes(location.pathname);

  return (
    <nav className="navbar">
      <h1>Don José</h1>
      <div className="nav-links">
        <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
          Dashboard
        </Link>
        <Link to="/mapa" className={location.pathname === '/mapa' ? 'active' : ''}>
          Mapa
        </Link>

        <DropdownMenu title="Nacimientos" isActive={isNacimientosActive}>
          <Link to="/nacimientos">Registro</Link>
          <Link to="/nacimientos-estadisticas">Estadísticas</Link>
        </DropdownMenu>

        <Link to="/muertes" className={location.pathname === '/muertes' ? 'active' : ''}>
          Muertes
        </Link>
        
        <DropdownMenu title="Ventas" isActive={isVentasActive}>
          <Link to="/ventas-terneros">Terneros</Link>
          <Link to="/ventas-vacas-toros">Vacas/Toros</Link>
          <Link to="/ventas-cereales">Cereales</Link>
        </DropdownMenu>
        
        <DropdownMenu title="Compras" isActive={isComprasActive}>
          <Link to="/compras-vacas-toros">Vacas/Toros</Link>
        </DropdownMenu>
        
        <DropdownMenu title="Estadísticas" isActive={isEstadisticasActive}>
          <Link to="/estadisticas-nacimientos-muertes">Nacimientos/Muertes</Link>
          <Link to="/estadisticas-ventas-compras">Ventas/Compras</Link>
        </DropdownMenu>
        
        <Link to="/stock" className={location.pathname === '/stock' ? 'active' : ''}>
          Stock
        </Link>
        <Link to="/movimientos" className={location.pathname === '/movimientos' ? 'active' : ''}>
          Movimientos
        </Link>
        
        <span style={{ 
          color: 'white',
          padding: '0.5rem 1rem',
          marginLeft: 'auto'
        }}>
          👤 {currentUser}
        </span>
        <button 
          onClick={onLogout}
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
          Cerrar Sesión
        </button>
      </div>
    </nav>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState('');

  // Verificar si ya está autenticado al cargar
  useEffect(() => {
    const auth = localStorage.getItem('donjose_auth');
    const user = localStorage.getItem('donjose_user');
    if (auth === 'true' && user) {
      setIsAuthenticated(true);
      setCurrentUser(user);
    }
  }, []);

  const handleLogin = (username) => {
    localStorage.setItem('donjose_auth', 'true');
    localStorage.setItem('donjose_user', username);
    setIsAuthenticated(true);
    setCurrentUser(username);
  };

  const handleLogout = () => {
    localStorage.removeItem('donjose_auth');
    localStorage.removeItem('donjose_user');
    setIsAuthenticated(false);
    setCurrentUser('');
  };

  return (
    <BrowserRouter>
      {!isAuthenticated ? (
        <Routes>
          <Route path="*" element={<Login onLogin={handleLogin} />} />
        </Routes>
      ) : (
        <div className="app">
          <Navigation currentUser={currentUser} onLogout={handleLogout} />
          
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/mapa" element={<Mapa />} />
              <Route path="/nacimientos" element={<Nacimientos />} />
              <Route path="/nacimientos-estadisticas" element={<NacimientosEstadisticas />} />
              <Route path="/muertes" element={<Muertes />} />
              <Route path="/ventas-terneros" element={<VentasTerneros />} />
              <Route path="/ventas-vacas-toros" element={<VentasVacasToros />} />
              <Route path="/ventas-cereales" element={<VentasCereales />} />
              <Route path="/compras-vacas-toros" element={<ComprasVacasToros />} />
              <Route path="/estadisticas-nacimientos-muertes" element={<EstadisticasNacimientosMuertes />} />
              <Route path="/estadisticas-ventas-compras" element={<EstadisticasVentasCompras />} />
              <Route path="/stock" element={<Stock />} />
              <Route path="/movimientos" element={<Movimientos />} />
            </Routes>
          </main>
          <footer style={{
            textAlign: 'center',
            padding: '1rem',
            color: 'white',
            background: 'rgba(44, 95, 45, 0.9)',
            fontSize: '0.85rem'
          }}>
            Desarrollado por Ramiro Villa © {new Date().getFullYear()}
          </footer>
        </div>
      )}
    </BrowserRouter>
  );
}

export default App;
