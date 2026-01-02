import { useState } from 'react';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Usuarios válidos
  const users = {
    'Administrador': 'ramiyfer2011',
    'Sofia': 'ramiro15'
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (users[username] && users[username] === password) {
      onLogin(username);
      setError('');
    } else {
      setError('Usuario o contraseña incorrectos');
      setPassword('');
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'flex-start',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundImage: 'url(/images/entrada-campo.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      position: 'relative',
      padding: '2rem'
    }}>
      {/* Overlay oscuro */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.4)'
      }}></div>

      {/* Formulario de login */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '3rem',
        borderRadius: '12px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
        width: '100%',
        maxWidth: '400px',
        position: 'relative',
        zIndex: 1,
        backdropFilter: 'blur(10px)',
        marginLeft: '5%'
      }}>
        <h1 style={{ 
          textAlign: 'center', 
          marginBottom: '2rem',
          color: '#333',
          fontSize: '2rem'
        }}>
          Don José
        </h1>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem',
              color: '#555',
              fontWeight: '500'
            }}>
              Usuario
            </label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ingresá tu usuario"
              autoFocus
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #ddd',
                borderRadius: '6px',
                fontSize: '1rem',
                transition: 'border-color 0.3s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#ddd'}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem',
              color: '#555',
              fontWeight: '500'
            }}>
              Contraseña
            </label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingresá tu contraseña"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #ddd',
                borderRadius: '6px',
                fontSize: '1rem',
                transition: 'border-color 0.3s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#ddd'}
            />
          </div>
          
          {error && (
            <div style={{
              background: '#fee',
              color: '#c33',
              padding: '0.75rem',
              borderRadius: '6px',
              marginBottom: '1rem',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}
          
          <button 
            type="submit"
            style={{
              width: '100%',
              padding: '0.75rem',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background 0.3s'
            }}
            onMouseOver={(e) => e.target.style.background = '#5568d3'}
            onMouseOut={(e) => e.target.style.background = '#667eea'}
          >
            Ingresar
          </button>
        </form>
        
        <p style={{
          textAlign: 'center',
          marginTop: '2rem',
          color: '#999',
          fontSize: '0.9rem'
        }}>
          Sistema de gestión ganadera
        </p>
        <p style={{
          textAlign: 'center',
          marginTop: '1rem',
          color: '#bbb',
          fontSize: '0.8rem'
        }}>
          Desarrollado por Ramiro Villa
        </p>
      </div>
    </div>
  );
}

export default Login;
